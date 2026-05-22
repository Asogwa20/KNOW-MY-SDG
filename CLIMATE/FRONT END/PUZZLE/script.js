const climatePuzzleUser = window.ClimateApp.requireAuth();
if (!climatePuzzleUser) {
  throw new Error("Authentication required");
}

document.addEventListener("DOMContentLoaded", () => {
  const PUZZLE_BANK = [
    { word: "forest", emoji: "Tree", hint: "Large area of trees" },
    { word: "ocean", emoji: "Wave", hint: "Covers most of Earth" },
    { word: "carbon", emoji: "CO2", hint: "Key climate element" },
    { word: "solar", emoji: "Sun", hint: "From the sun" },
    { word: "recycle", emoji: "Loop", hint: "Reuse materials" },
    { word: "compost", emoji: "Leaf", hint: "Organic waste into soil" },
    { word: "glacier", emoji: "Ice", hint: "Melting ice mass" },
    { word: "climate", emoji: "Earth", hint: "Long-term weather pattern" },
    { word: "energy", emoji: "Bolt", hint: "Needed to power things" },
    { word: "water", emoji: "Drop", hint: "Essential for life" },
    { word: "wind", emoji: "Air", hint: "Air in motion" },
    { word: "wetland", emoji: "Marsh", hint: "Water-rich ecosystem" },
    { word: "biodiversity", emoji: "Life", hint: "Variety of living things" },
    { word: "adaptation", emoji: "Shield", hint: "Adjusting to climate impacts" },
    { word: "mitigation", emoji: "Action", hint: "Reducing emissions"
    }
  ];

  function shuffle(items) {
    return items.slice().sort(() => Math.random() - 0.5);
  }

  let selected = [];
  let currentIndex = 0;
  let timeLeft = 0;
  let timer = null;
  let score = 0;

  const puzzleArea = document.getElementById("puzzleArea");
  const pTimeEl = document.getElementById("pTime");
  const pScoreEl = document.getElementById("pScore");
  const pContent = document.getElementById("pContent");
  const pNext = document.getElementById("pNext");
  const pQuit = document.getElementById("pQuit");
  const pResult = document.getElementById("pResult");
  const pResultText = document.getElementById("pResultText");
  const pRestart = document.getElementById("pRestart");
  const pSave = document.getElementById("pSave");

  function scrambleWord(word) {
    const letters = word.split("");
    for (let i = letters.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    const scrambled = letters.join("");
    return scrambled === word ? scrambleWord(word) : scrambled;
  }

  function renderCurrent() {
    const item = selected[currentIndex];
    pContent.innerHTML = `
      <div class="puzzle-card">
        <div class="emoji">${item.emoji}</div>
        <h3>${scrambleWord(item.word)}</h3>
        <input id="pAnswer" placeholder="Type the word">
        <p>Hint: ${item.hint}</p>
      </div>
    `;
    pScoreEl.textContent = String(score);
  }

  function finishPuzzle() {
    clearInterval(timer);
    puzzleArea.classList.add("hidden");
    pResult.classList.remove("hidden");
    pResultText.textContent = `You answered ${score} correctly out of ${selected.length}.`;
  }

  function startPuzzle(count) {
    selected = shuffle(PUZZLE_BANK).slice(0, count);
    currentIndex = 0;
    score = 0;
    timeLeft = count + 8;
    puzzleArea.classList.remove("hidden");
    pResult.classList.add("hidden");
    renderCurrent();

    clearInterval(timer);
    pTimeEl.textContent = String(timeLeft);
    timer = setInterval(() => {
      timeLeft -= 1;
      pTimeEl.textContent = String(timeLeft);
      if (timeLeft <= 0) {
        finishPuzzle();
      }
    }, 1000);
  }

  document.querySelectorAll(".startPuzzle").forEach((button) => {
    button.addEventListener("click", () => startPuzzle(Number(button.dataset.count)));
  });

  pNext.addEventListener("click", () => {
    const answer = document.getElementById("pAnswer").value.trim().toLowerCase();
    if (answer === selected[currentIndex].word.toLowerCase()) {
      score += 1;
    }
    currentIndex += 1;
    if (currentIndex >= selected.length) {
      finishPuzzle();
      return;
    }
    renderCurrent();
  });

  pQuit.addEventListener("click", () => {
    clearInterval(timer);
    window.location.reload();
  });

  pRestart.addEventListener("click", () => window.location.reload());
  pSave.addEventListener("click", () => {
    window.ClimateApp.updateUserScore("puzzleScore", score * 10);
    window.location.href = "../leaderboard/index.html";
  });
});
