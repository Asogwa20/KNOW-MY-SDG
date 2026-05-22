document.addEventListener("DOMContentLoaded", () => {
  const currentUser = window.ClimateApp ? window.ClimateApp.getCurrentUser() : null;
  const welcomeMessage = document.getElementById("welcomeMessage");
  const memberCount = document.getElementById("memberCount");
  const profileName = document.getElementById("profileName");
  const profileHint = document.getElementById("profileHint");
  const avatarPreview = document.getElementById("avatarPreview");
  const avatarInput = document.getElementById("avatarInput");

  memberCount.textContent = String(window.ClimateApp.getUsers().length);

  if (currentUser) {
    welcomeMessage.textContent = `Welcome back, ${currentUser.firstName || currentUser.username}`;
    profileName.textContent = currentUser.username;
    profileHint.textContent = "Your climate profile is unlocked. You can now save scores across the climate pages.";
    avatarPreview.src = currentUser.avatar || "../Edited images/gem.jpg";
  } else {
    avatarInput.disabled = true;
  }

  document.querySelectorAll(".restricted-action").forEach((link) => {
    link.addEventListener("click", (event) => {
      if (!window.ClimateApp.getCurrentUser()) {
        event.preventDefault();
        window.ClimateApp.showToast("Login or sign up first to unlock this section.");
        setTimeout(() => {
          window.location.href = "../LOGIN/index.html";
        }, 450);
      }
    });
  });

  avatarInput.addEventListener("change", (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const saved = window.ClimateApp.updateAvatar(String(reader.result || ""));
      if (saved) {
        avatarPreview.src = saved.avatar;
        window.ClimateApp.showToast("Avatar saved.");
      }
    };
    reader.readAsDataURL(file);
  });

  window.addEventListener("climate:data", () => {
    memberCount.textContent = String(window.ClimateApp.getUsers().length);
  });
});
