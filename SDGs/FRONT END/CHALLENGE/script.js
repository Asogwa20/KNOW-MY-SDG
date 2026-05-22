const user = window.SDGApp.requireAuth();
if (!user) {
  throw new Error("Authentication required");
}

const setup = document.getElementById("setup");
const game = document.getElementById("game");
const end = document.getElementById("end");
const difficultyEl = document.getElementById("difficulty");
const numQuestionsEl = document.getElementById("numQuestions");
const timePreview = document.getElementById("timePreview");
const startBtn = document.getElementById("startBtn");
const qEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const resultEl = document.getElementById("result");
const timerEl = document.getElementById("timer");
const progressEl = document.getElementById("progress");
const finalScoreEl = document.getElementById("finalScore");
const playAgain = document.getElementById("playAgain");

const challengeQuestions = [
  { q: "How many SDGs are there?", options: ["12", "15", "17", "20"], answer: 2 },
  { q: "Which goal focuses on ending poverty?", options: ["Goal 1", "Goal 4", "Goal 8", "Goal 16"], answer: 0 },
  { q: "Which goal is Zero Hunger?", options: ["Goal 2", "Goal 6", "Goal 9", "Goal 14"], answer: 0 },
  { q: "Which goal covers quality education?", options: ["Goal 3", "Goal 4", "Goal 7", "Goal 10"], answer: 1 },
  { q: "Which goal focuses on climate action?", options: ["Goal 7", "Goal 11", "Goal 13", "Goal 17"], answer: 2 },
  { q: "Clean Water and Sanitation is Goal?", options: ["5", "6", "7", "8"], answer: 1 },
  { q: "Which goal is about gender equality?", options: ["Goal 5", "Goal 9", "Goal 12", "Goal 16"], answer: 0 },
  { q: "Life Below Water is Goal?", options: ["13", "14", "15", "16"], answer: 1 },
  { q: "Partnerships for the Goals is Goal?", options: ["11", "14", "16", "17"], answer: 3 },
  { q: "Good Health and Well-Being is Goal?", options: ["2", "3", "4", "5"], answer: 1 },
  { q: "Responsible Consumption and Production is Goal?", options: ["10", "11", "12", "13"], answer: 2 },
  { q: "Peace, Justice and Strong Institutions is Goal?", options: ["14", "15", "16", "17"], answer: 2 },
  { q: "Which goal encourages affordable and clean energy?", options: ["Goal 6", "Goal 7", "Goal 8", "Goal 9"], answer: 1 },
  { q: "Reduced Inequalities is Goal?", options: ["8", "9", "10", "11"], answer: 2 },
  { q: "Sustainable Cities and Communities is Goal?", options: ["9", "10", "11", "12"], answer: 2 },
  { q: "Life on Land is Goal?", options: ["12", "13", "14", "15"], answer: 3 },
  { q: "Which goal links jobs and economic growth?", options: ["Goal 4", "Goal 8", "Goal 10", "Goal 12"], answer: 1 },
  { q: "Which goal focuses on innovation and infrastructure?", options: ["Goal 5", "Goal 7", "Goal 9", "Goal 11"], answer: 2 },
  { q: "The SDGs were adopted in which year?", options: ["2010", "2015", "2020", "2024"], answer: 1 },
  { q: "What year is the SDG target deadline?", options: ["2028", "2030", "2040", "2050"], answer: 1 }
];

const TIME_LIMITS = {
  easy: { 5: 15, 10: 25, 15: 35, 20: 45 },
  medium: { 5: 10, 10: 15, 15: 20, 20: 25 },
  hard: { 5: 7, 10: 12, 15: 17, 20: 22 }
};

let selectedQuestions = [];
let index = 0;
let score = 0;
let totalTime = 0;
let countdown;

function shuffle(items) {
  return items.slice().sort(() => Math.random() - 0.5);
}

function updateTimePreview() {
  const difficulty = difficultyEl.value;
  const num = Number(numQuestionsEl.value);
  timePreview.textContent = `Whole challenge time: ${TIME_LIMITS[difficulty][num]} seconds.`;
}

