const user = window.SDGApp.requireAuth();
if (!user) {
  throw new Error("Authentication required");
}

const questions = [
  { q: "How many Sustainable Development Goals are there?", options: ["15", "16", "17", "18"], answer: 2 },
  { q: "What year is the SDG target deadline?", options: ["2025", "2030", "2040", "2050"], answer: 1 },
  { q: "Which goal focuses on ending poverty?", options: ["Goal 1", "Goal 3", "Goal 7", "Goal 11"], answer: 0 },
  { q: "Which goal is about zero hunger?", options: ["Goal 2", "Goal 4", "Goal 6", "Goal 14"], answer: 0 },
  { q: "Which goal promotes good health and well-being?", options: ["Goal 2", "Goal 3", "Goal 8", "Goal 10"], answer: 1 },
  { q: "Which SDG focuses on quality education?", options: ["Goal 4", "Goal 5", "Goal 12", "Goal 15"], answer: 0 },
  { q: "Gender equality is covered by which goal?", options: ["Goal 3", "Goal 5", "Goal 9", "Goal 16"], answer: 1 },
  { q: "Clean Water and Sanitation is which goal?", options: ["Goal 4", "Goal 6", "Goal 8", "Goal 13"], answer: 1 },
  { q: "Affordable and Clean Energy is which goal?", options: ["Goal 5", "Goal 7", "Goal 11", "Goal 17"], answer: 1 },
  { q: "Decent Work and Economic Growth is which goal?", options: ["Goal 6", "Goal 8", "Goal 9", "Goal 14"], answer: 1 },
  { q: "Industry, Innovation and Infrastructure is which goal?", options: ["Goal 7", "Goal 9", "Goal 10", "Goal 12"], answer: 1 },
  { q: "Reduced Inequalities is which goal?", options: ["Goal 8", "Goal 10", "Goal 13", "Goal 16"], answer: 1 },
  { q: "Sustainable Cities and Communities is which goal?", options: ["Goal 9", "Goal 11", "Goal 14", "Goal 17"], answer: 1 },
  { q: "Responsible Consumption and Production is which goal?", options: ["Goal 10", "Goal 12", "Goal 13", "Goal 15"], answer: 1 },
  { q: "Climate Action is which goal?", options: ["Goal 11", "Goal 12", "Goal 13", "Goal 17"], answer: 2 },
  { q: "Life Below Water is which goal?", options: ["Goal 12", "Goal 13", "Goal 14", "Goal 16"], answer: 2 },
  { q: "Life on Land is which goal?", options: ["Goal 13", "Goal 15", "Goal 16", "Goal 17"], answer: 1 },
  { q: "Peace, Justice and Strong Institutions is which goal?", options: ["Goal 14", "Goal 15", "Goal 16", "Goal 17"], answer: 2 },
  { q: "Partnerships for the Goals is which goal?", options: ["Goal 10", "Goal 12", "Goal 15", "Goal 17"], answer: 3 },
  { q: "Which goal is closely linked to renewable energy access?", options: ["Goal 2", "Goal 7", "Goal 9", "Goal 11"], answer: 1 },
  { q: "Which goal highlights the need for resilient cities?", options: ["Goal 5", "Goal 11", "Goal 14", "Goal 16"], answer: 1 },
  { q: "Which goal covers ocean conservation?", options: ["Goal 6", "Goal 9", "Goal 14", "Goal 15"], answer: 2 },
  { q: "Which goal emphasizes global cooperation?", options: ["Goal 3", "Goal 8", "Goal 12", "Goal 17"], answer: 3 },
  { q: "Which goal includes ending malnutrition?", options: ["Goal 1", "Goal 2", "Goal 4", "Goal 6"], answer: 1 },
  { q: "Which goal includes universal access to education?", options: ["Goal 2", "Goal 4", "Goal 7", "Goal 10"], answer: 1 },
  { q: "Which goal supports safe drinking water?", options: ["Goal 3", "Goal 6", "Goal 8", "Goal 15"], answer: 1 },
  { q: "Which goal addresses biodiversity loss on land?", options: ["Goal 9", "Goal 11", "Goal 13", "Goal 15"], answer: 3 },
  { q: "Which goal supports fair institutions and justice?", options: ["Goal 4", "Goal 10", "Goal 16", "Goal 17"], answer: 2 },
  { q: "Which goal helps connect learning, jobs, and skills development?", options: ["Goal 4", "Goal 8", "Both Goal 4 and Goal 8", "Goal 14"], answer: 2 },
  { q: "Which phrase best describes the SDGs?", options: ["A military treaty", "A blueprint for sustainable development", "A sports program", "A trade-only agreement"], answer: 1 }
];

const quizBox = document.getElementById("quizBox");
const resultBox = document.getElementById("resultBox");
const questionNumber = document.getElementById("questionNumber");
const questionText = document.getElementById("questionText");
const optionsEl = document.getElementById("options");
const nextBtn = document.getElementById("nextBtn");
const scoreEl = document.getElementById("score");

let selectedQuestions = [];
let currentIndex = 0;
let score = 0;
let selectedChoice = null;

function shuffle(items) {
  return items.slice().sort(() => Math.random() - 0.5);
}

function loadQuestion() {
  const current = selectedQuestions[currentIndex];
  questionNumber.textContent = `Question ${currentIndex + 1} of ${selectedQuestions.length}`;
  questionText.textContent = current.q;
  optionsEl.innerHTML = "";
  nextBtn.disabled = true;
  selectedChoice = null;

  current.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.className = "option-btn";
    button.type = "button";
    button.textContent = option;
    button.addEventListener("click", () => {
      if (selectedChoice !== null) {
        return;
      }

      selectedChoice = index;
      const buttons = optionsEl.querySelectorAll("button");
      buttons.forEach((entry, buttonIndex) => {
        entry.disabled = true;
        if (buttonIndex === current.answer) {
          entry.classList.add("correct");
        } else if (buttonIndex === index) {
          entry.classList.add("wrong");
        }
      });

      if (index === current.answer) {
        score += 1;
      }

      nextBtn.disabled = false;
    });
    optionsEl.appendChild(button);
  });
}

function startQuiz() {
  const count = Number(document.getElementById("questionCount").value || 5);
  selectedQuestions = shuffle(questions).slice(0, count);
  currentIndex = 0;
  score = 0;
  document.getElementById("startQuizBtn").disabled = true;
  document.getElementById("questionCount").disabled = true;
  quizBox.classList.remove("hidden");
  resultBox.classList.add("hidden");
  loadQuestion();
}

function finishQuiz() {
  const points = score * 10;
  window.SDGApp.updateUserScore("quizScore", points);
  quizBox.classList.add("hidden");
  resultBox.classList.remove("hidden");
  scoreEl.textContent = `You scored ${score} out of ${selectedQuestions.length} and earned ${points} points.`;
}

nextBtn.addEventListener("click", () => {
  currentIndex += 1;
  if (currentIndex >= selectedQuestions.length) {
    finishQuiz();
    return;
  }
  loadQuestion();
});

document.getElementById("startQuizBtn").addEventListener("click", startQuiz);
document.getElementById("restartQuizBtn").addEventListener("click", () => window.location.reload());
