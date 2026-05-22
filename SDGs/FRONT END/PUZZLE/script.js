const puzzleUser = window.SDGApp.requireAuth();
if (!puzzleUser) {
  throw new Error("Authentication required");
}

document.addEventListener("DOMContentLoaded", () => {
  const goals = Array.from({ length: 17 }, (_, index) => index + 1);
  const goalNames = {
    1: "No Poverty",
    2: "Zero Hunger",
    3: "Good Health",
    4: "Quality Education",
    5: "Gender Equality",
    6: "Clean Water",
    7: "Clean Energy",
    8: "Decent Work",
    9: "Innovation",
    10: "Reduced Inequalities",
    11: "Sustainable Cities",
    12: "Responsible Consumption",
    13: "Climate Action",
    14: "Life Below Water",
    15: "Life on Land",
    16: "Peace and Justice",
    17: "Partnerships"
  };
  const themeMap = {
    people: [1, 2, 3, 4, 5],
    prosperity: [7, 8, 9, 10, 11],
    planet: [6, 12, 13, 14, 15],
    peace: [16],
    partnership: [17]
  };

  const puzzleBoard = document.getElementById("puzzleBoard");
  const logoPieces = document.getElementById("logoPieces");
  const namePieces = document.getElementById("namePieces");
  const finishBtn = document.getElementById("finishLevel1");
  const scoreText = document.getElementById("scoreText");
  const scoreModal = document.getElementById("scoreModal");
  const closeScoreModal = document.getElementById("closeScoreModal");
  const levelButtons = document.querySelectorAll(".levelBtn");
  const levelsPanel = document.getElementById("levels");
  const gamePanel = document.getElementById("game");
  const level1 = document.getElementById("level1");
  const level2 = document.getElementById("level2");
  const themeBins = document.getElementById("themeBins");
  const themePieces = document.getElementById("themePieces");
  const finishLevel2 = document.getElementById("finishLevel2");

  let levelOneScore = 0;
  let levelOneAwarded = false;
  let levelTwoAwarded = false;

  function shuffle(items) {
    return items.slice().sort(() => Math.random() - 0.5);
  }

  function openLevel(level) {
    levelsPanel.classList.add("hidden");
    gamePanel.classList.remove("hidden");
    level1.classList.toggle("hidden", level !== 1);
    level2.classList.toggle("hidden", level !== 2);
  }

  function buildMatchingGame() {
    const boardNumbers = shuffle(goals);
    puzzleBoard.innerHTML = "";
    logoPieces.innerHTML = "";
    namePieces.innerHTML = "";
    levelOneScore = 0;

    boardNumbers.forEach((goal) => {
      const slot = document.createElement("div");
      slot.className = "slot";
      slot.dataset.id = String(goal);
      slot.innerHTML = `
        <div class="slot-number">#${goal}</div>
        <div class="slot-name" data-type="name">Drop name</div>
        <div class="slot-logo" data-type="logo">Drop logo</div>
      `;
      puzzleBoard.appendChild(slot);
    });

    shuffle(goals).forEach((goal) => {
      const label = document.createElement("div");
      label.className = "piece";
      label.draggable = true;
      label.dataset.id = String(goal);
      label.dataset.type = "name";
      label.textContent = goalNames[goal];
      namePieces.appendChild(label);

      const logo = document.createElement("div");
      logo.className = "piece";
      logo.draggable = true;
      logo.dataset.id = String(goal);
      logo.dataset.type = "logo";
      logo.innerHTML = `<img src="../Edited images/goal ${goal}.jpg" alt="Goal ${goal}">`;
      logoPieces.appendChild(logo);
    });
  }

  function enableMatchingDrops() {
    document.querySelectorAll(".piece").forEach((piece) => {
      piece.addEventListener("dragstart", (event) => {
        event.dataTransfer.setData("id", piece.dataset.id);
        event.dataTransfer.setData("type", piece.dataset.type);
      });
    });

    document.querySelectorAll(".slot-name, .slot-logo").forEach((slot) => {
      slot.addEventListener("dragover", (event) => event.preventDefault());
      slot.addEventListener("drop", (event) => {
        event.preventDefault();
        const pieceId = event.dataTransfer.getData("id");
        const pieceType = event.dataTransfer.getData("type");
        const slotId = slot.parentElement.dataset.id;
        const slotType = slot.dataset.type;

        if (pieceId !== slotId || pieceType !== slotType || slot.dataset.locked === "true") {
          return;
        }

        if (pieceType === "logo") {
          slot.innerHTML = `<img src="../Edited images/goal ${pieceId}.jpg" alt="Goal ${pieceId}">`;
        } else {
          slot.textContent = goalNames[pieceId];
        }

        slot.dataset.locked = "true";
        slot.classList.add("matched");
        const dragged = document.querySelector(`.piece[data-id="${pieceId}"][data-type="${pieceType}"]`);
        if (dragged) {
          dragged.remove();
        }

        levelOneScore += 1;
      });
    });
  }

  function buildThemeLevel() {
    themeBins.innerHTML = "";
    themePieces.innerHTML = "";

    Object.keys(themeMap).forEach((theme) => {
      const bin = document.createElement("div");
      bin.className = "theme-bin";
      bin.dataset.theme = theme;
      bin.innerHTML = `<h3>${theme.charAt(0).toUpperCase() + theme.slice(1)}</h3><div class="bin-items"></div>`;
      bin.addEventListener("dragover", (event) => event.preventDefault());
      bin.addEventListener("drop", (event) => {
        event.preventDefault();
        const pieceId = Number(event.dataTransfer.getData("id"));
        const piece = themePieces.querySelector(`[data-id="${pieceId}"]`);
        if (!piece || !themeMap[theme].includes(pieceId)) {
          return;
        }
        bin.querySelector(".bin-items").appendChild(piece);
        piece.dataset.theme = theme;
      });
      themeBins.appendChild(bin);
    });

    shuffle(goals).forEach((goal) => {
      const piece = document.createElement("div");
      piece.className = "piece";
      piece.draggable = true;
      piece.dataset.id = String(goal);
      piece.textContent = `Goal ${goal}`;
      piece.addEventListener("dragstart", (event) => {
        event.dataTransfer.setData("id", piece.dataset.id);
      });
      themePieces.appendChild(piece);
    });
  }

  levelButtons.forEach((button) => {
    button.addEventListener("click", () => openLevel(Number(button.dataset.level)));
  });

  finishBtn.addEventListener("click", () => {
    const marks = levelOneScore / 2;
    let message = `You scored ${marks} out of 17 marks in Level 1.`;

    if (marks >= 16) {
      message += " Level 2 unlocked.";
      document.querySelector('.levelBtn[data-level="2"]').disabled = false;
      document.querySelector('.levelBtn[data-level="2"]').classList.remove("locked");
      if (!levelOneAwarded) {
        window.SDGApp.updateUserScore("puzzleScore", Math.round(marks));
        levelOneAwarded = true;
      }
    } else {
      message += " Reach 16 marks to unlock Level 2.";
    }

    scoreText.textContent = message;
    scoreModal.classList.add("open");
  });

  finishLevel2.addEventListener("click", () => {
    const placed = Array.from(themeBins.querySelectorAll(".piece")).length;
    if (placed < 17) {
      scoreText.textContent = "Place all 17 goals into a theme before finishing Level 2.";
      scoreModal.classList.add("open");
      return;
    }

    let correct = 0;
    themeBins.querySelectorAll(".theme-bin").forEach((bin) => {
      bin.querySelectorAll(".piece").forEach((piece) => {
        const goal = Number(piece.dataset.id);
        if (themeMap[bin.dataset.theme].includes(goal)) {
          correct += 1;
        }
      });
    });

    if (!levelTwoAwarded) {
      window.SDGApp.updateUserScore("puzzleScore", correct);
      levelTwoAwarded = true;
    }
    scoreText.textContent = `Level 2 score: ${correct} out of 17. This theme-sorting puzzle is the suggested next level idea.`;
    scoreModal.classList.add("open");
  });

  closeScoreModal.addEventListener("click", () => {
    scoreModal.classList.remove("open");
  });

  buildMatchingGame();
  enableMatchingDrops();
  buildThemeLevel();
});
