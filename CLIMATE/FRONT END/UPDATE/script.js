const updates = [
  { title: "Climate home is now public", content: "Students can explore the home page first and then login to unlock the climate tools." },
  { title: "Climate quiz and challenge fixed", content: "The climate activities now save scores locally and link properly to the leaderboard." },
  { title: "Ask Bot simplified", content: "The climate bot is now a cleaner study helper instead of a broken external API flow." }
];

const updatesDiv = document.getElementById("updates");
updates.forEach((update) => {
  const card = document.createElement("article");
  card.className = "update-card";
  card.innerHTML = `<h3>${update.title}</h3><p>${update.content}</p>`;
  updatesDiv.appendChild(card);
});

document.getElementById("contactForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const name = document.getElementById("cName").value.trim();
  const email = document.getElementById("cEmail").value.trim();
  const msg = document.getElementById("cMsg").value.trim();
  fetch("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ app: "climate", name, email, message: msg })
  }).catch(() => {});
  window.location.href = `mailto:asogwaprecious27@gmail.com?subject=${encodeURIComponent(`Climate message from ${name}`)}&body=${encodeURIComponent(`Email: ${email}\n\n${msg}`)}`;
});
