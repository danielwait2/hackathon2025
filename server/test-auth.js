const jwt = require("jsonwebtoken");
require("dotenv").config();

// Test JWT token generation and verification
const testUser = { userId: 1, username: "daniel" };
const secret = process.env.JWT_SECRET;

console.log("Testing JWT authentication...");
console.log("JWT Secret (first 10 chars):", secret?.substring(0, 10) + "...");

try {
  // Generate a test token
  const token = jwt.sign(testUser, secret, { expiresIn: "24h" });
  console.log("✅ JWT token generated successfully");
  console.log("Token (first 20 chars):", token.substring(0, 20) + "...");

  // Verify the token
  const decoded = jwt.verify(token, secret);
  console.log("✅ JWT token verified successfully");
  console.log("Decoded payload:", decoded);
} catch (error) {
  console.error("❌ JWT Error:", error.message);
}
