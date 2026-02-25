# Hangman Web (Python + Frontend)

A simple Hangman game with a Flask API backend and a vanilla HTML/CSS/JS frontend.

## Features
- New game generation
- Guess letters via on-screen keyboard or input box
- Wrong letters list
- Win/Lose detection
- Reveals the answer when you lose

## Tech Stack
- Backend: Python 3 + Flask + Flask-Cors
- Frontend: HTML + CSS + JavaScript (fetch API)

## Requirements
- Python 3.10+ (recommended: Python 3.11)

## Setup (Windows PowerShell)

### 1 Run backend
```powershell
cd hangman-web\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py