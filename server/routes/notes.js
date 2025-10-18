const express = require("express");
const { body, validationResult } = require("express-validator");
const { getDatabase } = require("../database/init");
const { authenticateToken, requireAuth } = require("../middleware/auth");
const { generateFlashcards } = require("../services/openai");

const router = express.Router();
const db = getDatabase();

// Apply authentication to all routes
router.use(authenticateToken, requireAuth);

// Create note
router.post(
  "/",
  [
    body("content").notEmpty().trim(),
    body("title").optional().trim().escape(),
    body("topic").optional().trim().escape(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { content, title, topic } = req.body;
      const userId = req.user.userId;

      const noteId = await new Promise((resolve, reject) => {
        db.run(
          "INSERT INTO notes (user_id, title, content, topic) VALUES (?, ?, ?, ?)",
          [userId, title || null, content, topic || null],
          function (err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });

      const newNote = await new Promise((resolve, reject) => {
        db.get("SELECT * FROM notes WHERE id = ?", [noteId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      res.status(201).json(newNote);
    } catch (error) {
      console.error("Error creating note:", error);
      res.status(500).json({ error: "Failed to create note" });
    }
  }
);

// Get all notes for user
router.get("/", async (req, res) => {
  try {
    const userId = req.user.userId;
    const notes = await new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM notes WHERE user_id = ? ORDER BY created_at DESC",
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    res.json(notes);
  } catch (error) {
    console.error("Error fetching notes:", error);
    res.status(500).json({ error: "Failed to fetch notes" });
  }
});

// Get specific note
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const note = await new Promise((resolve, reject) => {
      db.get(
        "SELECT * FROM notes WHERE id = ? AND user_id = ?",
        [id, userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    res.json(note);
  } catch (error) {
    console.error("Error fetching note:", error);
    res.status(500).json({ error: "Failed to fetch note" });
  }
});

// Update note
router.put(
  "/:id",
  [
    body("content").optional().trim(),
    body("title").optional().trim().escape(),
    body("topic").optional().trim().escape(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const userId = req.user.userId;
      const { content, title, topic } = req.body;

      const result = await new Promise((resolve, reject) => {
        db.run(
          "UPDATE notes SET content = COALESCE(?, content), title = COALESCE(?, title), topic = COALESCE(?, topic), updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?",
          [content, title, topic, id, userId],
          function (err) {
            if (err) reject(err);
            else resolve({ changes: this.changes });
          }
        );
      });

      if (result.changes === 0) {
        return res.status(404).json({ error: "Note not found" });
      }

      res.json({ message: "Note updated successfully" });
    } catch (error) {
      console.error("Error updating note:", error);
      res.status(500).json({ error: "Failed to update note" });
    }
  }
);

// Delete note
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await new Promise((resolve, reject) => {
      db.run(
        "DELETE FROM notes WHERE id = ? AND user_id = ?",
        [id, userId],
        function (err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });

    if (result.changes === 0) {
      return res.status(404).json({ error: "Note not found" });
    }

    res.json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error("Error deleting note:", error);
    res.status(500).json({ error: "Failed to delete note" });
  }
});

// Generate flashcards from note
router.post("/:id/generate-flashcards", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Get the note
    const note = await new Promise((resolve, reject) => {
      db.get(
        "SELECT * FROM notes WHERE id = ? AND user_id = ?",
        [id, userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    // Generate flashcards using OpenAI
    const generatedFlashcards = await generateFlashcards(
      note.content,
      note.topic
    );

    // Save flashcards to database
    const savedFlashcards = [];
    for (const flashcard of generatedFlashcards) {
      const flashcardId = await new Promise((resolve, reject) => {
        db.run(
          "INSERT INTO flashcards (user_id, note_id, question, answer, is_generated) VALUES (?, ?, ?, ?, 1)",
          [userId, id, flashcard.question, flashcard.answer],
          function (err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });

      savedFlashcards.push({
        id: flashcardId,
        question: flashcard.question,
        answer: flashcard.answer,
        is_generated: true,
        note_id: id,
      });
    }

    res.json({
      message: "Flashcards generated successfully",
      flashcards: savedFlashcards,
    });
  } catch (error) {
    console.error("Error generating flashcards:", error);
    res.status(500).json({ error: "Failed to generate flashcards" });
  }
});

module.exports = router;
