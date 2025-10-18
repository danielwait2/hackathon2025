const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Test database connection and notes
const dbPath = path.join(__dirname, "database", "database.sqlite");
const db = new sqlite3.Database(dbPath);

console.log("Testing database and notes...");

// Check if database exists and has data
db.all("SELECT * FROM notes", (err, rows) => {
  if (err) {
    console.error("❌ Database error:", err.message);
  } else {
    console.log("✅ Database connected successfully");
    console.log("📝 Notes in database:", rows.length);
    if (rows.length > 0) {
      console.log("Recent notes:");
      rows.forEach((note, index) => {
        console.log(
          `${index + 1}. ID: ${note.id}, User: ${
            note.user_id
          }, Title: ${note.title?.substring(0, 50)}...`
        );
      });
    } else {
      console.log("No notes found in database");
    }
  }
});

// Check users
db.all("SELECT * FROM users", (err, rows) => {
  if (err) {
    console.error("❌ Users query error:", err.message);
  } else {
    console.log("👥 Users in database:", rows.length);
    if (rows.length > 0) {
      console.log("Users:");
      rows.forEach((user, index) => {
        console.log(`${index + 1}. ID: ${user.id}, Username: ${user.username}`);
      });
    }
  }
  db.close();
});
