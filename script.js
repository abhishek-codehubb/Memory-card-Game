const IMG_EMOJI = [
  "🐶",
  "🐱",
  "🦊",
  "🐻",
  "🐼",
  "🦁",
  "🐵",
  "🐨",
  "🐯",
  "🐸",
  "🐙",
  "🦄",
  "🐝",
  "🦋",
  "🐴",
  "🐷",
  "🐮",
  "🐔",
  "🦖",
  "🐬",
  "🦀",
  "🐢",
  "🦅",
  "🦉",
  "🐧",
  "🦇",
  "🦑",
  "🦧",
  "🦩",
  "🐞",
  "🕷️",
  "🌵",
  "🌸",
  "🍎",
  "🍓",
  "🍇",
  "🍉",
];

function svgDataForEmoji(emoji, colorBack = "#0b1220") {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='512' height='512'><rect width='100%' height='100%' rx='32' fill='${colorBack}'/><text x='50%' y='54%' font-size='260' text-anchor='middle' dominant-baseline='middle'>${emoji}</text></svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}
const IMAGES = IMG_EMOJI.map((e) => svgDataForEmoji(e));

let level = "medium",
  rows = 6,
  cols = 6,
  pairCount = 18;
let deck = [],
  firstCard = null,
  secondCard = null,
  lock = false;
let moves = 0,
  matches = 0,
  seconds = 0,
  timerInt = null;

const board = document.getElementById("board");
const levelSelect = document.getElementById("levelSelect");
const newBtn = document.getElementById("newBtn");
const timeEl = document.getElementById("time");
const movesEl = document.getElementById("moves");
const matchesEl = document.getElementById("matches");
const progressEl = document.getElementById("progress");
const hintBtn = document.getElementById("hintBtn");
const previewBtn = document.getElementById("previewBtn");
const winModal = document.getElementById("winModal");
const finalTime = document.getElementById("finalTime");
const finalMoves = document.getElementById("finalMoves");
const playAgain = document.getElementById("playAgain");
const closeWin = document.getElementById("closeWin");
const leaderList = document.getElementById("leaderList");
const clearScores = document.getElementById("clearScores");
const themeSelect = document.getElementById("themeSelect");

function beep(freq = 440, d = 0.04) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    g.gain.value = 0.035;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + d);
    setTimeout(() => {
      o.stop();
      ctx.close();
    }, d * 1000 + 60);
  } catch (e) {}
}

function configureLevel(l) {
  level = l;
  if (l === "easy") {
    rows = 4;
    cols = 4;
    pairCount = 8;
    board.className = "board easy";
  } else if (l === "medium") {
    rows = 6;
    cols = 6;
    pairCount = 18;
    board.className = "board medium";
  } else {
    rows = 8;
    cols = 8;
    pairCount = 32;
    board.className = "board hard";
  }
}

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function buildDeck() {
  const pool = shuffle(IMAGES.slice());
  const pick = pool.slice(0, pairCount);
  const arr = [];
  pick.forEach((img) => {
    arr.push({ id: uid(), v: img });
    arr.push({ id: uid(), v: img });
  });
  return shuffle(arr);
}

function renderBoard() {
  board.innerHTML = "";
  deck.forEach((cardData) => {
    const card = document.createElement("div");
    card.className = "card";
    card.tabIndex = 0;
    card.setAttribute("data-id", cardData.id);
    card.innerHTML = `
      <div class="card-inner">
        <div class="face back"></div>
        <div class="face front"><img src="${cardData.v}" alt="card image"></div>
      </div>`;
    board.appendChild(card);
    card.addEventListener("click", () => tryFlip(card));
    card.addEventListener("keydown", (e) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        tryFlip(card);
      }
    });
  });
  updateStats();
}

function resetSelection() {
  firstCard = null;
  secondCard = null;
  lock = false;
}

function tryFlip(card) {
  if (lock) return;
  if (card.classList.contains("flipped") || card.classList.contains("matched"))
    return;
  if (!timerInt) startTimer();
  card.classList.add("flipped");
  beep(660, 0.03);
  if (!firstCard) {
    firstCard = card;
    return;
  }
  secondCard = card;
  lock = true;
  moves++;
  movesEl.textContent = moves;
  const id1 = firstCard.dataset.id,
    id2 = secondCard.dataset.id;
  const v1 = deck.find((d) => d.id === id1).v,
    v2 = deck.find((d) => d.id === id2).v;
  if (v1 === v2) {
    setTimeout(() => {
      firstCard.classList.add("matched");
      secondCard.classList.add("matched");
      matches++;
      beep(880, 0.07);
      updateStats();
      resetSelection();
      if (matches === pairCount) onWin();
    }, 420);
  } else {
    setTimeout(() => {
      firstCard.classList.remove("flipped");
      secondCard.classList.remove("flipped");
      beep(220, 0.04);
      resetSelection();
    }, 700);
  }
}

