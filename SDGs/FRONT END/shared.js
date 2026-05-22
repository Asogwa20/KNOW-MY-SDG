(function () {
  const STORAGE = {
    users: "sdg_users",
    active: "sdg_activeUser",
    token: "sdg_token",
    theme: "sdg_theme",
    notifications: "sdg_notifications",
    teams: "sdg_teams",
    learn: "sdg_learn_progress"
  };

  const PUBLIC_PAGES = new Set(["home", "login", "general"]);
  const MEDAL_LABELS = ["Gold", "Silver", "Bronze"];

  const state = {
    users: [],
    notifications: [],
    teams: [],
    learn: {}
  };

  let readyResolved = false;
  let resolveReady;
  const ready = new Promise((resolve) => {
    resolveReady = resolve;
  });

  function parseJSON(value, fallback) {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  }

  function normalizeUser(user) {
    if (!user || typeof user !== "object") {
      return null;
    }

    const normalized = {
      firstName: String(user.firstName || user.name || "").trim(),
      lastName: String(user.lastName || "").trim(),
      email: String(user.email || "").trim().toLowerCase(),
      phone: String(user.phone || "").trim(),
      country: String(user.country || "").trim(),
      state: String(user.state || "").trim(),
      gender: String(user.gender || user.sex || "").trim(),
      classRole: String(user.classRole || user.class || "").trim(),
      username: String(user.username || "").trim(),
      role: String(user.role || "Student"),
      avatar: String(user.avatar || ""),
      quizScore: Number(user.quizScore || 0),
      challengeScore: Number(user.challengeScore || 0),
      puzzleScore: Number(user.puzzleScore || 0),
      generalScore: Number(user.generalScore || 0)
    };

    normalized.generalScore =
      Number(normalized.quizScore || 0) +
      Number(normalized.challengeScore || 0) +
      Number(normalized.puzzleScore || 0);

    return normalized.username || normalized.email ? normalized : null;
  }

  function loadLocalState() {
    state.users = parseJSON(localStorage.getItem(STORAGE.users), [])
      .map(normalizeUser)
      .filter(Boolean);
    state.notifications = parseJSON(localStorage.getItem(STORAGE.notifications), []);
    state.teams = parseJSON(localStorage.getItem(STORAGE.teams), []);
    state.learn = parseJSON(localStorage.getItem(STORAGE.learn), {});
  }

  function saveLocalState() {
    const users = state.users.map(normalizeUser).filter(Boolean);
    localStorage.setItem(STORAGE.users, JSON.stringify(users));
    localStorage.setItem("users", JSON.stringify(users));
    localStorage.setItem(STORAGE.notifications, JSON.stringify(state.notifications));
    localStorage.setItem(STORAGE.teams, JSON.stringify(state.teams));
    localStorage.setItem(STORAGE.learn, JSON.stringify(state.learn));
  }

  function getToken() {
    return localStorage.getItem(STORAGE.token) || "";
  }

  function dispatchDataEvent() {
    saveLocalState();
    window.dispatchEvent(new CustomEvent("sdg:data", { detail: { ...state } }));
  }

  function finishReady() {
    if (!readyResolved) {
      readyResolved = true;
      resolveReady();
    }
  }

  async function api(path, options = {}) {
    const headers = {
      "Content-Type": "application/json"
    };
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`/api/sdg${path}`, {
      method: options.method || "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.message || "Request failed.");
      error.status = response.status;
      throw error;
    }
    return data;
  }

  function getUsers() {
    return state.users.map(normalizeUser).filter(Boolean);
  }

  function saveUsers(users) {
    state.users = users.map(normalizeUser).filter(Boolean);
    saveLocalState();
  }

  function getCurrentUser() {
    return normalizeUser(parseJSON(localStorage.getItem(STORAGE.active), null));
  }

  function setCurrentUser(user, token) {
    const normalized = normalizeUser(user);

    if (!normalized) {
      localStorage.removeItem(STORAGE.active);
      localStorage.removeItem(STORAGE.token);
      localStorage.removeItem("activeUser");
      localStorage.removeItem("sdg_user");
      localStorage.removeItem("sdgUser");
      localStorage.removeItem("user");
      window.active = {};
      return null;
    }

    if (typeof token === "string") {
      localStorage.setItem(STORAGE.token, token);
    }
    localStorage.setItem(STORAGE.active, JSON.stringify(normalized));
    localStorage.setItem("activeUser", JSON.stringify(normalized));
    localStorage.setItem("sdg_user", JSON.stringify(normalized));
    localStorage.setItem("sdgUser", JSON.stringify(normalized));
    localStorage.setItem("user", JSON.stringify(normalized));
    window.active = normalized;
    return normalized;
  }

  function mergeUser(user) {
    const normalized = normalizeUser(user);
    if (!normalized) {
      return null;
    }
    const index = state.users.findIndex(
      (entry) =>
        entry.username.toLowerCase() === normalized.username.toLowerCase() ||
        entry.email === normalized.email
    );
    if (index >= 0) {
      state.users[index] = { ...state.users[index], ...normalized };
    } else {
      state.users.push(normalized);
    }
    saveLocalState();
    return index >= 0 ? state.users[index] : normalized;
  }

  function findUser(query) {
    const value = String(query || "").trim().toLowerCase();
    if (!value) {
      return null;
    }
    return (
      getUsers().find(
        (entry) => entry.username.toLowerCase() === value || entry.email === value
      ) || null
    );
  }

  function isUsernameAvailable(username, ignoreUsername) {
    const value = String(username || "").trim().toLowerCase();
    const ignore = String(ignoreUsername || "").trim().toLowerCase();
    if (!value) {
      return false;
    }
    return !getUsers().some((entry) => {
      const currentName = entry.username.toLowerCase();
      return currentName === value && currentName !== ignore;
    });
  }

  function upsertUser(user) {
    const saved = mergeUser(user);
    dispatchDataEvent();
    return saved;
  }

  async function signup(user) {
    try {
      const data = await api("/auth/signup", {
        method: "POST",
        body: user
      });
      mergeUser(data.user);
      setCurrentUser(data.user, data.token);
      await syncFromServer();
      return { ok: true, user: data.user };
    } catch (error) {
      return { ok: false, message: error.message };
    }
  }

  async function login(identifier, password) {
    try {
      const data = await api("/auth/login", {
        method: "POST",
        body: { email: identifier, username: identifier, password }
      });
      mergeUser(data.user);
      setCurrentUser(data.user, data.token);
      await syncFromServer();
      return { ok: true, user: data.user };
    } catch (error) {
      return { ok: false, message: error.message };
    }
  }

  function logout() {
    setCurrentUser(null);
    window.location.href = "../HOME/index.html";
  }

  function updateLocalScore(field, delta) {
    const active = getCurrentUser();
    if (!active) {
      return null;
    }

    active[field] = Number(active[field] || 0) + Number(delta || 0);
    active.generalScore =
      Number(active.quizScore || 0) +
      Number(active.challengeScore || 0) +
      Number(active.puzzleScore || 0);
    mergeUser(active);
    setCurrentUser(active);
    dispatchDataEvent();
    return active;
  }

  function updateUserScore(field, delta) {
    const local = updateLocalScore(field, delta);
    if (!local || !getToken()) {
      return local;
    }

    api("/me/score", {
      method: "POST",
      body: { field, delta }
    })
      .then((data) => {
        mergeUser(data.user);
        setCurrentUser(data.user);
        dispatchDataEvent();
      })
      .catch(() => {});

    return local;
  }

  function getNotifications() {
    return state.notifications.slice();
  }

  function saveNotifications(notifications) {
    state.notifications = notifications.slice();
    saveLocalState();
  }

  function getUserNotifications(username) {
    const key = String(username || "").trim().toLowerCase();
    return getNotifications().filter(
      (item) => String(item.to || "").trim().toLowerCase() === key
    );
  }

  function createNotification(notification) {
    const item = {
      id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      status: "pending",
      ...notification
    };
    state.notifications.unshift(item);
    dispatchDataEvent();

    if (getToken()) {
      api("/notifications", {
        method: "POST",
        body: notification
      })
        .then((data) => {
          state.notifications = state.notifications.filter((entry) => entry.id !== item.id);
          state.notifications.unshift(data.notification);
          dispatchDataEvent();
        })
        .catch(() => {});
    }

    return item;
  }

  function updateNotification(id, updates) {
    state.notifications = state.notifications.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    );
    dispatchDataEvent();

    if (getToken()) {
      api(`/notifications/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: updates
      }).catch(() => {});
    }

    return state.notifications.find((item) => item.id === id) || null;
  }

  function getTeams() {
    return state.teams.slice();
  }

  function saveTeams(teams) {
    state.teams = teams.slice();
    saveLocalState();
  }

  function countTeamsForUser(username) {
    const key = String(username || "").trim().toLowerCase();
    return getTeams().filter((team) =>
      (team.members || []).some((member) => String(member).toLowerCase() === key)
    ).length;
  }

  async function createTeam(teamName, owner, members) {
    const cleanName = String(teamName || "").trim();
    const ownerName = String(owner || "").trim();
    const uniqueMembers = Array.from(
      new Set(members.map((member) => String(member || "").trim()).filter(Boolean))
    );

    if (uniqueMembers.length < 2 || uniqueMembers.length > 10) {
      return { ok: false, message: "Teams must have between 2 and 10 members." };
    }

    if (getTeams().some((team) => team.name.toLowerCase() === cleanName.toLowerCase())) {
      return { ok: false, message: "That team name is already being used." };
    }

    const missingUsers = uniqueMembers.filter(
      (member) => !getUsers().some((user) => user.username.toLowerCase() === member.toLowerCase())
    );
    if (missingUsers.length) {
      return { ok: false, message: `Unknown usernames: ${missingUsers.join(", ")}.` };
    }

    const overloaded = uniqueMembers.filter((member) => countTeamsForUser(member) >= 3);
    if (overloaded.length) {
      return { ok: false, message: `${overloaded.join(", ")} already reached the 3-team limit.` };
    }

    try {
      const data = await api("/teams", {
        method: "POST",
        body: { teamName: cleanName, owner: ownerName, members: uniqueMembers }
      });
      state.teams = data.teams || [data.team, ...state.teams];
      await syncFromServer();
      return { ok: true, team: data.team };
    } catch (error) {
      return { ok: false, message: error.message };
    }
  }

  async function respondToTeamInvite(notificationId, accept) {
    const current = getCurrentUser();
    if (!current) {
      return { ok: false, message: "Login required." };
    }

    if (!getToken()) {
      updateNotification(notificationId, {
        status: accept ? "accepted" : "declined",
        respondedAt: new Date().toISOString()
      });
      return { ok: true, message: accept ? "Team invitation accepted." : "Team invitation declined." };
    }

    try {
      const data = await api("/teams/respond", {
        method: "POST",
        body: { notificationId, accept }
      });
      await syncFromServer();
      return data;
    } catch (error) {
      return { ok: false, message: error.message };
    }
  }

  function getLearnProgress() {
    return { ...state.learn };
  }

  function getUserLearnProgress(username) {
    const all = getLearnProgress();
    return all[String(username || "").trim().toLowerCase()] || {
      unlockedStage: 1,
      completedStages: [],
      stageTimes: {}
    };
  }

  function saveUserLearnProgress(username, progress) {
    state.learn[String(username || "").trim().toLowerCase()] = progress;
    saveLocalState();
    return progress;
  }

  function completeLearnStage(username, stageNumber, secondsSpent) {
    const progress = getUserLearnProgress(username);
    const completed = new Set(progress.completedStages || []);
    completed.add(stageNumber);
    const nextUnlocked = Math.min(4, Math.max(progress.unlockedStage || 1, stageNumber + 1));
    const next = {
      unlockedStage: nextUnlocked,
      completedStages: Array.from(completed).sort((left, right) => left - right),
      stageTimes: {
        ...(progress.stageTimes || {}),
        [stageNumber]: Number(secondsSpent || 0)
      }
    };
    saveUserLearnProgress(username, next);
    dispatchDataEvent();

    if (getToken()) {
      api("/learn/complete", {
        method: "POST",
        body: { stageNumber, secondsSpent }
      }).catch(() => {});
    }

    return next;
  }

  function updateAvatar(dataUrl) {
    const current = getCurrentUser();
    if (!current) {
      return null;
    }

    const next = upsertUser({ ...current, avatar: dataUrl });
    setCurrentUser(next);

    if (getToken()) {
      api("/me/avatar", {
        method: "POST",
        body: { avatar: dataUrl }
      })
        .then((data) => {
          mergeUser(data.user);
          setCurrentUser(data.user);
          dispatchDataEvent();
        })
        .catch(() => {});
    }

    return next;
  }

  async function resetPassword(username, email, nextPassword) {
    try {
      const data = await api("/auth/reset-password", {
        method: "POST",
        body: { username, email, nextPassword }
      });
      return { ok: true, user: data.user };
    } catch (error) {
      return { ok: false, message: error.message };
    }
  }

  function migrateStorage() {
    const legacyUsers = parseJSON(localStorage.getItem("users"), []);
    if (!localStorage.getItem(STORAGE.users) && Array.isArray(legacyUsers) && legacyUsers.length) {
      saveUsers(legacyUsers);
    }

    const legacyActive =
      parseJSON(localStorage.getItem("activeUser"), null) ||
      parseJSON(localStorage.getItem("sdg_user"), null) ||
      parseJSON(localStorage.getItem("sdgUser"), null) ||
      parseJSON(localStorage.getItem("user"), null);

    if (!localStorage.getItem(STORAGE.active) && legacyActive) {
      setCurrentUser(legacyActive);
    }

    const current = getCurrentUser();
    if (current) {
      mergeUser(current);
      setCurrentUser(current);
    }
  }

  function showToast(message) {
    const existing = document.getElementById("sdgToast");
    if (existing) {
      existing.remove();
    }

    const toast = document.createElement("div");
    toast.id = "sdgToast";
    toast.className = "sdg-toast";
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 2600);
  }

  function applyTheme(theme) {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE.theme, theme);
  }

  function toggleTheme() {
    const current = localStorage.getItem(STORAGE.theme) || "light";
    applyTheme(current === "light" ? "dark" : "light");
  }

  function getLoginPath() {
    return "../LOGIN/index.html";
  }

  function requireAuth() {
    const current = getCurrentUser();
    if (current) {
      return current;
    }

    const currentPath = window.location.pathname + window.location.search;
    window.location.href = `${getLoginPath()}?return=${encodeURIComponent(currentPath)}`;
    return null;
  }

  function setupToolbar() {
    if (document.querySelector(".sdg-toolbar")) {
      return;
    }

    const toolbar = document.createElement("div");
    toolbar.className = "sdg-toolbar";
    const current = getCurrentUser();
    toolbar.innerHTML = `
      <div class="sdg-toolbar-card">
        <div>
          <strong>${current ? `Welcome back, ${escapeHtml(current.username)}` : "SDG Hub Experience"}</strong>
          <small>${current ? "Your progress, teams, and notifications are saved to the hub." : "Login or sign up to unlock the student sections."}</small>
        </div>
      </div>
      <div class="sdg-toolbar-actions">
        <button type="button" class="sdg-chip" id="sdgThemeToggle">Theme</button>
        ${
          current
            ? '<button type="button" class="sdg-chip" id="sdgLogoutBtn">Logout</button>'
            : '<a class="sdg-chip" href="../LOGIN/index.html">Login</a>'
        }
      </div>
    `;

    const header = document.querySelector("header");
    if (header) {
      header.insertAdjacentElement("afterend", toolbar);
    } else {
      document.body.insertAdjacentElement("afterbegin", toolbar);
    }

    document.getElementById("sdgThemeToggle")?.addEventListener("click", toggleTheme);
    document.getElementById("sdgLogoutBtn")?.addEventListener("click", logout);
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, function (match) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[match];
    });
  }

  function markCurrentNav() {
    const fileName = window.location.pathname.split("/").pop().toLowerCase();
    document.querySelectorAll("nav a, .menu a, #navLinks a").forEach((link) => {
      const href = (link.getAttribute("href") || "").toLowerCase();
      if (href.endsWith(fileName) || (fileName === "index.html" && href.includes(`/${document.body.dataset.page || ""}/`))) {
        link.dataset.current = "true";
      }
    });
  }

  function setupMobileNav() {
    const nav = document.querySelector("header nav, .navbar, .topnav");
    const links = document.querySelector("header nav ul, .menu, #navLinks");
    if (!nav || !links || document.querySelector(".sdg-nav-toggle")) {
      return;
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className = "sdg-nav-toggle";
    button.textContent = "Menu";
    button.addEventListener("click", function () {
      links.classList.toggle("sdg-open");
    });
    nav.insertBefore(button, links);
  }

  function shouldLockLink(link) {
    const href = link.getAttribute("href") || "";
    if (!href || href.startsWith("#") || href.startsWith("http")) {
      return false;
    }
    const lowerHref = href.toLowerCase();
    return !lowerHref.includes("/home/") && !lowerHref.includes("/login/") && !lowerHref.includes("climate");
  }

  function guardRestrictedLinks() {
    document.querySelectorAll("a").forEach((link) => {
      if (!shouldLockLink(link)) {
        return;
      }

      link.classList.add("restricted");
      link.addEventListener("click", function (event) {
        if (!getCurrentUser()) {
          event.preventDefault();
          showToast("Login first to unlock this SDG section.");
          setTimeout(() => {
            window.location.href = getLoginPath();
          }, 450);
        }
      });
    });
  }

  function enforcePageAccess() {
    const page = String(document.body.dataset.page || "").toLowerCase();
    if (!page || PUBLIC_PAGES.has(page)) {
      return;
    }
    requireAuth();
  }

  async function syncFromServer() {
    const usersRequest = api("/users").then((data) => {
      state.users = (data.users || []).map(normalizeUser).filter(Boolean);
    });

    const teamsRequest = api("/teams").then((data) => {
      state.teams = data.teams || [];
    });

    await Promise.allSettled([usersRequest, teamsRequest]);

    if (getToken()) {
      const meResult = await api("/me")
        .then((data) => ({ ok: true, data }))
        .catch((error) => ({ ok: false, error }));

      if (meResult.ok) {
        mergeUser(meResult.data.user);
        setCurrentUser(meResult.data.user);
      } else if (meResult.error && meResult.error.status === 401) {
        setCurrentUser(null);
        enforcePageAccess();
      }

      await Promise.allSettled([
        api("/notifications").then((data) => {
          state.notifications = data.notifications || [];
        }),
        api("/learn").then((data) => {
          const current = getCurrentUser();
          if (current) {
            state.learn[String(current.username).toLowerCase()] = data.progress;
          }
        })
      ]);
    }

    dispatchDataEvent();
  }

  function init() {
    migrateStorage();
    loadLocalState();
    applyTheme(localStorage.getItem(STORAGE.theme) || "light");
    document.body.dataset.app = "sdg";
    enforcePageAccess();
    setupToolbar();
    setupMobileNav();
    markCurrentNav();
    guardRestrictedLinks();
    syncFromServer().finally(finishReady);
  }

  window.SDGApp = {
    ready,
    sync: syncFromServer,
    login,
    signup,
    getUsers,
    saveUsers,
    getCurrentUser,
    setCurrentUser,
    upsertUser,
    findUser,
    isUsernameAvailable,
    updateUserScore,
    requireAuth,
    showToast,
    getNotifications,
    getUserNotifications,
    createNotification,
    updateNotification,
    createTeam,
    getTeams,
    countTeamsForUser,
    respondToTeamInvite,
    getUserLearnProgress,
    completeLearnStage,
    saveUserLearnProgress,
    updateAvatar,
    resetPassword,
    medalForRank(rank) {
      return MEDAL_LABELS[rank - 1] || "";
    }
  };

  window.getUser = getCurrentUser;
  window.active = getCurrentUser() || {};

  document.addEventListener("DOMContentLoaded", init);
})();
