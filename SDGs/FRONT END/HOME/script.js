const GOAL_ROTATION = [
  { number: 1, title: "No Poverty", color: "#E5243B", copy: "Goal 1 reminds us that learning should lead to real action that reduces poverty and exclusion." },
  { number: 2, title: "Zero Hunger", color: "#DDA63A", copy: "Goal 2 pushes us to connect education, food security, and student-led community solutions." },
  { number: 3, title: "Good Health and Well-Being", color: "#4C9F38", copy: "Goal 3 keeps health, safety, and wellbeing at the center of everyday SDG action." },
  { number: 4, title: "Quality Education", color: "#C5192D", copy: "Goal 4 turns this platform into a clear learning journey instead of a random list of activities." },
  { number: 5, title: "Gender Equality", color: "#FF3A21", copy: "Goal 5 encourages equal opportunities, fair voices, and safe participation for every learner." },
  { number: 6, title: "Clean Water and Sanitation", color: "#26BDE2", copy: "Goal 6 reminds students that sustainability starts with healthy communities and safe daily systems." },
  { number: 7, title: "Affordable and Clean Energy", color: "#FCC30B", copy: "Goal 7 shows how innovation and clean energy can shape a stronger future." },
  { number: 8, title: "Decent Work and Economic Growth", color: "#A21942", copy: "Goal 8 ties learning to skills, teamwork, and opportunities that last." },
  { number: 9, title: "Industry, Innovation and Infrastructure", color: "#FD6925", copy: "Goal 9 pushes students to build solutions, not just memorize facts." },
  { number: 10, title: "Reduced Inequalities", color: "#DD1367", copy: "Goal 10 keeps fairness in view so the platform works for every student." },
  { number: 11, title: "Sustainable Cities and Communities", color: "#FD9D24", copy: "Goal 11 brings the SDGs closer to home by focusing on schools, streets, and local community life." },
  { number: 12, title: "Responsible Consumption and Production", color: "#BF8B2E", copy: "Goal 12 helps students connect habits, waste, and responsible choices." },
  { number: 13, title: "Climate Action", color: "#3F7E44", copy: "Goal 13 links the SDGs together and keeps the platform grounded in urgent action." },
  { number: 14, title: "Life Below Water", color: "#0A97D9", copy: "Goal 14 reminds us that ecosystems far away are still part of our daily choices." },
  { number: 15, title: "Life on Land", color: "#56C02B", copy: "Goal 15 helps students think about forests, biodiversity, and care for living systems." },
  { number: 16, title: "Peace, Justice and Strong Institutions", color: "#00689D", copy: "Goal 16 supports respectful competition, fair rules, and trust across the platform." },
  { number: 17, title: "Partnerships for the Goals", color: "#19486A", copy: "Goal 17 is why the notification center, team invites, and friend challenges matter." }
];

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const value = clean.length === 3
    ? clean.split("").map((char) => char + char).join("")
    : clean;
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

