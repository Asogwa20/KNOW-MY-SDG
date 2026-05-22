const learnUser = window.SDGApp.requireAuth();
if (!learnUser) {
  throw new Error("Authentication required");
}

const MIN_STAGE_SECONDS = 90;
const stageTimers = {};
const learnProgress = window.SDGApp.getUserLearnProgress(learnUser.username);

const GOALS = [
  {
    id: 1,
    title: "No Poverty",
    summary: "End poverty in all its forms everywhere by improving income security, services, and resilience.",
    targets: ["End extreme poverty", "Expand social protection", "Improve access to resources", "Protect vulnerable communities"],
    actions: ["Support community aid drives", "Promote inclusive opportunities", "Raise awareness on poverty causes"]
  },
  {
    id: 2,
    title: "Zero Hunger",
    summary: "End hunger, improve nutrition, and support sustainable agriculture for stronger food systems.",
    targets: ["End hunger", "Improve nutrition", "Support small farmers", "Promote sustainable food systems"],
    actions: ["Reduce food waste", "Support school gardens", "Promote food sharing projects"]
  },
  {
    id: 3,
    title: "Good Health and Well-Being",
    summary: "Ensure healthy lives and promote well-being for all at all ages.",
    targets: ["Reduce maternal and child deaths", "Fight disease", "Improve mental health", "Expand healthcare access"],
    actions: ["Support hygiene campaigns", "Promote healthy habits", "Encourage mental wellness awareness"]
  },
  {
    id: 4,
    title: "Quality Education",
    summary: "Ensure inclusive, equitable quality education and promote lifelong learning opportunities.",
    targets: ["Expand school access", "Improve literacy", "Promote equal learning", "Strengthen skills development"],
    actions: ["Help classmates learn", "Support reading clubs", "Share educational materials"]
  },
  {
    id: 5,
    title: "Gender Equality",
    summary: "Achieve gender equality and empower all women and girls in social, economic, and political life.",
    targets: ["End discrimination", "Stop violence", "Increase leadership access", "Promote equal opportunity"],
    actions: ["Challenge stereotypes", "Support equal participation", "Promote fairness in school clubs"]
  },
  {
    id: 6,
    title: "Clean Water and Sanitation",
    summary: "Ensure safe water, sanitation, and hygiene for all while protecting water systems.",
    targets: ["Provide safe drinking water", "Improve sanitation", "Reduce pollution", "Protect ecosystems"],
    actions: ["Save water", "Report leaks", "Promote hygiene education"]
  },
  {
    id: 7,
    title: "Affordable and Clean Energy",
    summary: "Expand access to reliable, sustainable, and modern energy.",
    targets: ["Improve energy access", "Increase renewables", "Boost efficiency", "Expand clean technology"],
    actions: ["Save electricity", "Learn about renewables", "Support clean energy awareness"]
  },
  {
    id: 8,
    title: "Decent Work and Economic Growth",
    summary: "Promote productive employment, fair work, and sustainable economic growth.",
    targets: ["Promote jobs", "Support youth employment", "Protect labor rights", "Encourage enterprise"],
    actions: ["Learn practical skills", "Support fair businesses", "Promote safe work values"]
  },
  {
    id: 9,
    title: "Industry, Innovation and Infrastructure",
    summary: "Build resilient infrastructure and support innovation and inclusive industrial progress.",
    targets: ["Improve infrastructure", "Support innovation", "Expand access to technology", "Strengthen research"],
    actions: ["Join invention projects", "Support creative problem-solving", "Explore STEM learning"]
  },
  {
    id: 10,
    title: "Reduced Inequalities",
    summary: "Reduce inequality within and among countries and communities.",
    targets: ["Promote inclusion", "Protect equal opportunity", "Support fair representation", "Expand access to services"],
    actions: ["Include others", "Speak against discrimination", "Promote fair treatment"]
  },
  {
    id: 11,
    title: "Sustainable Cities and Communities",
    summary: "Make cities and settlements inclusive, safe, resilient, and sustainable.",
    targets: ["Improve housing", "Strengthen transport", "Expand safety", "Reduce urban pollution"],
    actions: ["Support cleaner neighborhoods", "Promote public transport", "Care for community spaces"]
  },
  {
    id: 12,
    title: "Responsible Consumption and Production",
    summary: "Encourage efficient use of resources and reduce wasteful patterns of consumption.",
    targets: ["Reduce waste", "Improve recycling", "Promote sustainable lifestyles", "Use resources wisely"],
    actions: ["Reuse materials", "Recycle properly", "Buy only what is needed"]
  },
  {
    id: 13,
    title: "Climate Action",
    summary: "Take urgent action to combat climate change and build resilience to its impacts.",
    targets: ["Cut emissions", "Improve resilience", "Support climate education", "Strengthen adaptation"],
    actions: ["Plant trees", "Save energy", "Join climate clubs"]
  },
  {
    id: 14,
    title: "Life Below Water",
    summary: "Protect oceans, seas, and marine resources from pollution and overuse.",
    targets: ["Reduce marine pollution", "Protect ecosystems", "Support sustainable fishing", "Preserve biodiversity"],
    actions: ["Reduce plastic use", "Support water cleanups", "Protect aquatic life"]
  },
  {
    id: 15,
    title: "Life on Land",
    summary: "Protect forests, biodiversity, and land ecosystems while preventing degradation.",
    targets: ["Protect forests", "Restore land", "Stop biodiversity loss", "Reduce desertification"],
    actions: ["Plant trees", "Protect habitats", "Support conservation awareness"]
  },
  {
    id: 16,
    title: "Peace, Justice and Strong Institutions",
    summary: "Promote peaceful societies, justice, accountability, and strong institutions.",
    targets: ["Reduce violence", "Promote justice", "Strengthen trust", "Support transparency"],
    actions: ["Promote fairness", "Resolve conflicts peacefully", "Support honest leadership"]
  },
  {
    id: 17,
    title: "Partnerships for the Goals",
    summary: "Strengthen cooperation, finance, technology, and partnerships to achieve all the SDGs.",
    targets: ["Promote cooperation", "Share knowledge", "Support global partnerships", "Improve implementation"],
    actions: ["Work in teams", "Share ideas", "Build partnerships for projects"]
  }
];

