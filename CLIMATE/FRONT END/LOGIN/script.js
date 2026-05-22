const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const strengthBar = document.getElementById("strengthBar");
const strengthLabel = document.getElementById("strengthLabel");
const usernameInput = document.getElementById("signupUsername");
const usernameStatus = document.getElementById("usernameStatus");
const forgotModal = document.getElementById("forgotModal");

function showTab(tab) {
  const isLogin = tab === "login";
  loginTab.classList.toggle("active", isLogin);
  signupTab.classList.toggle("active", !isLogin);
  loginForm.classList.toggle("hidden", !isLogin);
  signupForm.classList.toggle("hidden", isLogin);
}

function getStrength(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 2) return { label: "Weak", color: "#d62828" };
  if (score === 3) return { label: "Medium", color: "#f3ca4d" };
  return { label: "Strong", color: "#0e9f8a" };
}

function updateUsernameStatus() {
  const username = usernameInput.value.trim();
  if (!username) {
    usernameStatus.textContent = "Pick a unique username for climate competitions.";
    usernameStatus.dataset.state = "";
    return false;
  }

  if (!/^[a-zA-Z0-9._-]{3,20}$/.test(username)) {
    usernameStatus.textContent = "Use 3-20 letters, numbers, dots, underscores, or hyphens.";
    usernameStatus.dataset.state = "error";
    return false;
  }

  const available = window.ClimateApp.isUsernameAvailable(username);
  usernameStatus.textContent = available ? "Username is available." : "That username is already taken.";
  usernameStatus.dataset.state = available ? "success" : "error";
  return available;
}

loginTab.addEventListener("click", () => showTab("login"));
signupTab.addEventListener("click", () => showTab("signup"));

document.getElementById("showLoginPassword").addEventListener("change", (event) => {
  document.getElementById("loginPass").type = event.target.checked ? "text" : "password";
});

document.getElementById("showSignupPassword").addEventListener("change", (event) => {
  const type = event.target.checked ? "text" : "password";
  document.getElementById("signupPass1").type = type;
  document.getElementById("signupPass2").type = type;
});

usernameInput.addEventListener("input", updateUsernameStatus);

document.getElementById("signupPass1").addEventListener("input", (event) => {
  const password = event.target.value;
  if (!password) {
    strengthBar.style.background = "";
    strengthLabel.textContent = "Use at least 8 characters with a mix of letters, numbers, and symbols.";
    return;
  }
  const strength = getStrength(password);
  strengthBar.style.background = strength.color;
  strengthLabel.textContent = `Password strength: ${strength.label}`;
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = document.getElementById("loginEmail").value.trim().toLowerCase();
  const password = document.getElementById("loginPass").value;
  const result = await window.ClimateApp.login(email, password);
  if (!result.ok) {
    window.ClimateApp.showToast(result.message || "Invalid email or password.");
    return;
  }
  const target = new URLSearchParams(window.location.search).get("return") || "../HOME/index.html";
  window.location.href = target;
});

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const username = usernameInput.value.trim();
  const email = document.getElementById("signupEmail").value.trim().toLowerCase();
  const pass1 = document.getElementById("signupPass1").value;
  const pass2 = document.getElementById("signupPass2").value;

  if (!updateUsernameStatus()) {
    window.ClimateApp.showToast("Choose a unique valid username.");
    return;
  }

  if (window.ClimateApp.getUsers().some((entry) => entry.email === email)) {
    window.ClimateApp.showToast("An account with that email already exists.");
    return;
  }

  if (pass1 !== pass2) {
    window.ClimateApp.showToast("Passwords do not match.");
    return;
  }

  if (getStrength(pass1).label === "Weak") {
    window.ClimateApp.showToast("Use a stronger password.");
    return;
  }

  const user = {
    firstName: document.getElementById("signupFirst").value.trim(),
    lastName: document.getElementById("signupLast").value.trim(),
    email,
    phone: document.getElementById("signupPhone").value.trim(),
    country: document.getElementById("signupCountry").value.trim(),
    state: document.getElementById("signupState").value.trim(),
    gender: document.getElementById("signupGender").value,
    classRole: document.getElementById("signupClass").value,
    username,
    password: pass1,
    role: "Student",
    quizScore: 0,
    challengeScore: 0,
    puzzleScore: 0,
    generalScore: 0
  };

  const result = await window.ClimateApp.signup(user);
  if (!result.ok) {
    window.ClimateApp.showToast(result.message || "Signup failed.");
    return;
  }

  const target = new URLSearchParams(window.location.search).get("return") || "../HOME/index.html";
  window.location.href = target;
});

document.getElementById("forgotPasswordBtn").addEventListener("click", () => {
  forgotModal.classList.add("open");
});

document.getElementById("closeForgotModal").addEventListener("click", () => {
  forgotModal.classList.remove("open");
});

document.getElementById("forgotForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const username = document.getElementById("resetUsername").value.trim();
  const email = document.getElementById("resetEmail").value.trim().toLowerCase();
  const password = document.getElementById("resetPassword").value;
  const confirmPassword = document.getElementById("resetPasswordConfirm").value;

  if (password !== confirmPassword) {
    window.ClimateApp.showToast("New passwords do not match.");
    return;
  }

  const result = await window.ClimateApp.resetPassword(username, email, password);
  if (!result.ok) {
    window.ClimateApp.showToast(result.message);
    return;
  }

  forgotModal.classList.remove("open");
  window.ClimateApp.showToast("Password updated. You can login now.");
});