function startTimer() {
  timerEl.textContent = `Time: ${totalTime}s`;
  countdown = setInterval(() => {
    totalTime -= 1;
    timerEl.textContent = `Time: ${totalTime}s`;
    if (totalTime <= 0) {
      clearInterval(countdown);
      endGame();
    }
  }, 1000);
}

function showQuestion() {
  if (index >= selectedQuestions.length) {
    endGame();
    return;
  }

  const question = selectedQuestions[index];
  qEl.textContent = question.q;
  progressEl.textContent = `Question ${index + 1} of ${selectedQuestions.length}`;
  resultEl.textContent = "";
  optionsEl.innerHTML = "";

  question.options.forEach((option, optionIndex) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = option;
    button.addEventListener("click", () => checkAnswer(optionIndex, question.answer));
    optionsEl.appendChild(button);
  });
}

function checkAnswer(selected, correct) {
  const buttons = optionsEl.querySelectorAll("button");
  buttons.forEach((button, buttonIndex) => {
    button.disabled = true;
    if (buttonIndex === correct) {
      button.classList.add("correct");
    } else if (buttonIndex === selected) {
      button.classList.add("wrong");
    }
  });

  if (selected === correct) {
    score += 1;
    resultEl.textContent = "Correct.";
  } else {
    resultEl.textContent = "Not quite.";
  }

  setTimeout(() => {
    index += 1;
    showQuestion();
  }, 900);
}

function endGame() {
  clearInterval(countdown);
  game.classList.add("hidden");
  end.classList.remove("hidden");
  const points = score * 10;
  window.SDGApp.updateUserScore("challengeScore", points);
  finalScoreEl.textContent = `You scored ${score} out of ${selectedQuestions.length} and earned ${points} points.`;
}

startBtn.addEventListener("click", () => {
  const difficulty = difficultyEl.value;
  const num = Number(numQuestionsEl.value);
  selectedQuestions = shuffle(challengeQuestions).slice(0, num);
  totalTime = TIME_LIMITS[difficulty][num];
  setup.classList.add("hidden");
  end.classList.add("hidden");
  game.classList.remove("hidden");
  index = 0;
  score = 0;
  startTimer();
  showQuestion();
});

playAgain.addEventListener("click", () => {
  end.classList.add("hidden");
  setup.classList.remove("hidden");
  score = 0;
  index = 0;
  updateTimePreview();
});

difficultyEl.addEventListener("change", updateTimePreview);
numQuestionsEl.addEventListener("change", updateTimePreview);
updateTimePreview();

document.getElementById("friendChallengeForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const friendUsername = document.getElementById("friendUsername").value.trim();
  const friendDate = document.getElementById("friendDate").value;
  const friendTime = document.getElementById("friendTime").value;
  const friendDifficulty = document.getElementById("friendDifficulty").value;
  const friendQuestions = document.getElementById("friendQuestions").value;

  if (!window.SDGApp.findUser(friendUsername)) {
    window.SDGApp.showToast("That username was not found.");
    return;
  }

  if (friendUsername.toLowerCase() === user.username.toLowerCase()) {
    window.SDGApp.showToast("Choose another student to challenge.");
    return;
  }

  window.SDGApp.createNotification({
    type: "friend_challenge",
    to: friendUsername,
    from: user.username,
    title: `${user.username} challenged you`,
    message: `Level: ${friendDifficulty}. Questions: ${friendQuestions}. Scheduled for ${friendDate} at ${friendTime}.`
  });
  window.SDGApp.showToast("Challenge sent to your friend.");
  event.target.reset();
});

document.getElementById("teamForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const teamName = document.getElementById("teamName").value.trim();
  const teamMembers = document.getElementById("teamMembers").value
    .split(",")
    .map((member) => member.trim())
    .filter(Boolean);

  const result = await window.SDGApp.createTeam(teamName, user.username, [user.username, ...teamMembers]);
  if (!result.ok) {
    window.SDGApp.showToast(result.message);
    return;
  }

  window.SDGApp.showToast(`Team "${teamName}" created and invitations sent.`);
  event.target.reset();
});