const THEMES = [
  {
    title: "People",
    text: "Goals 1 to 5 focus on dignity, food, health, education, and equality. They deal with human well-being and fairness.",
    goals: "Goals 1, 2, 3, 4, 5"
  },
  {
    title: "Prosperity",
    text: "Goals 7 to 11 help people build safe, productive, innovative, and sustainable communities and economies.",
    goals: "Goals 7, 8, 9, 10, 11"
  },
  {
    title: "Planet",
    text: "Goals 6, 12, 13, 14, and 15 protect water, climate, land, oceans, and responsible use of natural resources.",
    goals: "Goals 6, 12, 13, 14, 15"
  },
  {
    title: "Peace and Partnership",
    text: "Goals 16 and 17 focus on justice, peace, institutions, and collaboration so the whole agenda can work together.",
    goals: "Goals 16, 17"
  }
];

const BARRIERS = [
  ["Poverty and exclusion", "Health, education, hunger, equality", "Students need to see that economic hardship affects many goals at once."],
  ["Conflict and insecurity", "Peace, justice, education, health", "Violence weakens institutions and interrupts progress across communities."],
  ["Climate change", "Food, water, health, cities, ecosystems", "Climate pressure connects environmental problems with human development."],
  ["Weak services and systems", "Health, education, water, sanitation", "Even when solutions exist, poor delivery systems can block access."],
  ["Inequality and discrimination", "Gender equality, reduced inequalities, justice", "Progress is slower when some groups are left behind."],
  ["Wasteful production and consumption", "Climate, water, land, oceans", "Unsustainable habits increase pollution, pressure, and long-term damage."]
];

