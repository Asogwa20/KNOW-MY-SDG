(function () {
  const STORAGE = {
    users: "climate_users",
    active: "climate_activeUser",
    token: "climate_token",
    theme: "climate_theme"
  };

  const PUBLIC_PAGES = new Set(["home", "login"]);
  const state = {
    users: []
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
      firstName: String(user.firstName || "").trim(),
      lastName: String(user.lastName || "").trim(),
      email: String(user.email || "").trim().toLowerCase(),
      phone: String(user.phone || "").trim(),
      country: String(user.country || "").trim(),
      state: String(user.state || "").trim(),
      gender: String(user.gender || "").trim(),
      classRole: String(user.classRole || "").trim(),
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
  }

  function saveLocalState() {
    localStorage.setItem(STORAGE.users, JSON.stringify(getUsers()));
  }

  function dispatchDataEvent() {
    saveLocalState();
    window.dispatchEvent(new CustomEvent("climate:data", { detail: { ...state } }));
  }

  function finishReady() {
    if (!readyResolved) {
      readyResolved = true;
      resolveReady();
    }
  }

  function getToken() {
    return localStorage.getItem(STORAGE.token) || "";
  }

  async function api(path, options = {}) {
    const headers = {
      "Content-Type": "application/json"
    };
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`/api/climate${path}`, {
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
      return null;
    }
    if (typeof token === "string") {
      localStorage.setItem(STORAGE.token, token);
    }
    localStorage.setItem(STORAGE.active, JSON.stringify(normalized));
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

  function isUsernameAvailable(username, ignoreUsername) {
    const value = String(username || "").trim().toLowerCase();
    const ignore = String(ignoreUsername || "").trim().toLowerCase();
    return !!value && !getUsers().some((entry) => {
      const current = entry.username.toLowerCase();
      return current === value && current !== ignore;
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

  function updateUserScore(field, delta) {
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

    if (getToken()) {
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
    }

    return active;
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

  function updateAvatar(dataUrl) {
    const current = getCurrentUser();
    if (!current) {
      return null;
    }
    const saved = upsertUser({ ...current, avatar: dataUrl });
    setCurrentUser(saved);

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

    return saved;
  }

  function showToast(message) {
    const existing = document.getElementById("climateToast");
    if (existing) {
      existing.remove();
    }

    const toast = document.createElement("div");
    toast.id = "climateToast";
    toast.className = "climate-toast";
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 2600);
  }

  function applyTheme(theme) {
    document.body.dataset.theme = theme;
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
    if (document.querySelector(".climate-toolbar")) {
      return;
    }

    const current = getCurrentUser();
    const toolbar = document.createElement("div");
    toolbar.className = "climate-toolbar";
    toolbar.innerHTML = `
      <div class="climate-toolbar-card">
        <div>
          <strong>${current ? `Welcome back, ${escapeHtml(current.username)}` : "Climate Action Hub"}</strong>
          <small>${current ? "Your climate progress is saved to the hub." : "Login or sign up to unlock the climate tools."}</small>
        </div>
      </div>
      <div class="climate-toolbar-actions">
        <button type="button" class="climate-chip" id="climateThemeToggle">Theme</button>
        ${current ? '<button type="button" class="climate-chip" id="climateLogoutBtn">Logout</button>' : '<a class="climate-chip" href="../LOGIN/index.html">Login</a>'}
      </div>
    `;

    const header = document.querySelector("header");
    if (header) {
      header.insertAdjacentElement("afterend", toolbar);
    }

    document.getElementById("climateThemeToggle")?.addEventListener("click", toggleTheme);
    document.getElementById("climateLogoutBtn")?.addEventListener("click", () => {
      setCurrentUser(null);
      window.location.href = "../HOME/index.html";
    });
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

  function setupMobileNav() {
    const nav = document.querySelector("header nav, .navbar, .topnav");
    const links = document.querySelector("header nav ul, .menu, #navLinks");
    if (!nav || !links || document.querySelector(".climate-nav-toggle")) {
      return;
    }
    const button = document.createElement("button");
    button.type = "button";
    button.className = "climate-nav-toggle";
    button.textContent = "Menu";
    button.addEventListener("click", () => links.classList.toggle("climate-open"));
    nav.insertBefore(button, links);
  }

  function shouldLockLink(link) {
    const href = (link.getAttribute("href") || "").toLowerCase();
    if (!href || href.startsWith("#") || href.startsWith("http")) {
      return false;
    }
    return !href.includes("/home/") && !href.includes("/login/") && !href.includes("sdgs");
  }

  function guardRestrictedLinks() {
    document.querySelectorAll("a").forEach((link) => {
      if (!shouldLockLink(link)) {
        return;
      }
      link.addEventListener("click", (event) => {
        if (!getCurrentUser()) {
          event.preventDefault();
          showToast("Login first to unlock this climate section.");
          setTimeout(() => {
            window.location.href = getLoginPath();
          }, 450);
        }
      });
    });
  }

  function markCurrentNav() {
    const fileName = window.location.pathname.split("/").pop().toLowerCase();
    document.querySelectorAll("nav a, .menu a, #navLinks a").forEach((link) => {
      const href = (link.getAttribute("href") || "").toLowerCase();
      if (href.endsWith(fileName)) {
        link.dataset.current = "true";
      }
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
    await api("/users")
      .then((data) => {
        state.users = (data.users || []).map(normalizeUser).filter(Boolean);
      })
      .catch(() => {});

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
    }

    dispatchDataEvent();
  }

  function init() {
    loadLocalState();
    applyTheme(localStorage.getItem(STORAGE.theme) || "light");
    enforcePageAccess();
    setupToolbar();
    setupMobileNav();
    markCurrentNav();
    guardRestrictedLinks();
    syncFromServer().finally(finishReady);
  }

  window.ClimateApp = {
    ready,
    sync: syncFromServer,
    login,
    signup,
    getUsers,
    saveUsers,
    getCurrentUser,
    setCurrentUser,
    isUsernameAvailable,
    upsertUser,
    updateUserScore,
    resetPassword,
    updateAvatar,
    requireAuth,
    showToast
  };

  document.addEventListener("DOMContentLoaded", init);
})();
