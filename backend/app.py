from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import os
import random
import string
import uuid
from dataclasses import dataclass

MAX_WRONG = 6

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
WORDS_PATH = os.path.join(os.path.dirname(__file__), "words.txt")

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path="")
CORS(app)

def load_words():
    if os.path.exists(WORDS_PATH):
        with open(WORDS_PATH, "r", encoding="utf-8") as f:
            words = [w.strip().lower() for w in f.readlines() if w.strip()]
            words = [w for w in words if all(c in string.ascii_lowercase for c in w)]
            if words:
                return words
    return ["python", "hangman", "frontend", "backend", "developer", "computer"]

WORDS = load_words()

@dataclass
class Game:
    id: str
    word: str
    guessed: set
    wrong: set
    status: str

    def masked(self):
        return "".join([c if c in self.guessed else "_" for c in self.word])

    def remaining(self):
        return MAX_WRONG - len(self.wrong)

    def to_public(self):
        return {
            "id": self.id,
            "maskedWord": self.masked(),
            "wrongLetters": sorted(list(self.wrong)),
            "guessedLetters": sorted(list(self.guessed)),
            "remaining": self.remaining(),
            "maxWrong": MAX_WRONG,
            "status": self.status
        }

games = {}

def new_game():
    gid = str(uuid.uuid4())
    word = random.choice(WORDS)
    g = Game(id=gid, word=word, guessed=set(), wrong=set(), status="playing")
    games[gid] = g
    return g

def normalize_letter(value):
    if not isinstance(value, str):
        return None
    v = value.strip().lower()
    if len(v) != 1:
        return None
    if v not in string.ascii_lowercase:
        return None
    return v

def update_status(g):
    if g.status != "playing":
        return
    if all(c in g.guessed for c in g.word):
        g.status = "won"
        return
    if len(g.wrong) >= MAX_WRONG:
        g.status = "lost"

@app.get("/")
def serve_frontend():
    return send_from_directory(app.static_folder, "index.html")

@app.get("/<path:path>")
def serve_static(path):
    file_path = os.path.join(app.static_folder, path)
    if os.path.isfile(file_path):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, "index.html")

@app.get("/api/health")
def health():
    return jsonify({"ok": True})

@app.post("/api/new")
def api_new():
    g = new_game()
    return jsonify(g.to_public())

@app.get("/api/state/<game_id>")
def api_state(game_id):
    g = games.get(game_id)
    if not g:
        return jsonify({"error": "Game not found"}), 404
    return jsonify(g.to_public())

@app.post("/api/guess")
def api_guess():
    data = request.get_json(silent=True) or {}
    game_id = data.get("gameId")
    letter = normalize_letter(data.get("letter"))

    if not game_id or game_id not in games:
        return jsonify({"error": "Game not found"}), 404
    if not letter:
        return jsonify({"error": "Invalid letter"}), 400

    g = games[game_id]

    if g.status != "playing":
        payload = g.to_public()
        if g.status == "lost":
            payload["answer"] = g.word
        return jsonify(payload)

    if letter in g.guessed or letter in g.wrong:
        payload = g.to_public()
        return jsonify(payload)

    if letter in g.word:
        g.guessed.add(letter)
    else:
        g.wrong.add(letter)

    update_status(g)

    payload = g.to_public()
    if g.status == "lost":
        payload["answer"] = g.word
    return jsonify(payload)

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8000, debug=True)