const climateQuizUser = window.ClimateApp.requireAuth();
if (!climateQuizUser) {
  throw new Error("Authentication required");
}

const questions = [
  { q: "What is the main cause of current climate change?", options: ["Burning fossil fuels", "Volcanoes", "Moon cycles", "Ocean tides"], answer: 0 },
  { q: "Which greenhouse gas is released most from burning coal, oil, and gas?", options: ["Carbon dioxide", "Helium", "Oxygen", "Hydrogen"], answer: 0 },
  { q: "Which SDG focuses on Climate Action?", options: ["Goal 7", "Goal 11", "Goal 13", "Goal 15"], answer: 2 },
  { q: "Which energy source is renewable?", options: ["Solar", "Diesel", "Coal", "Petrol"], answer: 0 },
  { q: "What does sea level rise mainly result from?", options: ["Melting ice and warming oceans", "More fishing", "Forest growth", "Earthquakes"], answer: 0 },
  { q: "Which activity helps reduce emissions?", options: ["Using public transport", "Burning waste", "Cutting forests", "Leaving lights on"], answer: 0 },
  { q: "What is deforestation?", options: ["Cutting down trees", "Growing forests", "Cleaning rivers", "Saving water"], answer: 0 },
  { q: "Which gas is strongly linked to livestock emissions?", options: ["Methane", "Oxygen", "Nitrogen", "Steam"], answer: 0 },
  { q: "What is climate adaptation?", options: ["Adjusting to climate impacts", "Ignoring climate risks", "Stopping all rain", "Creating smoke"], answer: 0 },
  { q: "What is climate mitigation?", options: ["Reducing greenhouse gas emissions", "Building more roads", "Using more fossil fuels", "Stopping farming"], answer: 0 },
  { q: "What is a carbon footprint?", options: ["Total emissions caused by activities", "Foot size", "A tree root", "A type of soil"], answer: 0 },
  { q: "Which region is warming fastest?", options: ["Arctic", "Sahara", "Mediterranean", "Amazon"], answer: 0 },
  { q: "What is ocean acidification linked to?", options: ["CO2 absorbed by oceans", "Plastic bottles only", "Too much salt", "Volcano ash"], answer: 0 },
  { q: "Which transport option usually has the lowest emissions?", options: ["Cycling", "Airplane", "Private jet", "Diesel truck"], answer: 0 },
  { q: "What helps cities stay cooler?", options: ["Trees and green roofs", "More concrete", "More engines", "Removing parks"], answer: 0 },
  { q: "What is net zero?", options: ["Balancing emissions with removals", "No water use", "No jobs", "No farming"], answer: 0 },
  { q: "Which treaty was signed in 2015 to address climate change?", options: ["Paris Agreement", "Kyoto Coal Pact", "Geneva Trade Deal", "Montreal Charter"], answer: 0 },
  { q: "What kind of weather events are often worsened by climate change?", options: ["Heatwaves and floods", "Solar eclipses", "Earth rotation", "Moonrise"], answer: 0 },
  { q: "Why are forests important for climate?", options: ["They absorb CO2", "They make plastic", "They raise fuel use", "They increase smoke"], answer: 0 },
  { q: "Which personal action can help most at home?", options: ["Use energy-efficient appliances", "Waste electricity", "Burn plastics", "Leave taps running"], answer: 0 },
  { q: "What is renewable energy transition?", options: ["Moving from fossil fuels to clean energy", "Building more coal plants", "Stopping science", "Using more gasoline"], answer: 0 },
  { q: "Which animal is often used as a symbol of Arctic climate risk?", options: ["Polar bear", "Lion", "Elephant", "Horse"], answer: 0 },
  { q: "Which climate solution protects coasts and stores carbon?", options: ["Mangrove restoration", "Open burning", "More concrete", "Oil drilling"], answer: 0 },
  { q: "What is a drought?", options: ["A long period with too little rain", "A strong snowstorm", "A solar eclipse", "A type of forest"], answer: 0 },
  { q: "Which group is often hit hardest by climate change?", options: ["Poor and vulnerable communities", "Only tourists", "Only pilots", "Only athletes"], answer: 0 },
  { q: "What does recycling help reduce?", options: ["Waste and resource use", "Sunlight", "Wind", "Trees"], answer: 0 },
  { q: "Which fuel is the dirtiest for electricity generation?", options: ["Coal", "Solar", "Wind", "Hydro"], answer: 0 },
  { q: "What can schools do to support climate action?", options: ["Teach sustainability and reduce waste", "Burn rubbish", "Increase plastic use", "Turn off science"], answer: 0 },
  { q: "What is sustainable transport?", options: ["Transport with lower environmental impact", "Any transport with loud engines", "Only private cars", "Only airplanes"], answer: 0 },
  { q: "Why is Goal 13 connected to other SDGs?", options: ["Climate affects health, food, water, and livelihoods", "It only affects weather apps", "It only affects tourism", "It only affects oceans"], answer: 0 }
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
      optionsEl.querySelectorAll("button").forEach((entry, buttonIndex) => {
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
  window.ClimateApp.updateUserScore("quizScore", points);
  quizBox.classList.add("hidden");
  resultBox.classList.remove("hidden");
  scoreEl.textContent = `You scored ${score} out of ${selectedQuestions.length} and earned ${points} climate points.`;
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
