/* =========================================================
   Climate Learn — Interactivity
   - Stage gating with 60s countdown
   - Auto dropdown on hover/touch
   - Dynamic content for goals, causes, actions
   ========================================================= */

// ---------- Helpers ----------
const qs  = (s,el=document)=>el.querySelector(s);
const qsa = (s,el=document)=>[...el.querySelectorAll(s)];
const clamp = (n,min,max)=>Math.min(Math.max(n,min),max);

// ---------- Stage / Timer ----------
const stages = qsa('.stage');
const nextBtn = qs('#nextStage');
const prevBtn = qs('#prevStage');
const stageNumberEl = qs('#stageNumber');
const ring = qs('#ring');
const timerEl = qs('#timer');

let currentStage = 1;
let countdown = null;
let timeLeft = 60; // seconds per stage
const unlocked = new Set([1]); // start with stage 1 unlocked

function formatTime(s){
  const m = Math.floor(s/60);
  const sec = s%60;
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

function setRing(percent){
  const deg = 360*percent;
  ring.style.background = `conic-gradient(var(--ocean) ${deg}deg, var(--sun) ${deg}deg 360deg, #e8eef2 0deg)`;
}

function startTimer(){
  clearInterval(countdown);
  timeLeft = 60;
  timerEl.textContent = formatTime(timeLeft);
  setRing(1); // full ring at start

  countdown = setInterval(()=>{
    timeLeft--;
    timerEl.textContent = formatTime(timeLeft);
    setRing(timeLeft/60);
    if(timeLeft<=0){
      clearInterval(countdown);
      unlockNext();
      fireConfetti();
    }
  },1000);
}

function unlockNext(){
  unlocked.add(currentStage+1);
  nextBtn.disabled = currentStage>=4; // no next on stage 4
}

function goStage(n, fromClick=false){
  n = clamp(n,1,4);
  const target = qs(`.stage[data-stage="${n}"]`);
  if(!unlocked.has(n) && fromClick){
    // Prevent jumping to locked stage via menu
    return;
  }
  stages.forEach(s=>s.classList.remove('active'));
  target.classList.add('active');
  currentStage = n;
  stageNumberEl.textContent = n;

  prevBtn.disabled = (n===1);
  nextBtn.disabled = !unlocked.has(n+1) && (n<4);

  // aria & focus
  stages.forEach(s=>{
    s.setAttribute('aria-disabled', String(!s.classList.contains('active')));
  });
  target.focus({preventScroll:true});
  // Restart timer for this stage if not last
  if(n<=4){ startTimer(); }
}

prevBtn.addEventListener('click', ()=> goStage(currentStage-1, true));
nextBtn.addEventListener('click', ()=> goStage(currentStage+1, true));

// ---------- Menu: auto dropdown + touch toggle ----------
const hasChildren = qs('.menu__item--has-children');
const trigger = qs('.menu__trigger');
trigger.addEventListener('click', (e)=>{
  // On touch devices, toggle menu; on desktop, it already opens on hover
  hasChildren.classList.toggle('open');
  const expanded = trigger.getAttribute('aria-expanded') === 'true';
  trigger.setAttribute('aria-expanded', String(!expanded));
});

qsa('.submenu a').forEach(a=>{
  a.addEventListener('click', (e)=>{
    const stage = Number(a.dataset.stage || '1');
    goStage(stage, true);
    hasChildren.classList.remove('open');
    trigger.setAttribute('aria-expanded','false');
  });
});

// ---------- Stage 1 content ----------
const s1Milestones = [
  "1992 – UN Framework Convention on Climate Change (UNFCCC) adopted at the Rio Earth Summit.",
  "1997 – Kyoto Protocol introduces binding emission targets for some countries.",
  "2007 – IPCC wins Nobel Peace Prize with Al Gore for climate awareness.",
  "2015 – Paris Agreement: hold warming well below 2°C and pursue 1.5°C.",
  "2018–2023 – IPCC Special Reports & AR6 clarify urgency and pathways.",
  "Ongoing – Nationally Determined Contributions (NDCs) and global stocktakes."
];
const s1List = qs('#s1Milestones');
s1Milestones.forEach(item=>{
  const li = document.createElement('li');
  li.textContent = item;
  s1List.appendChild(li);
});

// ---------- Stage 2: Goal 13 detail ----------
const goalsGrid = qs('#goalsGrid');
const goalColors = [
  "#3f7e44","#0a97d9",
  "#56c02b","#00689d","#19486a"
];
const goalNames = [
  
  "Climate Action",
];
goalNames.forEach((name, i)=>{
  const card = document.createElement('button');
  card.className = 'goal';
  card.setAttribute('type','button');
  card.setAttribute('data-goal', String(i+1));
  card.innerHTML = `
    <div class="goal__icon" style="background:${goalColors[i]}">${i+1}</div>
    <div>
      <strong>Goal ${i+1}</strong><br>${name}
    </div>
  `;
  goalsGrid.appendChild(card);
});

const goalDetail = qs('#goalDetail');

const goal13Lines = [
  "Strengthen resilience and adaptive capacity to climate-related hazards.",
  "Integrate climate measures into national policies, strategies, and planning.",
  "Improve education and awareness on climate mitigation and adaptation.",
  "Mobilize climate finance to support low-carbon and resilient development.",
  "Enhance early warning systems and disaster risk reduction.",
  "Support vulnerable regions, including SIDS and LDCs.",
  "Promote nature-based solutions (forests, wetlands, mangroves).",
  "Accelerate clean energy transitions and efficiency.",
  "Reduce greenhouse gas emissions across sectors.",
  "Encourage climate-smart agriculture and circular economy.",
  "Foster youth participation and local climate leadership.",
  "Build partnerships among government, business, and civil society.",
  "Advance data, innovation, and green jobs."
];

const goal13Targets = [
  "Resilience to climate hazards",
  "Policy integration of climate action",
  "Education and capacity building",
  "Commitments under UNFCCC",
  "Adaptation planning and implementation",
  "Early warning systems expansion",
  "Climate finance mobilization",
  "Technology transfer and innovation",
  "Participation and inclusive decision-making",
  "Support for most vulnerable regions"
];

const goal13Actions = [
  "Adopt and implement NDCs aligned with 1.5°C.",
  "Invest in renewables, storage, and smart grids.",
  "Phase down coal and cut methane leakage.",
  "Scale up EVs and mass transit; active mobility.",
  "Protect and restore forests and blue carbon.",
  "Climate-proof infrastructure (heat, flood, wind).",
  "Support farmers with climate-smart practices.",
  "Improve building efficiency and green cooling.",
  "Reduce waste; expand recycling and composting.",
  "Educate, engage, and fund local climate initiatives."
];

const goal13Events = [
  "Earth Hour (March)",
  "World Environment Day (June 5)",
  "UNFCCC COP (annual)",
  "Climate Week NYC (September)",
  "International Day of Clean Energy (Jan 26)"
];

function renderGoalDetail(goalNumber){
  if(goalNumber!==13){
    goalDetail.innerHTML = `
      <h3 class="card__title">Goal ${goalNumber} • ${goalNames[goalNumber-1]}</h3>
      <p>Template ready. Add 12–15 knowledge lines, 10 targets, and 10 actions for this goal here.</p>
      <div class="chips"><span class="chip">Targets: 10</span><span class="chip">Actions: 10</span></div>
    `;
    return;
  }
  goalDetail.innerHTML = `
    <h3 class="card__title">Goal 13 • Climate Action</h3>
    <p><strong>Knowledge (12–15 lines)</strong></p>
    <ul class="tight-list">
      ${goal13Lines.map(l=>`<li>${l}</li>`).join('')}
    </ul>

    <p style="margin-top:.8rem"><strong>Targets (10)</strong></p>
    <ul class="tight-list">
      ${goal13Targets.map(t=>`<li>${t}</li>`).join('')}
    </ul>

    <p style="margin-top:.8rem"><strong>Actions (10)</strong></p>
    <ul class="tight-list">
      ${goal13Actions.map(a=>`<li>${a}</li>`).join('')}
    </ul>

    <div class="chips" aria-label="Events">
      ${goal13Events.map(e=>`<span class="chip">${e}</span>`).join('')}
    </div>
  `;
}

goalsGrid.addEventListener('click', (e)=>{
  const btn = e.target.closest('.goal');
  if(!btn) return;
  const n = Number(btn.dataset.goal);
  renderGoalDetail(n);
  // Smooth scroll to detail
  goalDetail.scrollIntoView({behavior:'smooth', block:'start'});
});

// Default show Goal 13
renderGoalDetail(13);

// ---------- Stage 3: Causes table (15 + 15) ----------
const manmade = [
  "Fossil fuel combustion (power, industry, transport)",
  "Deforestation and land-use change",
  "Industrial process emissions (cement, chemicals)",
  "Agricultural methane (livestock, rice paddies)",
  "Waste methane (landfills, wastewater)",
  "Nitrous oxide from fertilizers",
  "Black carbon and aerosols from incomplete combustion",
  "Urban heat island amplification",
  "High-GWP refrigerants (HFCs)",
  "Shipping and aviation emissions",
  "Overconsumption and linear ‘take-make-waste’ economy",
  "Inefficient buildings and appliances",
  "Unsustainable mining and resource extraction",
  "Soil degradation and peatland drainage",
  "Wildfire ignition from human activity"
];
const natural = [
  "Volcanic eruptions (short-term cooling aerosols)",
  "Solar variability (small irradiance changes)",
  "El Niño/La Niña oscillations",
  "Natural methane from wetlands",
  "Ocean-atmosphere heat exchange",
  "Permafrost feedbacks releasing GHGs",
  "Desert dust and biogenic aerosols",
  "Natural wildfire cycles (lightning)",
  "Vegetation dynamics and succession",
  "Ocean circulation shifts (AMOC variability)",
  "Cloud formation variability",
  "Ice-albedo feedbacks",
  "Long-term orbital cycles (Milankovitch)",
  "Hydrological cycle variability",
  "Natural carbon sink fluctuations"
];
const tbody = qs('#causesBody');
for(let i=0; i<15; i++){
  const tr = document.createElement('tr');
  tr.innerHTML = `<td>${manmade[i]}</td><td>${natural[i]}</td>`;
  tbody.appendChild(tr);
}

// ---------- Stage 4: 25 personal actions ----------
const actions = [
  "Switch to LEDs and efficient appliances.",
  "Limit AC temp, use fans, improve shading.",
  "Walk, cycle, bus, or car-share where possible.",
  "Consider EVs or hybrid, maintain tire pressure.",
  "Reduce meat intake; try plant-rich meals weekly.",
  "Buy local/seasonal; cut food waste at home.",
  "Repair, reuse, and thrift before buying new.",
  "Recycle properly; compost organic waste.",
  "Install rooftop solar or join a community solar plan.",
  "Use smart power strips; unplug idle chargers.",
  "Collect rainwater; fix leaks; low-flow fixtures.",
  "Plant native trees and protect green spaces.",
  "Join neighborhood cleanup and tree-planting.",
  "Advocate for bike lanes and safe transit.",
  "Support renewable energy providers/policies.",
  "Choose green banking/investments where possible.",
  "Learn disaster readiness; prepare a go-bag.",
  "Support climate education at your school/work.",
  "Volunteer with local NGOs focused on climate.",
  "Measure your footprint; set yearly reduction goals.",
  "Buy durable, repairable products with warranties.",
  "Air-dry clothes when feasible.",
  "Prefer virtual meetings to reduce travel emissions.",
  "Speak up: write to leaders; attend town halls.",
  "Celebrate climate events; invite friends to join.",
 "Switch to renewable energy at home",
 "Use public transport instead of driving",
 "Plant trees in your community",
 "Recycle and compost household waste",
 "Buy locally-produced food",
 "Reduce single-use plastics",
 "Use energy-efficient appliances",
 "Turn off lights when not in use",
 "Harvest rainwater",
 "Support climate-friendly policies",
 "Educate others about climate change",
 "Install solar panels if possible",
 "Eat more plant-based meals",
 "Avoid fast fashion, buy durable clothes",
 "Volunteer for environmental NGOs",
 "Conserve water (shorter showers)",
 "Share rides / carpool",
 "Reduce air travel when possible",
 "Insulate your home",
 "Support companies with green practices",
 "Donate to reforestation projects",
 "Join climate strikes / advocacy",
 "Buy second-hand instead of new",
 "Repair before replacing items",
    "Switch to renewable energy sources",
    "Plant more trees",
    "Reduce meat consumption",
    "Use public transport",
    "Recycle waste",
    "Support climate policies",
    "Educate others about climate change",
    "Save electricity",
    "Install solar panels",
    "Harvest rainwater",
    "Avoid plastic bags",
    "Buy second-hand clothes",
    "Support reforestation projects",
    "Compost organic waste",
    "Turn off unused appliances",
    "Use energy-efficient bulbs",
    "Donate to climate NGOs",
    "Join climate protests",
    "Carpool with friends",
    "Avoid food waste",
    "Support clean energy companies",
    "Share climate facts online",
    "Collect waste in community drives",
    "Protect wetlands",
    "Support eco-friendly brands"
];
const actionsList = qs('#personalActions');
actions.forEach(a=>{
  const li = document.createElement('li');
  li.textContent = a;
  actionsList.appendChild(li);
});

// Expandable drawer
qs('#showMore').addEventListener('click', ()=>{
  const drawer = qs('#moreDrawer');
  if (!drawer) {
    alert("All 25 actions are already visible.");
    return;
  }
  const hidden = drawer.hasAttribute('hidden');
  if(hidden) drawer.removeAttribute('hidden'); else drawer.setAttribute('hidden','');
});

// ---------- Nav link shortcuts inside page ----------
qsa('a[href^="#stage"]').forEach(link=>{
  link.addEventListener('click', e=>{
    e.preventDefault();
    const toStage = Number(link.getAttribute('href').replace('#stage',''));
    goStage(toStage, true);
  });
});

// ---------- Start ----------
goStage(1);

// ---------- Confetti (minimal, CSS-free) ----------
function fireConfetti(){
  const burst = document.createElement('div');
  burst.style.position='fixed';
  burst.style.inset='0';
  burst.style.pointerEvents='none';
  burst.style.zIndex='9999';
  burst.innerHTML = `<svg width="0" height="0" style="position:absolute"></svg>`;
  document.body.appendChild(burst);

  const colors = ['#2e7d32','#0277bd','#fbc02d','#6d4c41','#00897b'];
  for(let i=0;i<80;i++){
    const s = document.createElement('span');
    s.style.position='absolute';
    s.style.left = Math.random()*100 + 'vw';
    s.style.top = '-10vh';
    s.style.width = s.style.height = (6+Math.random()*6)+'px';
    s.style.background = colors[i%colors.length];
    s.style.transform = `rotate(${Math.random()*360}deg)`;
    s.style.borderRadius = '2px';
    s.style.opacity = .9;
    s.style.transition = 'transform .8s ease-out, top 1.2s ease-in, opacity .9s ease';
    burst.appendChild(s);
    requestAnimationFrame(()=>{
      s.style.top = (90 + Math.random()*10)+'vh';
      s.style.transform = `translateX(${(-50+Math.random()*100)}px) rotate(${720+Math.random()*360}deg)`;
      s.style.opacity = .0;
    });
  }
  setTimeout(()=> burst.remove(), 1300);
}
  const list = null;
  actions.forEach(a => {
    const li = document.createElement("li");
    li.textContent = a;
    list?.appendChild(li);
  });

  document.getElementById("showMore").addEventListener("click", () => {
    alert("All 25 actions are already visible 🌍✅");
  });

// === Theme Toggle ===
const themeBtn = document.getElementById("themeToggle");
themeBtn?.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  themeBtn.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
});

