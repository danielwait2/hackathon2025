const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const { getDatabase } = require("../database/init");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();
const db = getDatabase();

// Register
router.post(
  "/register",
  [
    body("username").isLength({ min: 3 }).trim().escape(),
    body("password").isLength({ min: 6 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, password } = req.body;

      // Check if user already exists
      const existingUser = await new Promise((resolve, reject) => {
        db.get(
          "SELECT id FROM users WHERE username = ?",
          [username],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user
      const userId = await new Promise((resolve, reject) => {
        db.run(
          "INSERT INTO users (username, password_hash) VALUES (?, ?)",
          [username, passwordHash],
          function (err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });

      // Generate JWT
      const token = jwt.sign({ userId, username }, process.env.JWT_SECRET, {
        expiresIn: "24h",
      });

      res.status(201).json({
        message: "User created successfully",
        token,
        user: { id: userId, username },
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Login
router.post(
  "/login",
  [body("username").trim().escape(), body("password").notEmpty()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, password } = req.body;

      // Find user
      const user = await new Promise((resolve, reject) => {
        db.get(
          "SELECT * FROM users WHERE username = ?",
          [username],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(
        password,
        user.password_hash
      );
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.json({
        message: "Login successful",
        token,
        user: { id: user.id, username: user.username },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get current user
router.get("/me", authenticateToken, (req, res) => {
  res.json({
    user: {
      id: req.user.userId,
      username: req.user.username,
    },
  });
});

// Logout (client-side token removal)
router.post("/logout", (req, res) => {
  res.json({ message: "Logged out successfully" });
});

module.exports = router;
