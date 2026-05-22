"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { URL } = require("node:url");

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(ROOT, "data"));
const DB_FILE = path.join(DATA_DIR, "db.json");
const MONGODB_URI = process.env.MONGODB_URI || "";
const MONGODB_DB = process.env.MONGODB_DB || "know_my_sdg";
const MONGODB_COLLECTION = process.env.MONGODB_COLLECTION || "app_state";
const TOKEN_SECRET = process.env.APP_SECRET || "change-this-secret-before-production";
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;
const MAX_BODY_BYTES = 8 * 1024 * 1024;
let mongoClientPromise = null;

const DEFAULT_DB = {
  sdg: {
    users: [],
    notifications: [],
    teams: [],
    learn: {}
  },
  climate: {
    users: [],
    notifications: [],
    teams: [],
    learn: {}
  },
  feedback: []
};

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".txt": "text/plain; charset=utf-8"
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function ensureStore() {
  if (MONGODB_URI) {
    return;
  }

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(normalizeDb(clone(DEFAULT_DB)), null, 2));
  }
}

function normalizeDb(db) {
  const next = { ...clone(DEFAULT_DB), ...(db || {}) };
  for (const app of ["sdg", "climate"]) {
    next[app] = { ...clone(DEFAULT_DB[app]), ...(next[app] || {}) };
    next[app].users = Array.isArray(next[app].users) ? next[app].users : [];
    next[app].notifications = Array.isArray(next[app].notifications) ? next[app].notifications : [];
    next[app].teams = Array.isArray(next[app].teams) ? next[app].teams : [];
    next[app].learn = next[app].learn && typeof next[app].learn === "object" ? next[app].learn : {};
  }
  next.feedback = Array.isArray(next.feedback) ? next.feedback : [];
  return next;
}

async function getMongoCollection() {
  if (!MONGODB_URI) {
    return null;
  }

  if (!mongoClientPromise) {
    const { MongoClient } = require("mongodb");
    const client = new MongoClient(MONGODB_URI);
    mongoClientPromise = client.connect();
  }

  const client = await mongoClientPromise;
  return client.db(MONGODB_DB).collection(MONGODB_COLLECTION);
}

async function readDb() {
  const collection = await getMongoCollection();
  if (collection) {
    const doc = await collection.findOne({ _id: "main" });
    if (!doc) {
      const initial = normalizeDb(clone(DEFAULT_DB));
      await collection.updateOne({ _id: "main" }, { $set: initial }, { upsert: true });
      return initial;
    }

    const { _id, ...db } = doc;
    return normalizeDb(db);
  }

  ensureStore();
  try {
    return normalizeDb(JSON.parse(fs.readFileSync(DB_FILE, "utf8")));
  } catch {
    return clone(DEFAULT_DB);
  }
}

async function writeDb(db) {
  const normalized = normalizeDb(db);
  const collection = await getMongoCollection();
  if (collection) {
    await collection.updateOne({ _id: "main" }, { $set: normalized }, { upsert: true });
    return;
  }

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tempFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(normalized, null, 2));
  fs.renameSync(tempFile, DB_FILE);
}

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body)
  });
  res.end(body);
}

function sendError(res, status, message) {
  sendJson(res, status, { ok: false, message });
}

