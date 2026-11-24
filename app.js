const PROTECTED_NAMES = ["Andrea", "Elia"];

const state = {
  names: [],
  rotation: 0,
  spinning: false,
  paletteSeed: 0,
};

const wheel = document.getElementById("wheel");
const ctx = wheel.getContext("2d");
const spinBtn = document.getElementById("spinBtn");
const shuffleBtn = document.getElementById("shuffleBtn");
const addNameForm = document.getElementById("addNameForm");
const nameInput = document.getElementById("nameInput");
const nameList = document.getElementById("nameList");
const nameCount = document.getElementById("nameCount");
const resultText = document.getElementById("resultText");
const clearExtraBtn = document.getElementById("clearExtraBtn");

function normalizeName(value) {
  return value.trim().replace(/\s+/g, " ");
}

function isProtectedName(name) {
  return PROTECTED_NAMES.some((n) => n.toLowerCase() === name.toLowerCase());
}

function canonicalProtectedName(name) {
  const found = PROTECTED_NAMES.find((n) => n.toLowerCase() === name.toLowerCase());
  return found || name;
}

function buildInitialNames() {
  return [...PROTECTED_NAMES];
}

function colorForIndex(index) {
  const palette = [
    "#bc5b2e", "#2f6f68", "#d8a24a", "#4f6d7a", "#9b4d3a",
    "#6d8b74", "#b56576", "#8d6a2f", "#355f4a", "#a44f2f"
  ];
  return palette[(index + state.paletteSeed) % palette.length];
}

function resizeCanvasForDisplay() {
  const rect = wheel.getBoundingClientRect();
  const size = Math.floor(rect.width * window.devicePixelRatio);
  if (wheel.width !== size || wheel.height !== size) {
    wheel.width = size;
    wheel.height = size;
  }
}

