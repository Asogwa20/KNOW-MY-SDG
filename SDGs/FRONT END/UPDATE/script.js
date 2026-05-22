document.getElementById("contactForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const subject = document.getElementById("subject").value.trim();
  const message = document.getElementById("message").value.trim();

  const formMessage = document.getElementById("formMsg");
  formMessage.textContent = "Opening your email app...";

  const current = window.SDGApp.getCurrentUser();
  if (current) {
    window.SDGApp.createNotification({
      type: "system",
      to: current.username,
      from: "SDG Hub",
      title: "Message prepared",
      message: `Your "${subject}" message has been prepared for sending from the Updates page.`
    });
  }

  fetch("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ app: "sdg", name, email, message: `${subject}\n\n${message}` })
  }).catch(() => {});

  const body = encodeURIComponent(
    `Name: ${name}\nEmail: ${email}\n\n${message}`
  );
  const mailto = `mailto:asogwaprecious27@gmail.com?subject=${encodeURIComponent(subject)}&body=${body}`;

  window.location.href = mailto;
  formMessage.textContent = "If your email app did not open, please send your message manually to asogwaprecious27@gmail.com.";
  event.target.reset();
});
