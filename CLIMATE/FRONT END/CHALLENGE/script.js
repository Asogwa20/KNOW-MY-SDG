const climateChallengeUser = window.ClimateApp.requireAuth();
if (!climateChallengeUser) {
  throw new Error("Authentication required");
}

const setup = document.getElementById("setup");
const game = document.getElementById("game");
const end = document.getElementById("end");
const numQuestionsEl = document.getElementById("numQuestions");
const startBtn = document.getElementById("startBtn");
const qEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const resultEl = document.getElementById("result");
const timerEl = document.getElementById("timer");
const progressEl = document.getElementById("progress");
const finalScoreEl = document.getElementById("finalScore");
const playAgain = document.getElementById("playAgain");

const challengeQuestions = [
  { q: "Which gas traps more heat than CO2 over a short time?", options: ["Methane", "Oxygen", "Nitrogen", "Hydrogen"], answer: 0 },
  { q: "Which ecosystem helps protect coasts from storms?", options: ["Mangroves", "Parking lots", "Dry roads", "Factories"], answer: 0 },
  { q: "Which climate treaty was agreed in 2015?", options: ["Paris Agreement", "Kyoto Charter", "Montreal Trade Pact", "Geneva Deal"], answer: 0 },
  { q: "Which renewable energy comes from the sun?", options: ["Solar", "Diesel", "Coal", "Gas"], answer: 0 },
  { q: "What is the main reason sea level rises?", options: ["Melting ice and warming oceans", "More fish", "More roads", "Less rainfall"], answer: 0 },
  { q: "What is reforestation?", options: ["Planting trees again", "Cutting forests", "Burning fields", "Building roads"], answer: 0 },
  { q: "Which region is warming especially fast?", options: ["Arctic", "Atlantic", "Sahara", "Mediterranean"], answer: 0 },
  { q: "Which transport option is most climate-friendly?", options: ["Cycling", "Private jet", "Large SUV", "Diesel truck"], answer: 0 },
  { q: "Which gas is often linked to livestock emissions?", options: ["Methane", "Helium", "Hydrogen", "Neon"], answer: 0 },
  { q: "What does adaptation mean in climate work?", options: ["Adjusting to impacts", "Ignoring the problem", "Using more fuel", "Stopping all farming"], answer: 0 },
  { q: "What does mitigation mean?", options: ["Reducing emissions", "Building more smokestacks", "Cutting climate classes", "Using more oil"], answer: 0 },
  { q: "Which waste type can create methane in landfills?", options: ["Food waste", "Glass", "Metal", "Stone"], answer: 0 },
  { q: "What is a heatwave?", options: ["A period of unusually high heat", "A snowstorm", "A type of cloud", "A water pipe"], answer: 0 },
  { q: "Which climate action works well at school?", options: ["Recycling and energy saving", "Burning waste", "Leaving taps open", "Using more plastic"], answer: 0 },
  { q: "Which planet-wide goal is directly about climate?", options: ["SDG 13", "SDG 2", "SDG 6", "SDG 9"], answer: 0 },
  { q: "What is a carbon footprint?", options: ["Total emissions caused by activities", "A shoe print", "A type of soil", "A forest path"], answer: 0 },
  { q: "Which fuel is the dirtiest for electricity generation?", options: ["Coal", "Wind", "Solar", "Hydro"], answer: 0 },
  { q: "What is one effect of ocean warming?", options: ["Stronger storms", "More snow everywhere", "Less evaporation", "No tides"], answer: 0 },
  { q: "What can households do to lower emissions?", options: ["Use efficient appliances", "Waste electricity", "Burn plastic", "Use more petrol"], answer: 0 },
  { q: "Why are forests important for climate action?", options: ["They absorb CO2", "They make engines faster", "They increase emissions", "They block rain"], answer: 0 }
];

let selectedQuestions = [];
let index = 0;
let score = 0;
let totalTime = 0;
let countdown;

function shuffle(items) {
  return items.slice().sort(() => Math.random() - 0.5);
}

startBtn.addEventListener("click", () => {
  const num = parseInt(numQuestionsEl.value, 10);
  selectedQuestions = shuffle(challengeQuestions).slice(0, num);
  const timeMap = { 5: 30, 10: 55, 15: 75, 20: 95 };
  totalTime = timeMap[num];

  setup.classList.add("hidden");
  game.classList.remove("hidden");
  startTimer();
  showQuestion();
});

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

  const current = selectedQuestions[index];
  qEl.textContent = current.q;
  optionsEl.innerHTML = "";
  resultEl.textContent = "";
  progressEl.textContent = `Question ${index + 1} of ${selectedQuestions.length}`;

  current.options.forEach((option, optionIndex) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = option;
    button.addEventListener("click", () => checkAnswer(optionIndex, current.answer));
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
  window.ClimateApp.updateUserScore("challengeScore", points);
  finalScoreEl.textContent = `You scored ${score} out of ${selectedQuestions.length} and earned ${points} climate points.`;
}

playAgain.addEventListener("click", () => {
  end.classList.add("hidden");
  setup.classList.remove("hidden");
  score = 0;
  index = 0;
});
