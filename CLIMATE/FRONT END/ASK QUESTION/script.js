const climateBotUser = window.ClimateApp.requireAuth();
if (!climateBotUser) {
  throw new Error("Authentication required");
}

const sendBtn = document.getElementById("sendBtn");
const inputBox = document.getElementById("userQuestion");
const chatLog = document.getElementById("chatLog");
const voiceBtn = document.getElementById("voiceBtn");

const qaBank = [
  { q: "what is climate change", a: "Climate change is the long-term shift in temperature and weather patterns, mostly caused today by human activities." },
  { q: "what causes climate change", a: "Burning fossil fuels, deforestation, and industrial activity release greenhouse gases that warm the atmosphere." },
  { q: "what is global warming", a: "Global warming is the rise in Earth's average temperature due to greenhouse gas emissions." },
  { q: "what is renewable energy", a: "Renewable energy comes from sources that naturally replenish, like solar, wind, hydro, and geothermal." },
  { q: "how can students help climate action", a: "Students can save energy, reduce waste, plant trees, support clean transport, and spread climate awareness." },
  { q: "what is carbon footprint", a: "A carbon footprint is the total greenhouse gas emissions caused by a person, activity, or product." },
  { q: "what is adaptation", a: "Adaptation means adjusting systems and habits to reduce harm from climate impacts." },
  { q: "what is mitigation", a: "Mitigation means reducing greenhouse gas emissions so warming becomes less severe." },
  { q: "what is sdg 13", a: "SDG 13 is Climate Action. It focuses on urgent action to combat climate change and its impacts." },
  { q: "what is deforestation", a: "Deforestation is the clearing of trees and forests, which reduces carbon absorption and harms ecosystems." }
];

function addMessage(sender, text) {
  const div = document.createElement("div");
  div.className = `msg ${sender}`;
  div.innerHTML = `<div class="bubble">${text}</div>`;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function findAnswer(question) {
  const q = question.toLowerCase().trim();
  const found = qaBank.find((item) => q.includes(item.q));
  return found ? found.a : "Try asking about climate change, renewable energy, adaptation, mitigation, or what students can do.";
}

function speak(text) {
  if ("speechSynthesis" in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  }
}

sendBtn.addEventListener("click", () => {
  const question = inputBox.value.trim();
  if (!question) {
    return;
  }
  addMessage("user", question);
  inputBox.value = "";
  const reply = findAnswer(question);
  addMessage("bot", reply);
  speak(reply);
});

inputBox.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendBtn.click();
  }
});

voiceBtn.addEventListener("click", () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    window.ClimateApp.showToast("Voice input is not supported in this browser.");
    return;
  }
  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.onresult = (event) => {
    inputBox.value = event.results[0][0].transcript;
    sendBtn.click();
  };
  recognition.start();
});

document.addEventListener("DOMContentLoaded", () => {
  addMessage("bot", `Hello ${climateBotUser.firstName || climateBotUser.username}. Ask me a climate question.`);
});