const STAGE3_EXAMPLES = [
  {
    title: "At school",
    text: "Students can notice goals in class attendance, fairness, clean toilets, school feeding, safety, recycling, and club activities."
  },
  {
    title: "At home",
    text: "The goals show up in water use, food sharing, energy saving, respectful treatment, and support for learning."
  },
  {
    title: "In the community",
    text: "The goals appear in local roads, sanitation, public safety, health centers, jobs, markets, and environmental care."
  }
];

function formatTimer(seconds) {
  const remaining = Math.max(0, MIN_STAGE_SECONDS - seconds);
  const mins = String(Math.floor(remaining / 60)).padStart(2, "0");
  const secs = String(remaining % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

function setStageAvailability(stageNumber, unlocked) {
  const card = document.querySelector(`.stage-card[data-stage="${stageNumber}"]`);
  const button = card.querySelector(".stage-toggle");
  const status = document.getElementById(`status${stageNumber}`);
  card.classList.toggle("locked-stage", !unlocked);
  button.disabled = !unlocked;
  status.textContent = unlocked ? (learnProgress.completedStages.includes(stageNumber) ? "Completed" : "Open") : "Locked";
}

function unlockNextStage(stageNumber) {
  if (stageNumber >= 4) {
    return;
  }
  learnProgress.unlockedStage = Math.max(learnProgress.unlockedStage || 1, stageNumber + 1);
  setStageAvailability(stageNumber + 1, true);
}

function completeStage(stageNumber) {
  if (!learnProgress.completedStages.includes(stageNumber)) {
    learnProgress.completedStages.push(stageNumber);
  }
  learnProgress.completedStages.sort((left, right) => left - right);
  learnProgress.stageTimes = {
    ...(learnProgress.stageTimes || {}),
    [stageNumber]: MIN_STAGE_SECONDS
  };
  window.SDGApp.completeLearnStage(learnUser.username, stageNumber, MIN_STAGE_SECONDS);
  document.getElementById(`status${stageNumber}`).textContent = "Completed";
  unlockNextStage(stageNumber);

  if (stageNumber === 4) {
    document.getElementById("stage4Quiz").classList.remove("disabled-link");
    document.getElementById("stage4Challenge").classList.remove("disabled-link");
    document.getElementById("stage4Quiz").setAttribute("aria-disabled", "false");
    document.getElementById("stage4Challenge").setAttribute("aria-disabled", "false");
  }
}

function startStageTimer(stageNumber) {
  if (learnProgress.completedStages.includes(stageNumber) || stageTimers[stageNumber]) {
    return;
  }

  let spent = Number((learnProgress.stageTimes || {})[stageNumber] || 0);
  const timerEl = document.getElementById(`timer${stageNumber}`);
  timerEl.textContent = formatTimer(spent);

  stageTimers[stageNumber] = setInterval(() => {
    spent += 1;
    timerEl.textContent = formatTimer(spent);
    if (spent >= MIN_STAGE_SECONDS) {
      clearInterval(stageTimers[stageNumber]);
      delete stageTimers[stageNumber];
      completeStage(stageNumber);
    }
  }, 1000);
}

function renderStage1Goals() {
  const container = document.getElementById("stage1Goals");
  container.innerHTML = "";
  GOALS.forEach((goal) => {
    const article = document.createElement("article");
    article.className = "accordion-card";
    article.innerHTML = `
      <button type="button" class="accordion-toggle">
        <span>Goal ${goal.id}: ${goal.title}</span>
      </button>
      <div class="accordion-content">
        <div class="accordion-inner">
          <img src="../Edited images/goal ${goal.id}.jpg" alt="Goal ${goal.id}">
          <div>
            <p>${goal.summary}</p>
            <h4>Main targets</h4>
            <ul class="stage-list">
              ${goal.targets.map((item) => `<li>${item}</li>`).join("")}
            </ul>
          </div>
        </div>
      </div>
    `;
    container.appendChild(article);
  });

  container.querySelectorAll(".accordion-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      button.parentElement.classList.toggle("open");
    });
  });
}