function drawWheel() {
  resizeCanvasForDisplay();
  const size = wheel.width;
  const center = size / 2;
  const radius = center - size * 0.04;
  ctx.clearRect(0, 0, size, size);

  const names = state.names;
  const total = names.length;

  ctx.save();
  ctx.translate(center, center);
  ctx.rotate((state.rotation * Math.PI) / 180);

  if (total === 0) {
    ctx.restore();
    return;
  }

  const arc = (Math.PI * 2) / total;

  for (let i = 0; i < total; i++) {
    const start = i * arc;
    const end = start + arc;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = colorForIndex(i);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = Math.max(2, size * 0.003);
    ctx.stroke();

    ctx.save();
    ctx.rotate(start + arc / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "#fffaf2";
    ctx.font = `${Math.max(16, size * 0.045)}px Outfit, sans-serif`;
    ctx.shadowColor = "rgba(0,0,0,0.28)";
    ctx.shadowBlur = 4;
    const label = names[i].length > 16 ? names[i].slice(0, 15) + "…" : names[i];
    ctx.fillText(label, radius - size * 0.08, size * 0.015);
    ctx.restore();
  }

  ctx.restore();

  ctx.beginPath();
  ctx.arc(center, center, radius + size * 0.012, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(31,27,22,0.12)";
  ctx.lineWidth = Math.max(2, size * 0.01);
  ctx.stroke();
}

function renderList() {
  nameList.innerHTML = "";
  nameCount.textContent = String(state.names.length);

  state.names.forEach((name, index) => {
    const li = document.createElement("li");
    li.className = "name-item";

    const left = document.createElement("div");
    left.className = "name-left";

    const dot = document.createElement("span");
    dot.className = "name-dot";
    dot.style.background = colorForIndex(index);

    const text = document.createElement("span");
    text.className = "name-text";
    text.textContent = name;

    left.appendChild(dot);
    left.appendChild(text);

    if (isProtectedName(name)) {
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = "Sempre in ruota";
      left.appendChild(tag);
    }

    const btn = document.createElement("button");
    btn.className = "remove-btn";
    btn.type = "button";
    btn.textContent = "Rimuovi";

    if (isProtectedName(name)) {
      btn.disabled = true;
      btn.title = "Andrea ed Elia non possono essere rimossi";
    } else {
      btn.addEventListener("click", () => removeName(name));
    }

    li.appendChild(left);
    li.appendChild(btn);
    nameList.appendChild(li);
  });

  const extraCount = state.names.filter((n) => !isProtectedName(n)).length;
  clearExtraBtn.disabled = extraCount === 0 || state.spinning;
  spinBtn.disabled = state.spinning || state.names.length < 2;
}

function addName(rawName) {
  const clean = normalizeName(rawName);
  if (!clean) return;

  const protectedMatch = PROTECTED_NAMES.find((n) => n.toLowerCase() === clean.toLowerCase());
  const finalName = protectedMatch || clean;

  if (state.names.some((n) => n.toLowerCase() === finalName.toLowerCase())) {
    resultText.textContent = `"${finalName}" è già nella lista.`;
    return;
  }

  state.names.push(finalName);
  resultText.textContent = `"${finalName}" aggiunto alla ruota.`;
  renderList();
  drawWheel();
}

function removeName(name) {
  if (isProtectedName(name)) {
    resultText.textContent = "Andrea ed Elia non possono essere rimossi.";
    return;
  }

  const nextNames = state.names.filter((n) => n !== name);
  const hasAndrea = nextNames.some((n) => n.toLowerCase() === "andrea");
  const hasElia = nextNames.some((n) => n.toLowerCase() === "elia");

  if (!hasAndrea || !hasElia) {
    resultText.textContent = "Non puoi rimuovere nomi finché resterebbe solo Andrea o solo Elia.";
    return;
  }

  if (nextNames.length < 2) {
    resultText.textContent = "La ruota deve avere almeno 2 nomi.";
    return;
  }

  state.names = nextNames;
  resultText.textContent = `"${name}" rimosso dalla ruota.`;
  renderList();
  drawWheel();
}

function clearExtras() {
  state.names = buildInitialNames();
  resultText.textContent = "Rimossi tutti i nomi extra. Restano Andrea ed Elia.";
  renderList();
  drawWheel();
}

function pickWinnerByRotation(finalRotation) {
  const total = state.names.length;
  const arcDeg = 360 / total;
  const normalized = (360 - (finalRotation % 360)) % 360;
  const index = Math.floor(normalized / arcDeg) % total;
  return state.names[index];
}

function spinWheel() {
  if (state.spinning) return;

  if (state.names.length < 2) {
    resultText.textContent = "Servono almeno 2 nomi per girare la ruota.";
    return;
  }

  const hasAndrea = state.names.some((n) => n.toLowerCase() === "andrea");
  const hasElia = state.names.some((n) => n.toLowerCase() === "elia");
  if (!hasAndrea || !hasElia) {
    resultText.textContent = "Errore: Andrea ed Elia devono essere sempre presenti.";
    return;
  }

  state.spinning = true;
  renderList();

  const spinDegrees = 360 * (5 + Math.floor(Math.random() * 4)) + Math.floor(Math.random() * 360);
  const startRotation = state.rotation;
  const endRotation = startRotation + spinDegrees;
  const duration = 4200;
  const startTime = performance.now();

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function animate(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(progress);
    state.rotation = startRotation + (endRotation - startRotation) * eased;
    drawWheel();

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      state.rotation = endRotation % 360;
      state.spinning = false;
      const winner = pickWinnerByRotation(state.rotation);
      resultText.textContent = `Vincitore: ${winner}`;
      renderList();
      drawWheel();
    }
  }

  resultText.textContent = "La ruota sta girando...";
  requestAnimationFrame(animate);
}

addNameForm.addEventListener("submit", (e) => {
  e.preventDefault();
  addName(nameInput.value);
  nameInput.value = "";
  nameInput.focus();
});

spinBtn.addEventListener("click", spinWheel);
shuffleBtn.addEventListener("click", () => {
  state.paletteSeed += 3;
  drawWheel();
});
clearExtraBtn.addEventListener("click", clearExtras);

window.addEventListener("resize", () => {
  drawWheel();
});

state.names = buildInitialNames();
renderList();
drawWheel();