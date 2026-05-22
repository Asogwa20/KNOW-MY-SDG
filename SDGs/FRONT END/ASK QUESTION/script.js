const askUser = window.SDGApp.requireAuth();
if (!askUser) {
  throw new Error("Authentication required");
}

const GOAL_INFO = {
  1: { title: "No Poverty", text: "Goal 1 focuses on ending poverty in all forms everywhere through protection, opportunity, and resilience." },
  2: { title: "Zero Hunger", text: "Goal 2 aims to end hunger, improve nutrition, and support sustainable agriculture." },
  3: { title: "Good Health and Well-Being", text: "Goal 3 promotes healthy lives and wellbeing for people of all ages." },
  4: { title: "Quality Education", text: "Goal 4 supports inclusive and equitable quality education and lifelong learning." },
  5: { title: "Gender Equality", text: "Goal 5 promotes equality, dignity, and empowerment for women and girls." },
  6: { title: "Clean Water and Sanitation", text: "Goal 6 focuses on safe water, sanitation, hygiene, and water security." },
  7: { title: "Affordable and Clean Energy", text: "Goal 7 expands access to affordable, reliable, and sustainable energy." },
  8: { title: "Decent Work and Economic Growth", text: "Goal 8 links fair jobs, productive work, and inclusive economic growth." },
  9: { title: "Industry, Innovation and Infrastructure", text: "Goal 9 supports resilient infrastructure, innovation, and sustainable industry." },
  10: { title: "Reduced Inequalities", text: "Goal 10 focuses on fairness and reducing inequality within and among countries." },
  11: { title: "Sustainable Cities and Communities", text: "Goal 11 aims to make cities safe, resilient, inclusive, and sustainable." },
  12: { title: "Responsible Consumption and Production", text: "Goal 12 encourages sustainable resource use, lower waste, and better production systems." },
  13: { title: "Climate Action", text: "Goal 13 calls for urgent action to reduce emissions and build climate resilience." },
  14: { title: "Life Below Water", text: "Goal 14 protects oceans, seas, and marine resources." },
  15: { title: "Life on Land", text: "Goal 15 protects forests, biodiversity, and land ecosystems." },
  16: { title: "Peace, Justice and Strong Institutions", text: "Goal 16 supports peaceful societies, justice, and trustworthy institutions." },
  17: { title: "Partnerships for the Goals", text: "Goal 17 connects global progress through cooperation, finance, technology, and partnerships." }
};

const ACTIONS = {
  default: "Students can help by learning the goals, joining teams, reducing waste, supporting inclusion, and sharing practical SDG actions with others.",
  4: "Students can support Goal 4 by helping classmates learn, sharing school materials, and promoting safe inclusive education spaces.",
  6: "Students can support Goal 6 by saving water, reporting leaks, and promoting clean hygiene habits.",
  13: "Students can support Goal 13 by planting trees, saving energy, reducing waste, and leading climate awareness activities."
};

const chatArea = document.getElementById("chatArea");
const sendBtn = document.getElementById("sendBtn");
const voiceBtn = document.getElementById("voiceBtn");
const inputBox = document.getElementById("userQuestion");
const voiceSelect = document.getElementById("voiceSelect");
const openFeedbackBtn = document.getElementById("openFeedback");
const fbBackdrop = document.getElementById("feedbackBackdrop");
const fbCancel = document.getElementById("fbCancel");
const fbSend = document.getElementById("fbSend");
const fbName = document.getElementById("fbName");
const fbCountry = document.getElementById("fbCountry");
const fbState = document.getElementById("fbState");
const fbSex = document.getElementById("fbSex");
const fbMessage = document.getElementById("fbMessage");
const userInfoDiv = document.getElementById("userInfo");

function appendMessage(type, text, author) {
  const div = document.createElement("div");
  div.className = `msg ${type}`;
  div.innerHTML = `<div class="bubble">${text}</div><div class="meta">${author}</div>`;
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}