function updateStats() {
  movesEl.textContent = moves;
  matchesEl.textContent = `${matches} / ${pairCount}`;
  const pct = Math.round((matches / pairCount) * 100);
  progressEl.style.width = pct + "%";
}

function startTimer() {
  if (timerInt) return;
  timerInt = setInterval(() => {
    seconds++;
    timeEl.textContent = formatTime(seconds);
  }, 1000);
}
function stopTimer() {
  clearInterval(timerInt);
  timerInt = null;
}
function resetTimer() {
  stopTimer();
  seconds = 0;
  timeEl.textContent = "00:00";
}
function formatTime(s) {
  const m = Math.floor(s / 60)
    .toString()
    .padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

function onWin() {
  stopTimer();
  finalTime.textContent = formatTime(seconds);
  finalMoves.textContent = moves;
  winModal.style.display = "flex";
  saveBest();
  launchConfetti();
}

function newGame() {
  configureLevel(levelSelect.value);
  deck = buildDeck();
  firstCard = secondCard = null;
  lock = false;
  moves = 0;
  matches = 0;
  resetTimer();
  renderBoard();
  renderLeaderboard();
}

levelSelect.addEventListener("change", () => newGame());
newBtn.addEventListener("click", () => newGame());

hintBtn.addEventListener("click", () => {
  const unmatched = Array.from(
    document.querySelectorAll(".card:not(.matched):not(.flipped)")
  );
  if (unmatched.length < 2) return;
  const sel = shuffle(unmatched).slice(0, 2);
  sel.forEach((c) => c.classList.add("flipped"));
  lock = true;
  setTimeout(() => {
    sel.forEach((c) => c.classList.remove("flipped"));
    lock = false;
  }, 900);
});
previewBtn.addEventListener("click", () => {
  const all = Array.from(document.querySelectorAll(".card:not(.matched)"));
  all.forEach((c) => c.classList.add("flipped"));
  lock = true;
  setTimeout(() => {
    all.forEach((c) => c.classList.remove("flipped"));
    lock = false;
  }, Math.max(900, pairCount * 40));
});

document.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "r") {
    shuffleBoard();
  }
});

function shuffleBoard() {
  deck = shuffle(deck);
  renderBoard();
  showToast("Shuffled");
}

const LB_KEY = "mm.pro.leader.v1";
function getBest() {
  try {
    return JSON.parse(localStorage.getItem(LB_KEY) || "{}");
  } catch (e) {
    return {};
  }
}
function saveBest() {
  const b = getBest();
  const key = level;
  const record = { time: seconds, moves };
  if (
    !b[key] ||
    seconds < b[key].time ||
    (seconds === b[key].time && moves < b[key].moves)
  ) {
    b[key] = record;
    localStorage.setItem(LB_KEY, JSON.stringify(b));
  }
  renderLeaderboard();
}

function renderLeaderboard() {
  const b = getBest();
  leaderList.innerHTML = "";
  ["easy", "medium"].forEach((lvl) => {
    const li = document.createElement("li");
    if (b[lvl]) {
      li.textContent = `${lvl.toUpperCase()} — ${formatTime(b[lvl].time)} | ${
        b[lvl].moves
      } moves`;
    } else {
      li.textContent = `${lvl.toUpperCase()} — No record yet`;
    }
    leaderList.appendChild(li);
  });
}

clearScores.addEventListener("click", () => {
  if (confirm("Clear all saved best scores?")) {
    localStorage.removeItem(LB_KEY);
    renderLeaderboard();
  }
});

playAgain.addEventListener("click", () => {
  winModal.style.display = "none";
  newGame();
});

closeWin.addEventListener("click", () => {
  winModal.style.display = "none";
});

function launchConfetti() {
  const duration = 1200;
  const end = Date.now() + duration;
  (function frame() {
    const timeLeft = end - Date.now();
    if (timeLeft <= 0) return;
    const conf = document.createElement("div");
    conf.className = "confetti";
    conf.style.left = Math.random() * 100 + "%";
    conf.style.background = `hsl(${Math.random() * 360},100%,60%)`;
    document.body.appendChild(conf);
    setTimeout(() => conf.remove(), 1000);
    requestAnimationFrame(frame);
  })();
}

function showToast(msg) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 1200);
}

// initialize
newGame();
