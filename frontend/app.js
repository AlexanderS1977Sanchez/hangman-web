const API_BASE = "";

let gameId = null;
let lastState = null;

const maskedWordEl = document.getElementById("maskedWord");
const remainingEl = document.getElementById("remaining");
const statusEl = document.getElementById("status");
const wrongLettersEl = document.getElementById("wrongLetters");
const keyboardEl = document.getElementById("keyboard");
const letterInputEl = document.getElementById("letterInput");
const messageEl = document.getElementById("message");
const answerEl = document.getElementById("answer");

const newGameBtn = document.getElementById("newGameBtn");
const guessBtn = document.getElementById("guessBtn");

const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");

function setMessage(text) {
  messageEl.textContent = text || "";
}

function setAnswer(text) {
  answerEl.textContent = text || "";
}

function statusLabel(s) {
  if (s === "playing") return "Playing";
  if (s === "won") return "You won";
  if (s === "lost") return "You lost";
  return "-";
}

function spacedMasked(masked) {
  return masked.split("").join(" ");
}

function renderWrongLetters(wrongLetters) {
  wrongLettersEl.innerHTML = "";
  if (!wrongLetters || wrongLetters.length === 0) return;
  wrongLetters.forEach((l) => {
    const chip = document.createElement("span");
    chip.className = "chip danger";
    chip.textContent = l.toUpperCase();
    wrongLettersEl.appendChild(chip);
  });
}

function renderKeyboard(state) {
  keyboardEl.innerHTML = "";
  alphabet.forEach((l) => {
    const btn = document.createElement("button");
    btn.className = "key";
    btn.type = "button";
    btn.textContent = l.toUpperCase();

    const guessed = state.guessedLetters || [];
    const wrong = state.wrongLetters || [];

    if (guessed.includes(l)) btn.classList.add("correct");
    if (wrong.includes(l)) btn.classList.add("wrong");

    const disabled = state.status !== "playing" || guessed.includes(l) || wrong.includes(l);
    btn.disabled = disabled;

    btn.addEventListener("click", () => guessLetter(l));
    keyboardEl.appendChild(btn);
  });
}

function renderState(state) {
  lastState = state;
  maskedWordEl.textContent = spacedMasked(state.maskedWord || "");
  remainingEl.textContent = String(state.remaining ?? "-");
  statusEl.textContent = statusLabel(state.status);
  renderWrongLetters(state.wrongLetters || []);
  renderKeyboard(state);

  const playing = state.status === "playing";
  guessBtn.disabled = !playing;
  letterInputEl.disabled = !playing;

  if (state.status === "won") setMessage("Nice! Start a new game or play again.");
  if (state.status === "lost") setMessage("Try again. Start a new game.");
  if (state.status === "playing") setMessage("Type a letter or use the keyboard.");

  if (state.answer) setAnswer(`Answer: ${state.answer.toUpperCase()}`);
  else setAnswer("");
}

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

async function startNewGame() {
  setMessage("Creating a new game...");
  setAnswer("");
  try {
    const state = await api("/api/new", {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    gameId = state.id;
    renderState(state);
    letterInputEl.value = "";
    letterInputEl.focus();
  } catch (e) {
    setMessage(e.message);
  }
}

async function guessLetter(letter) {
  if (!gameId) return;
  const l = String(letter || "").toLowerCase().trim();
  if (!/^[a-z]$/.test(l)) {
    setMessage("Please enter a single letter (A-Z).");
    return;
  }

  try {
    const state = await api("/api/guess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId, letter: l })
    });
    renderState(state);
  } catch (e) {
    setMessage(e.message);
  } finally {
    letterInputEl.value = "";
    letterInputEl.focus();
  }
}

newGameBtn.addEventListener("click", startNewGame);

guessBtn.addEventListener("click", () => {
  guessLetter(letterInputEl.value);
});

letterInputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") guessLetter(letterInputEl.value);
});

window.addEventListener("load", startNewGame);