const express = require("express");
const { getDatabase } = require("../database/init");
const { authenticateToken, requireAuth } = require("../middleware/auth");
const {
  checkAnkiConnection,
  getAnkiDecks,
  pushToAnki,
} = require("../services/anki");

const router = express.Router();
const db = getDatabase();

// Apply authentication to all routes
router.use(authenticateToken, requireAuth);

// Check Anki connection
router.get("/connection", async (req, res) => {
  try {
    const isConnected = await checkAnkiConnection();
    res.json({ connected: isConnected });
  } catch (error) {
    console.error("Error checking Anki connection:", error);
    res.status(500).json({ error: "Failed to check Anki connection" });
  }
});

// Get Anki decks
router.get("/decks", async (req, res) => {
  try {
    const decks = await getAnkiDecks();
    res.json(decks);
  } catch (error) {
    console.error("Error fetching Anki decks:", error);
    res.status(500).json({ error: "Failed to fetch Anki decks" });
  }
});

// Push flashcards to Anki
router.post("/push", async (req, res) => {
  try {
    const { flashcardIds, deckName } = req.body;
    const userId = req.user.userId;

    if (!Array.isArray(flashcardIds) || flashcardIds.length === 0) {
      return res.status(400).json({ error: "No flashcards provided" });
    }

    if (!deckName) {
      return res.status(400).json({ error: "Deck name is required" });
    }

    // Get flashcards from database
    const flashcards = await new Promise((resolve, reject) => {
      const placeholders = flashcardIds.map(() => "?").join(",");
      const params = [...flashcardIds, userId];

      db.all(
        `SELECT * FROM flashcards WHERE id IN (${placeholders}) AND user_id = ?`,
        params,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    if (flashcards.length === 0) {
      return res.status(404).json({ error: "No flashcards found" });
    }

    if (flashcards.length !== flashcardIds.length) {
      return res.status(400).json({
        error: "Some flashcards were not found or do not belong to you",
      });
    }

    // Push to Anki
    const result = await pushToAnki(flashcards, deckName);

    res.json({
      message: "Flashcards pushed to Anki successfully",
      pushedCount: result.added,
      deckName: result.deckName,
      noteIds: result.noteIds,
    });
  } catch (error) {
    console.error("Error pushing to Anki:", error);
    res.status(500).json({
      error: "Failed to push flashcards to Anki",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Push all flashcards from a note to Anki
router.post("/push-note/:noteId", async (req, res) => {
  try {
    const { noteId } = req.params;
    const { deckName } = req.body;
    const userId = req.user.userId;

    if (!deckName) {
      return res.status(400).json({ error: "Deck name is required" });
    }

    // Get flashcards for the note
    const flashcards = await new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM flashcards WHERE note_id = ? AND user_id = ?",
        [noteId, userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    if (flashcards.length === 0) {
      return res
        .status(404)
        .json({ error: "No flashcards found for this note" });
    }

    // Push to Anki
    const result = await pushToAnki(flashcards, deckName);

    res.json({
      message: "Note flashcards pushed to Anki successfully",
      pushedCount: result.added,
      deckName: result.deckName,
      noteIds: result.noteIds,
    });
  } catch (error) {
    console.error("Error pushing note to Anki:", error);
    res.status(500).json({
      error: "Failed to push note to Anki",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;