// === Feedback ===
function closeFeedback() {
  document.getElementById("feedbackPopup").classList.add("hidden");
}
document.getElementById("feedbackBtn")?.addEventListener("click", () => {
  document.getElementById("feedbackPopup").classList.remove("hidden");
});
document.getElementById("feedbackForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("fbName").value;
  const email = document.getElementById("fbEmail").value;
  const country = document.getElementById("fbCountry").value;
  const msg = document.getElementById("fbMsg").value;
  window.location.href =
    `mailto:asogwaprecious27@gmail.com?subject=Feedback from ${name}&body=Name: ${name}%0AEmail: ${email}%0ACountry: ${country}%0AMessage: ${msg}`;
  closeFeedback();
});

  const modal = document.createElement('div');
  modal.style.position='fixed'; modal.style.left=0; modal.style.top=0; modal.style.width='100%'; modal.style.height='100%';
  modal.style.background='rgba(0,0,0,0.5)'; modal.style.display='none'; modal.style.alignItems='center'; modal.style.justifyContent='center'; modal.style.zIndex=1100;

  modal.innerHTML = `<div style="background:#fff;padding:20px;border-radius:12px;max-width:500px;width:90%">
    <h3>Feedback</h3>
    <input id="fbName" placeholder="Your name" style="width:100%;padding:8px;margin-bottom:8px"/>
    <input id="fbCountry" placeholder="Country" style="width:100%;padding:8px;margin-bottom:8px"/>
    <textarea id="fbMsg" placeholder="Your suggestion..." style="width:100%;padding:8px;height:100px"></textarea>
    <div style="text-align:right;margin-top:10px">
      <button id="fbCancel">Cancel</button>
      <button id="fbSend" style="background:#2f855a;color:#fff;padding:8px 12px;border:none;border-radius:6px">Send</button>
    </div>
  </div>`;

  document.body.appendChild(modal);

  document.getElementById("feedbackBtn")?.addEventListener('click', ()=> modal.style.display='flex');
  modal.querySelector('#fbCancel').addEventListener('click', ()=> modal.style.display='none');

  modal.querySelector('#fbSend').addEventListener('click', ()=>{
    const name = document.getElementById('fbName').value.trim();
    const country = document.getElementById('fbCountry').value.trim();
    const msg = document.getElementById('fbMsg').value.trim();
    if(!msg){ alert('Please type feedback'); return; }

    // Save locally
    const feedbacks = JSON.parse(localStorage.getItem('feedbacks')||'[]');
    feedbacks.push({ name, country, msg, ts: new Date().toISOString() });
    localStorage.setItem('feedbacks', JSON.stringify(feedbacks));

    // Open email client with prefilled content (mailto)
    const to = encodeURIComponent('asogwaprecious27@gmail.com');
    const subject = encodeURIComponent('CLIMATE Website Feedback from ' + (name||'Anonymous'));
    const body = encodeURIComponent(`Name: ${name}\nCountry: ${country}\n\nMessage:\n${msg}\n\n(Submitted via website)`);
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;

    modal.style.display='none';
    alert('Thank you — feedback saved and email draft opened.');
  });
