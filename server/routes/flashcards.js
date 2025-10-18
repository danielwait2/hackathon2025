const express = require("express");
const { body, validationResult } = require("express-validator");
const { getDatabase } = require("../database/init");
const { authenticateToken, requireAuth } = require("../middleware/auth");

const router = express.Router();
const db = getDatabase();

// Apply authentication to all routes
router.use(authenticateToken, requireAuth);

// Get all flashcards for user
router.get("/", async (req, res) => {
  try {
    const userId = req.user.userId;
    const flashcards = await new Promise((resolve, reject) => {
      db.all(
        `SELECT f.*, n.title as note_title 
         FROM flashcards f 
         LEFT JOIN notes n ON f.note_id = n.id 
         WHERE f.user_id = ? 
         ORDER BY f.created_at DESC`,
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    res.json(flashcards);
  } catch (error) {
    console.error("Error fetching flashcards:", error);
    res.status(500).json({ error: "Failed to fetch flashcards" });
  }
});

// Get flashcards for a specific note
router.get("/note/:noteId", async (req, res) => {
  try {
    const { noteId } = req.params;
    const userId = req.user.userId;

    const flashcards = await new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM flashcards WHERE note_id = ? AND user_id = ? ORDER BY created_at DESC",
        [noteId, userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    res.json(flashcards);
  } catch (error) {
    console.error("Error fetching flashcards for note:", error);
    res.status(500).json({ error: "Failed to fetch flashcards" });
  }
});

// Create flashcard
router.post(
  "/",
  [
    body("question").notEmpty().trim(),
    body("answer").notEmpty().trim(),
    body("note_id").optional().isInt(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { question, answer, note_id } = req.body;
      const userId = req.user.userId;

      const flashcardId = await new Promise((resolve, reject) => {
        db.run(
          "INSERT INTO flashcards (user_id, note_id, question, answer, is_generated) VALUES (?, ?, ?, ?, 0)",
          [userId, note_id || null, question, answer],
          function (err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });

      const newFlashcard = await new Promise((resolve, reject) => {
        db.get(
          "SELECT * FROM flashcards WHERE id = ?",
          [flashcardId],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      res.status(201).json(newFlashcard);
    } catch (error) {
      console.error("Error creating flashcard:", error);
      res.status(500).json({ error: "Failed to create flashcard" });
    }
  }
);

// Get specific flashcard
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const flashcard = await new Promise((resolve, reject) => {
      db.get(
        "SELECT * FROM flashcards WHERE id = ? AND user_id = ?",
        [id, userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!flashcard) {
      return res.status(404).json({ error: "Flashcard not found" });
    }

    res.json(flashcard);
  } catch (error) {
    console.error("Error fetching flashcard:", error);
    res.status(500).json({ error: "Failed to fetch flashcard" });
  }
});

// Update flashcard
router.put(
  "/:id",
  [body("question").notEmpty().trim(), body("answer").notEmpty().trim()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const userId = req.user.userId;
      const { question, answer } = req.body;

      const result = await new Promise((resolve, reject) => {
        db.run(
          "UPDATE flashcards SET question = ?, answer = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?",
          [question, answer, id, userId],
          function (err) {
            if (err) reject(err);
            else resolve({ changes: this.changes });
          }
        );
      });

      if (result.changes === 0) {
        return res.status(404).json({ error: "Flashcard not found" });
      }

      res.json({ message: "Flashcard updated successfully" });
    } catch (error) {
      console.error("Error updating flashcard:", error);
      res.status(500).json({ error: "Failed to update flashcard" });
    }
  }
);

// Delete flashcard
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await new Promise((resolve, reject) => {
      db.run(
        "DELETE FROM flashcards WHERE id = ? AND user_id = ?",
        [id, userId],
        function (err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });

    if (result.changes === 0) {
      return res.status(404).json({ error: "Flashcard not found" });
    }

    res.json({ message: "Flashcard deleted successfully" });
  } catch (error) {
    console.error("Error deleting flashcard:", error);
    res.status(500).json({ error: "Failed to delete flashcard" });
  }
});

// Bulk delete flashcards
router.delete("/bulk", async (req, res) => {
  try {
    const { flashcardIds } = req.body;
    const userId = req.user.userId;

    if (!Array.isArray(flashcardIds) || flashcardIds.length === 0) {
      return res.status(400).json({ error: "Invalid flashcard IDs provided" });
    }

    // Create placeholders for the IN clause
    const placeholders = flashcardIds.map(() => "?").join(",");
    const params = [...flashcardIds, userId];

    const result = await new Promise((resolve, reject) => {
      db.run(
        `DELETE FROM flashcards WHERE id IN (${placeholders}) AND user_id = ?`,
        params,
        function (err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });

    res.json({
      message: `${result.changes} flashcards deleted successfully`,
      deletedCount: result.changes,
    });
  } catch (error) {
    console.error("Error bulk deleting flashcards:", error);
    res.status(500).json({ error: "Failed to delete flashcards" });
  }
});

module.exports = router;