function setCors(req, res) {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("Request body is too large."));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("Invalid JSON body."));
      }
    });
    req.on("error", reject);
  });
}

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function fromBase64url(input) {
  const padded = input + "=".repeat((4 - (input.length % 4)) % 4);
  return Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

function signToken(payload) {
  const body = base64url(JSON.stringify(payload));
  const sig = crypto.createHmac("sha256", TOKEN_SECRET).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function verifyToken(token) {
  if (!token || !token.includes(".")) {
    return null;
  }

  const [body, sig] = token.split(".");
  const expected = crypto.createHmac("sha256", TOKEN_SECRET).update(body).digest("base64url");
  const left = Buffer.from(sig);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) {
    return null;
  }

  try {
    const payload = JSON.parse(fromBase64url(body));
    if (!payload.exp || Date.now() > payload.exp * 1000) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function getBearerToken(req) {
  const auth = req.headers.authorization || "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : "";
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const passwordHash = crypto.pbkdf2Sync(String(password || ""), salt, 120000, 32, "sha256").toString("hex");
  return { salt, passwordHash };
}

function verifyPassword(user, password) {
  if (!user) {
    return false;
  }

  if (user.passwordHash && user.salt) {
    const { passwordHash } = hashPassword(password, user.salt);
    const left = Buffer.from(user.passwordHash, "hex");
    const right = Buffer.from(passwordHash, "hex");
    return left.length === right.length && crypto.timingSafeEqual(left, right);
  }

  return typeof user.password === "string" && user.password === String(password || "");
}

function normalizeAppName(value) {
  const app = String(value || "").trim().toLowerCase();
  if (app === "sdg" || app === "sdgs") {
    return "sdg";
  }
  if (app === "climate") {
    return "climate";
  }
  return "";
}

function normalizeUserInput(input) {
  return {
    firstName: String(input.firstName || input.name || "").trim(),
    lastName: String(input.lastName || "").trim(),
    email: String(input.email || "").trim().toLowerCase(),
    phone: String(input.phone || "").trim(),
    country: String(input.country || "").trim(),
    state: String(input.state || "").trim(),
    gender: String(input.gender || input.sex || "").trim(),
    classRole: String(input.classRole || input.class || "").trim(),
    username: String(input.username || "").trim(),
    role: String(input.role || "Student").trim() || "Student",
    avatar: String(input.avatar || ""),
    quizScore: Number(input.quizScore || 0),
    challengeScore: Number(input.challengeScore || 0),
    puzzleScore: Number(input.puzzleScore || 0),
    generalScore: Number(input.generalScore || 0)
  };
}

function recalcGeneralScore(user) {
  user.generalScore =
    Number(user.quizScore || 0) +
    Number(user.challengeScore || 0) +
    Number(user.puzzleScore || 0);
  return user;
}

function sanitizeUser(user) {
  const clean = normalizeUserInput(user || {});
  clean.createdAt = user.createdAt || "";
  clean.updatedAt = user.updatedAt || "";
  return recalcGeneralScore(clean);
}

function userKey(username) {
  return String(username || "").trim().toLowerCase();
}

function findUserIndex(users, query) {
  const value = String(query || "").trim().toLowerCase();
  return users.findIndex((user) => userKey(user.username) === value || String(user.email || "").toLowerCase() === value);
}

function createSession(appName, user) {
  const token = signToken({
    app: appName,
    username: user.username,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS
  });
  return { token, user: sanitizeUser(user) };
}

function requireUser(req, db, appName) {
  const payload = verifyToken(getBearerToken(req));
  if (!payload || payload.app !== appName) {
    return null;
  }

  const app = db[appName];
  const index = findUserIndex(app.users, payload.username);
  if (index < 0) {
    return null;
  }

  return { user: app.users[index], index };
}

function assertUsername(username) {
  return /^[a-zA-Z0-9._-]{3,20}$/.test(username);
}

function generateId(prefix) {
  return `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
}

async function handleSignup(req, res, appName, db) {
  const body = await parseBody(req);
  const clean = normalizeUserInput(body);
  const password = String(body.password || "");

  if (!assertUsername(clean.username)) {
    sendError(res, 400, "Use a valid username with 3-20 letters, numbers, dots, underscores, or hyphens.");
    return;
  }

  if (!clean.email || !clean.email.includes("@")) {
    sendError(res, 400, "Use a valid email address.");
    return;
  }

  if (password.length < 8) {
    sendError(res, 400, "Password must be at least 8 characters.");
    return;
  }

  const app = db[appName];
  if (app.users.some((user) => userKey(user.username) === userKey(clean.username))) {
    sendError(res, 409, "That username is already taken.");
    return;
  }

  if (app.users.some((user) => String(user.email || "").toLowerCase() === clean.email)) {
    sendError(res, 409, "An account with that email already exists.");
    return;
  }

  const passwordData = hashPassword(password);
  const user = recalcGeneralScore({
    ...clean,
    ...passwordData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  app.users.push(user);
  await writeDb(db);
  sendJson(res, 201, { ok: true, ...createSession(appName, user) });
}

async function handleLogin(req, res, appName, db) {
  const body = await parseBody(req);
  const identifier = String(body.email || body.username || "").trim().toLowerCase();
  const password = String(body.password || "");
  const app = db[appName];
  const index = findUserIndex(app.users, identifier);
  const user = index >= 0 ? app.users[index] : null;

  if (!verifyPassword(user, password)) {
    sendError(res, 401, "Invalid email or password.");
    return;
  }

  if (!user.passwordHash || !user.salt) {
    const passwordData = hashPassword(password);
    delete user.password;
    Object.assign(user, passwordData, { updatedAt: new Date().toISOString() });
    await writeDb(db);
  }

  sendJson(res, 200, { ok: true, ...createSession(appName, user) });
}

async function handleResetPassword(req, res, appName, db) {
  const body = await parseBody(req);
  const username = userKey(body.username);
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || body.nextPassword || "");
  const app = db[appName];
  const index = app.users.findIndex((user) => userKey(user.username) === username && String(user.email || "").toLowerCase() === email);

  if (index < 0) {
    sendError(res, 404, "No account matches that username and email.");
    return;
  }

  if (password.length < 8) {
    sendError(res, 400, "Password must be at least 8 characters.");
    return;
  }

  const passwordData = hashPassword(password);
  delete app.users[index].password;
  Object.assign(app.users[index], passwordData, { updatedAt: new Date().toISOString() });
  await writeDb(db);
  sendJson(res, 200, { ok: true, user: sanitizeUser(app.users[index]) });
}

async function handleScore(req, res, appName, db) {
  const current = requireUser(req, db, appName);
  if (!current) {
    sendError(res, 401, "Login required.");
    return;
  }

  const body = await parseBody(req);
  const field = String(body.field || "");
  const delta = Number(body.delta || 0);
  if (!["quizScore", "challengeScore", "puzzleScore"].includes(field)) {
    sendError(res, 400, "Invalid score field.");
    return;
  }

  current.user[field] = Number(current.user[field] || 0) + delta;
  recalcGeneralScore(current.user);
  current.user.updatedAt = new Date().toISOString();
  await writeDb(db);
  sendJson(res, 200, { ok: true, user: sanitizeUser(current.user) });
}

async function handleAvatar(req, res, appName, db) {
  const current = requireUser(req, db, appName);
  if (!current) {
    sendError(res, 401, "Login required.");
    return;
  }

  const body = await parseBody(req);
  current.user.avatar = String(body.avatar || body.dataUrl || "");
  current.user.updatedAt = new Date().toISOString();
  await writeDb(db);
  sendJson(res, 200, { ok: true, user: sanitizeUser(current.user) });
}

async function handleNotifications(req, res, appName, db, segments) {
  const current = requireUser(req, db, appName);
  if (!current) {
    sendError(res, 401, "Login required.");
    return;
  }

  const app = db[appName];
  const username = userKey(current.user.username);

  if (req.method === "GET") {
    const notifications = app.notifications.filter((item) => userKey(item.to) === username);
    sendJson(res, 200, { ok: true, notifications });
    return;
  }

  if (req.method === "POST" && segments.length === 3) {
    const body = await parseBody(req);
    const to = String(body.to || "").trim();
    if (!to) {
      sendError(res, 400, "Notification recipient is required.");
      return;
    }

    const item = {
      id: generateId("note"),
      createdAt: new Date().toISOString(),
      status: "pending",
      type: String(body.type || "system"),
      to,
      from: String(body.from || current.user.username),
      title: String(body.title || "Notification"),
      message: String(body.message || ""),
      teamId: body.teamId || "",
      teamName: body.teamName || ""
    };
    app.notifications.unshift(item);
    await writeDb(db);
    sendJson(res, 201, { ok: true, notification: item });
    return;
  }

  if (req.method === "PATCH" && segments.length === 4) {
    const id = segments[3];
    const index = app.notifications.findIndex((item) => item.id === id);
    if (index < 0) {
      sendError(res, 404, "Notification not found.");
      return;
    }

    const note = app.notifications[index];
    if (userKey(note.to) !== username && userKey(note.from) !== username) {
      sendError(res, 403, "You cannot update this notification.");
      return;
    }

    const body = await parseBody(req);
    app.notifications[index] = {
      ...note,
      status: body.status || note.status,
      respondedAt: body.respondedAt || note.respondedAt || ""
    };
    await writeDb(db);
    sendJson(res, 200, { ok: true, notification: app.notifications[index] });
    return;
  }

  sendError(res, 404, "Notification route not found.");
}

function countTeamsForUsername(teams, username) {
  const key = userKey(username);
  return teams.filter((team) => (team.members || []).some((member) => userKey(member) === key)).length;
}

async function handleTeams(req, res, appName, db, segments) {
  const app = db[appName];

  if (req.method === "GET") {
    sendJson(res, 200, { ok: true, teams: app.teams });
    return;
  }

  const current = requireUser(req, db, appName);
  if (!current) {
    sendError(res, 401, "Login required.");
    return;
  }

  if (req.method === "POST" && segments.length === 3) {
    const body = await parseBody(req);
    const cleanName = String(body.teamName || body.name || "").trim();
    const owner = current.user.username;
    const members = Array.from(
      new Set(
        [owner, ...(Array.isArray(body.members) ? body.members : [])]
          .map((member) => String(member || "").trim())
          .filter(Boolean)
      )
    );

    if (!cleanName) {
      sendError(res, 400, "Team name is required.");
      return;
    }

    if (members.length < 2 || members.length > 10) {
      sendError(res, 400, "Teams must have between 2 and 10 members.");
      return;
    }

    if (app.teams.some((team) => String(team.name || "").toLowerCase() === cleanName.toLowerCase())) {
      sendError(res, 409, "That team name is already being used.");
      return;
    }

    const missingUsers = members.filter((member) => !app.users.some((user) => userKey(user.username) === userKey(member)));
    if (missingUsers.length) {
      sendError(res, 404, `Unknown usernames: ${missingUsers.join(", ")}.`);
      return;
    }

    const overloaded = members.filter((member) => countTeamsForUsername(app.teams, member) >= 3);
    if (overloaded.length) {
      sendError(res, 400, `${overloaded.join(", ")} already reached the 3-team limit.`);
      return;
    }

    const team = {
      id: generateId("team"),
      name: cleanName,
      owner,
      members: [owner],
      invited: members.filter((member) => userKey(member) !== userKey(owner)),
      createdAt: new Date().toISOString()
    };

    app.teams.unshift(team);
    team.invited.forEach((member) => {
      app.notifications.unshift({
        id: generateId("note"),
        createdAt: new Date().toISOString(),
        status: "pending",
        type: "team_invite",
        to: member,
        from: owner,
        title: `Team invitation from ${owner}`,
        message: `${owner} invited you to join team "${cleanName}".`,
        teamId: team.id,
        teamName: cleanName
      });
    });

    await writeDb(db);
    sendJson(res, 201, { ok: true, team, teams: app.teams });
    return;
  }

  if (req.method === "POST" && segments[3] === "respond") {
    const body = await parseBody(req);
    const note = app.notifications.find((item) => item.id === body.notificationId);
    if (!note || note.type !== "team_invite" || userKey(note.to) !== userKey(current.user.username)) {
      sendError(res, 404, "Team invite not found.");
      return;
    }

    if (!body.accept) {
      note.status = "declined";
      note.respondedAt = new Date().toISOString();
      await writeDb(db);
      sendJson(res, 200, { ok: true, message: "Team invitation declined." });
      return;
    }

    if (countTeamsForUsername(app.teams, current.user.username) >= 3) {
      sendError(res, 400, "You cannot join more than 3 teams.");
      return;
    }

    const team = app.teams.find((entry) => entry.id === note.teamId);
    if (!team) {
      sendError(res, 404, "This team no longer exists.");
      return;
    }

    if (!team.members.some((member) => userKey(member) === userKey(current.user.username))) {
      team.members.push(current.user.username);
    }
    team.invited = (team.invited || []).filter((member) => userKey(member) !== userKey(current.user.username));
    note.status = "accepted";
    note.respondedAt = new Date().toISOString();
    await writeDb(db);
    sendJson(res, 200, { ok: true, message: `You joined team "${team.name}".`, team, teams: app.teams });
    return;
  }

  sendError(res, 404, "Team route not found.");
}

async function handleLearn(req, res, appName, db, segments) {
  const current = requireUser(req, db, appName);
  if (!current) {
    sendError(res, 401, "Login required.");
    return;
  }

  const app = db[appName];
  const key = userKey(current.user.username);
  const progress = app.learn[key] || { unlockedStage: 1, completedStages: [], stageTimes: {} };

  if (req.method === "GET") {
    sendJson(res, 200, { ok: true, progress });
    return;
  }

  if (req.method === "POST" && segments[3] === "complete") {
    const body = await parseBody(req);
    const stageNumber = Math.max(1, Math.min(4, Number(body.stageNumber || body.stage || 1)));
    const secondsSpent = Number(body.secondsSpent || body.seconds || 0);
    const completed = new Set(progress.completedStages || []);
    completed.add(stageNumber);
    app.learn[key] = {
      unlockedStage: Math.min(4, Math.max(progress.unlockedStage || 1, stageNumber + 1)),
      completedStages: Array.from(completed).sort((left, right) => left - right),
      stageTimes: {
        ...(progress.stageTimes || {}),
        [stageNumber]: secondsSpent
      }
    };
    await writeDb(db);
    sendJson(res, 200, { ok: true, progress: app.learn[key] });
    return;
  }

  sendError(res, 404, "Learn route not found.");
}

async function handleFeedback(req, res, db) {
  if (req.method !== "POST") {
    sendError(res, 405, "Method not allowed.");
    return;
  }

  const body = await parseBody(req);
  const item = {
    id: generateId("feedback"),
    app: normalizeAppName(body.app) || "general",
    name: String(body.name || ""),
    email: String(body.email || ""),
    country: String(body.country || ""),
    message: String(body.message || body.msg || ""),
    createdAt: new Date().toISOString()
  };
  db.feedback.unshift(item);
  await writeDb(db);
  sendJson(res, 201, { ok: true, feedback: item });
}

async function handleApi(req, res, parsedUrl) {
  setCors(req, res);
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const segments = parsedUrl.pathname.split("/").filter(Boolean);
  const db = await readDb();

  if (segments[1] === "health") {
    sendJson(res, 200, { ok: true, name: "SDG/Climate Learning Hub", time: new Date().toISOString() });
    return;
  }

  if (segments[1] === "feedback") {
    await handleFeedback(req, res, db);
    return;
  }

  const appName = normalizeAppName(segments[1]);
  if (!appName) {
    sendError(res, 404, "Unknown API app.");
    return;
  }

  const app = db[appName];
  const route = segments.slice(2).join("/");

  if (req.method === "GET" && route === "users") {
    sendJson(res, 200, { ok: true, users: app.users.map(sanitizeUser) });
    return;
  }

  if (req.method === "POST" && route === "auth/signup") {
    await handleSignup(req, res, appName, db);
    return;
  }

  if (req.method === "POST" && route === "auth/login") {
    await handleLogin(req, res, appName, db);
    return;
  }

  if (req.method === "POST" && route === "auth/reset-password") {
    await handleResetPassword(req, res, appName, db);
    return;
  }

  if (req.method === "GET" && route === "me") {
    const current = requireUser(req, db, appName);
    if (!current) {
      sendError(res, 401, "Login required.");
      return;
    }
    sendJson(res, 200, { ok: true, user: sanitizeUser(current.user) });
    return;
  }

  if (req.method === "POST" && route === "me/score") {
    await handleScore(req, res, appName, db);
    return;
  }

  if (req.method === "POST" && route === "me/avatar") {
    await handleAvatar(req, res, appName, db);
    return;
  }

  if (segments[2] === "notifications") {
    await handleNotifications(req, res, appName, db, segments);
    return;
  }

  if (segments[2] === "teams") {
    await handleTeams(req, res, appName, db, segments);
    return;
  }

  if (segments[2] === "learn") {
    await handleLearn(req, res, appName, db, segments);
    return;
  }

  sendError(res, 404, "API route not found.");
}

function resolveCaseInsensitive(baseDir, relativePath) {
  const safeRelative = path
    .normalize(relativePath)
    .replace(/^(\.\.(?:[\\/]|$))+/, "")
    .replace(/^[/\\]+/, "");
  const parts = safeRelative.split(/[\\/]+/).filter(Boolean);
  let current = baseDir;

  for (const part of parts) {
    if (!fs.existsSync(current) || !fs.statSync(current).isDirectory()) {
      return path.join(current, part);
    }

    const entries = fs.readdirSync(current);
    const match = entries.find((entry) => entry === part) || entries.find((entry) => entry.toLowerCase() === part.toLowerCase());
    current = path.join(current, match || part);
  }

  return current;
}

function serveStatic(req, res, parsedUrl) {
  let urlPath = decodeURIComponent(parsedUrl.pathname);
  if (urlPath === "/") {
    urlPath = "/SDGs/FRONT END/HOME/index.html";
  }

  let filePath = resolveCaseInsensitive(ROOT, urlPath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = resolveCaseInsensitive(filePath, "index.html");
  }

  const rootWithSep = ROOT.endsWith(path.sep) ? ROOT : ROOT + path.sep;
  if (!filePath.startsWith(rootWithSep) && filePath !== ROOT) {
    sendError(res, 403, "Forbidden.");
    return;
  }

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    sendError(res, 404, "File not found.");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    "Content-Type": MIME_TYPES[ext] || "application/octet-stream"
  });
  fs.createReadStream(filePath).pipe(res);
}

async function handleApiRequest(req, res) {
  const parsedUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  await handleApi(req, res, parsedUrl);
}

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  if (parsedUrl.pathname.startsWith("/api/")) {
    handleApiRequest(req, res).catch((error) => {
      sendError(res, error.message === "Request body is too large." ? 413 : 500, error.message || "Server error.");
    });
    return;
  }
  serveStatic(req, res, parsedUrl);
});

if (require.main === module) {
  server.listen(PORT, () => {
    ensureStore();
    console.log(`SDG/Climate Learning Hub running at http://localhost:${PORT}`);
  });
}

module.exports = {
  handleApiRequest,
  server
};