function formatTime(value) {
  const date = new Date(value);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

document.addEventListener("DOMContentLoaded", () => {
  const currentUser = window.SDGApp ? window.SDGApp.getCurrentUser() : null;
  const welcomeMessage = document.getElementById("welcomeMessage");
  const goalEyebrow = document.getElementById("goalEyebrow");
  const goalMessage = document.getElementById("goalMessage");
  const goalWheel = document.getElementById("goalWheel");
  const memberCount = document.getElementById("memberCount");
  const teamCount = document.getElementById("teamCount");
  const challengeCount = document.getElementById("challengeCount");
  const profileName = document.getElementById("profileName");
  const profileHint = document.getElementById("profileHint");
  const avatarPreview = document.getElementById("avatarPreview");
  const avatarInput = document.getElementById("avatarInput");
  const notificationCount = document.getElementById("notificationCount");
  const notificationList = document.getElementById("notificationList");

  if (memberCount) {
    memberCount.textContent = String(window.SDGApp.getUsers().length);
  }

  const teams = window.SDGApp.getTeams();
  if (teamCount) {
    teamCount.textContent = String(teams.length);
  }

  if (currentUser) {
    welcomeMessage.textContent = `Welcome back, ${currentUser.firstName || currentUser.username}`;
    profileName.textContent = currentUser.username;
    profileHint.textContent = "Your profile is unlocked. You can update your avatar, accept team invites, and respond to direct challenges here.";
    avatarPreview.src = currentUser.avatar || "../Edited images/gem.jpg";
  } else {
    avatarInput.disabled = true;
  }

  const restrictedActions = document.querySelectorAll(".restricted-action");
  restrictedActions.forEach((link) => {
    link.addEventListener("click", (event) => {
      if (!window.SDGApp.getCurrentUser()) {
        event.preventDefault();
        window.SDGApp.showToast("Login or sign up first to unlock this section.");
        setTimeout(() => {
          window.location.href = "../LOGIN/index.html";
        }, 450);
      }
    });
  });

  if (avatarInput) {
    avatarInput.addEventListener("change", (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) {
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const updated = window.SDGApp.updateAvatar(String(reader.result || ""));
        if (updated) {
          avatarPreview.src = updated.avatar || "../Edited images/gem.jpg";
          window.SDGApp.showToast("Avatar saved for this profile.");
        }
      };
      reader.readAsDataURL(file);
    });
  }

  function renderNotifications() {
    const user = window.SDGApp.getCurrentUser();
    const notifications = user ? window.SDGApp.getUserNotifications(user.username) : [];
    const pendingCount = notifications.filter((item) => item.status === "pending").length;

    notificationCount.textContent = String(pendingCount);
    challengeCount.textContent = String(pendingCount);
    notificationList.innerHTML = "";

    if (!user) {
      notificationList.innerHTML = '<div class="empty-notice">Login to see personalized challenges, team invitations, and updates.</div>';
      return;
    }

    if (!notifications.length) {
      notificationList.innerHTML = '<div class="empty-notice">No notifications yet. Friend challenges and team invitations will appear here.</div>';
      return;
    }

    notifications.forEach((item) => {
      const card = document.createElement("article");
      card.className = "notification-item";

      let actions = "";
      if (item.type === "team_invite" && item.status === "pending") {
        actions = `
          <div class="notification-actions">
            <button type="button" data-action="accept-team" data-id="${item.id}">Accept</button>
            <button type="button" class="sdg-chip" data-action="decline-team" data-id="${item.id}">Decline</button>
          </div>
        `;
      }

      if (item.type === "friend_challenge" && item.status === "pending") {
        actions = `
          <div class="notification-actions">
            <a class="sdg-button" href="../challenge/index.html">Open Challenge</a>
            <button type="button" class="sdg-chip" data-action="dismiss" data-id="${item.id}">Mark Seen</button>
          </div>
        `;
      }

      card.innerHTML = `
        <h3>${item.title || "Notification"}</h3>
        <p>${item.message || ""}</p>
        <div class="notification-meta">
          <span>From: ${item.from || "System"}</span>
          <span> | ${formatTime(item.createdAt)}</span>
          <span> | Status: ${item.status}</span>
        </div>
        ${actions}
      `;
      notificationList.appendChild(card);
    });

    notificationList.querySelectorAll("[data-action]").forEach((button) => {
      button.addEventListener("click", async () => {
        const id = button.dataset.id;
        const action = button.dataset.action;

        if (action === "accept-team") {
          const result = await window.SDGApp.respondToTeamInvite(id, true);
          window.SDGApp.showToast(result.message);
        } else if (action === "decline-team") {
          const result = await window.SDGApp.respondToTeamInvite(id, false);
          window.SDGApp.showToast(result.message);
        } else if (action === "dismiss") {
          window.SDGApp.updateNotification(id, { status: "seen" });
          window.SDGApp.showToast("Notification marked as seen.");
        }

        renderNotifications();
      });
    });
  }

  let goalIndex = 0;
  function applyGoalTheme(index) {
    const goal = GOAL_ROTATION[index];
    document.body.style.setProperty("--goal-rgb", hexToRgb(goal.color));
    goalEyebrow.textContent = `Goal ${goal.number}`;
    goalMessage.textContent = goal.copy;
    goalWheel.src = `../Edited images/goal ${goal.number}.jpg`;
    goalWheel.alt = `Goal ${goal.number}: ${goal.title}`;
  }

  applyGoalTheme(goalIndex);
  setInterval(() => {
    goalIndex = (goalIndex + 1) % GOAL_ROTATION.length;
    applyGoalTheme(goalIndex);
  }, 5000);

  renderNotifications();

  window.addEventListener("sdg:data", () => {
    if (memberCount) {
      memberCount.textContent = String(window.SDGApp.getUsers().length);
    }
    const latestTeams = window.SDGApp.getTeams();
    if (teamCount) {
      teamCount.textContent = String(latestTeams.length);
    }
    renderNotifications();
  });
});