function renderThemeGrid() {
  const grid = document.getElementById("themeGrid");
  grid.innerHTML = THEMES.map((theme) => `
    <article>
      <h3>${theme.title}</h3>
      <p>${theme.text}</p>
      <strong>${theme.goals}</strong>
    </article>
  `).join("");
}

function renderGoalExplorer() {
  const container = document.getElementById("goalExplorer");
  container.innerHTML = GOALS.map((goal) => `
    <article class="goal-explorer-card">
      <img src="../Edited images/goal ${goal.id}.jpg" alt="Goal ${goal.id}">
      <h3>Goal ${goal.id}: ${goal.title}</h3>
      <p>${goal.summary}</p>
      <ul class="stage-list compact-list">
        ${goal.targets.map((item) => `<li>${item}</li>`).join("")}
      </ul>
    </article>
  `).join("");
}

function renderBarrierTable() {
  const tbody = document.getElementById("barrierTable");
  tbody.innerHTML = BARRIERS.map((row) => `
    <tr>
      <td>${row[0]}</td>
      <td>${row[1]}</td>
      <td>${row[2]}</td>
    </tr>
  `).join("");
}

function renderStage3Examples() {
  const container = document.getElementById("stage3Examples");
  container.innerHTML = STAGE3_EXAMPLES.map((example) => `
    <article>
      <h3>${example.title}</h3>
      <p>${example.text}</p>
    </article>
  `).join("");
}

function renderActionBoards() {
  const container = document.getElementById("actionBoards");
  container.innerHTML = GOALS.map((goal) => `
    <article class="action-board">
      <div class="action-board-top">
        <img src="../Edited images/goal ${goal.id}.jpg" alt="Goal ${goal.id}">
        <div>
          <h3>Goal ${goal.id}: ${goal.title}</h3>
          <p>${goal.summary}</p>
        </div>
      </div>
      <ol class="action-list">
        ${goal.actions.map((item) => `<li>${item}</li>`).join("")}
      </ol>
    </article>
  `).join("");
}

document.addEventListener("DOMContentLoaded", () => {
  renderStage1Goals();
  renderThemeGrid();
  renderGoalExplorer();
  renderBarrierTable();
  renderStage3Examples();
  renderActionBoards();

  for (let stage = 1; stage <= 4; stage += 1) {
    const unlocked = stage <= (learnProgress.unlockedStage || 1);
    setStageAvailability(stage, unlocked);
    if (learnProgress.completedStages.includes(stage)) {
      document.getElementById(`timer${stage}`).textContent = "00:00";
    }
  }

  if (learnProgress.completedStages.includes(4)) {
    document.getElementById("stage4Quiz").classList.remove("disabled-link");
    document.getElementById("stage4Challenge").classList.remove("disabled-link");
    document.getElementById("stage4Quiz").setAttribute("aria-disabled", "false");
    document.getElementById("stage4Challenge").setAttribute("aria-disabled", "false");
  }

  document.querySelectorAll(".stage-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const target = document.getElementById(button.dataset.target);
      const stageNumber = Number(button.closest(".stage-card").dataset.stage);
      target.classList.toggle("open");
      if (target.classList.contains("open")) {
        startStageTimer(stageNumber);
      }
    });
  });

  document.querySelectorAll(".exit-stage").forEach((button) => {
    button.addEventListener("click", () => {
      document.getElementById(button.dataset.target).classList.remove("open");
    });
  });

  document.querySelectorAll(".disabled-link").forEach((link) => {
    link.addEventListener("click", (event) => {
      if (link.getAttribute("aria-disabled") === "true") {
        event.preventDefault();
        window.SDGApp.showToast("Finish 1 minute 30 seconds in Stage 4 to unlock this button.");
      }
    });
  });
});
