# Flashcard Generator

Creating Anki flashcards from your notes is almost as time-consuming as studying itself. You read the material, identify what's worth memorizing, write a question, write an answer, format the card, and repeat — before you've retained anything. Most people skip the cards entirely and lose the benefits of spaced repetition.

This app removes that friction. Paste your notes, click generate, and get a full set of Q&A flashcards ready to review. Edit anything that doesn't look right, then push directly to a deck in your running Anki app with one click. No export files, no copy-pasting, no format juggling.

---

## How It Works

1. Create an account and add your notes
2. Hit "Generate Flashcards" on any note — GPT reads it and produces a set of Q&A pairs
3. Review and edit the generated cards, or add your own manually
4. Select cards and push them to any deck in Anki desktop via AnkiConnect

---

## Features

- GPT-powered flashcard generation from freeform notes
- Full note and flashcard management (create, edit, delete)
- Direct Anki integration via AnkiConnect — no export step
- Smart batching for large card sets
- User accounts with JWT authentication

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React + TypeScript + Material-UI |
| Backend | Node.js + Express |
| Database | SQLite |
| AI | OpenAI API (GPT) |
| Anki Integration | AnkiConnect |

---

## Local Setup

```bash
# Install dependencies
cd server && npm install
cd ../client && npm install

# Configure environment
cp server/env.example server/.env
# Add your OpenAI API key to server/.env

# Install AnkiConnect in Anki desktop
# Tools → Add-ons → Get Add-ons → code: 2055492159
# Restart Anki

# Start both servers
./start-dev.sh
```

Frontend: `http://localhost:3000`
Backend: `http://localhost:5001/api`

---

## Status

Built at the BYU MISM Hackathon (October 2025). Works end-to-end locally — paste notes in, get cards out, push to Anki. Not deployed; local setup only.