function speakText(text) {
  if (!("speechSynthesis" in window)) {
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  const selectedVoice = speechSynthesis.getVoices().find((voice) => voice.name === voiceSelect.value);
  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}

function loadVoices() {
  const voices = speechSynthesis.getVoices();
  voiceSelect.innerHTML = "";
  voices.forEach((voice) => {
    const option = document.createElement("option");
    option.value = voice.name;
    option.textContent = `${voice.name} - ${voice.lang}`;
    voiceSelect.appendChild(option);
  });
}

function getGoalNumberFromText(text) {
  const match = text.match(/goal\s*(\d+)|sdg\s*(\d+)/i);
  if (!match) {
    return null;
  }
  return Number(match[1] || match[2]);
}

function answerQuestion(question) {
  const normalized = question.toLowerCase().trim();
  const goalNumber = getGoalNumberFromText(normalized);

  if (/compare/.test(normalized)) {
    const matches = Array.from(normalized.matchAll(/(?:goal|sdg)\s*(\d+)/gi)).map((item) => Number(item[1]));
    if (matches.length >= 2 && GOAL_INFO[matches[0]] && GOAL_INFO[matches[1]]) {
      return `${GOAL_INFO[matches[0]].title} focuses on ${GOAL_INFO[matches[0]].text.toLowerCase().replace(/^goal \d+ /i, "")} ${GOAL_INFO[matches[1]].title} focuses on ${GOAL_INFO[matches[1]].text.toLowerCase().replace(/^goal \d+ /i, "")}`;
    }
  }

  if (goalNumber && GOAL_INFO[goalNumber]) {
    if (/how can students support|actions|what can students do/.test(normalized)) {
      return ACTIONS[goalNumber] || ACTIONS.default;
    }
    return `Goal ${goalNumber}: ${GOAL_INFO[goalNumber].title}. ${GOAL_INFO[goalNumber].text}`;
  }

  if (/partnership/.test(normalized)) {
    return "Partnerships matter because the SDGs work best when schools, students, communities, governments, and organizations solve problems together.";
  }

  if (/student/.test(normalized) && /support/.test(normalized)) {
    return ACTIONS.default;
  }

  return "Try asking about a goal number, comparing two goals, or asking what students can do to support a specific SDG.";
}

async function handleSend() {
  const text = inputBox.value.trim();
  if (!text) {
    return;
  }

  appendMessage("user", text, askUser.username);
  inputBox.value = "";
  const reply = answerQuestion(text);
  appendMessage("bot", reply, "SDG Bot");
  speakText(reply);
}

function refreshUserUI() {
  userInfoDiv.innerHTML = `
    <strong>${askUser.firstName || askUser.username}</strong>
    <div>${askUser.username}</div>
    <div>${askUser.country || ""} ${askUser.state ? `| ${askUser.state}` : ""}</div>
  `;
}

let recognition = null;
function initRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    voiceBtn.disabled = true;
    voiceBtn.title = "Voice input is not supported here.";
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.onresult = (event) => {
    inputBox.value = event.results[0][0].transcript;
    handleSend();
  };
}

sendBtn.addEventListener("click", handleSend);
inputBox.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    handleSend();
  }
});

voiceBtn.addEventListener("click", () => {
  if (recognition) {
    recognition.start();
  }
});

document.querySelectorAll(".quick").forEach((button) => {
  button.addEventListener("click", () => {
    inputBox.value = button.dataset.q;
    handleSend();
  });
});

openFeedbackBtn.addEventListener("click", () => {
  fbName.value = askUser.firstName || askUser.username || "";
  fbCountry.value = askUser.country || "";
  fbState.value = askUser.state || "";
  fbBackdrop.classList.add("open");
  fbBackdrop.setAttribute("aria-hidden", "false");
});

fbCancel.addEventListener("click", () => {
  fbBackdrop.classList.remove("open");
  fbBackdrop.setAttribute("aria-hidden", "true");
});

fbSend.addEventListener("click", () => {
  const subject = encodeURIComponent("SDG Bot Feedback");
  const body = encodeURIComponent(
    `Name: ${fbName.value.trim()}\nCountry: ${fbCountry.value.trim()}\nState: ${fbState.value.trim()}\nSex: ${fbSex.value}\n\nMessage:\n${fbMessage.value.trim()}`
  );

  if (!fbMessage.value.trim()) {
    window.SDGApp.showToast("Write a short feedback message first.");
    return;
  }

  window.SDGApp.createNotification({
    type: "system",
    to: askUser.username,
    from: "SDG Bot",
    title: "Feedback prepared",
    message: "Your Ask Bot feedback was prepared for sending."
  });

  window.location.href = `mailto:asogwaprecious27@gmail.com?subject=${subject}&body=${body}`;
  fbBackdrop.classList.remove("open");
  fbBackdrop.setAttribute("aria-hidden", "true");
});

document.addEventListener("DOMContentLoaded", () => {
  refreshUserUI();
  appendMessage("bot", `Hello ${askUser.firstName || askUser.username}. Ask me about any SDG goal or student action.`, "SDG Bot");
  loadVoices();
  initRecognition();
});

window.speechSynthesis.onvoiceschanged = loadVoices;
