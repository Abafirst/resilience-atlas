// server.js
const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const { execSync } = require("child_process");

dotenv.config();
const app = express();

// ============================
// Database connection
// ============================
let dbStatus = "disconnected";

if (process.env.MONGODB_URI) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      dbStatus = "connected";
      console.log("✅ MongoDB connected");
    })
    .catch((err) => {
      dbStatus = "disconnected";
      console.error("❌ MongoDB connection failed:", err);
    });
} else {
  console.warn("⚠️ MONGODB_URI not set — database features disabled");
}

// ============================
// Middleware
// ============================
app.use(express.json());
// Serve static frontend files
app.use(express.static(path.join(__dirname, "../public")));
// ============================
// Health check endpoint
// ============================
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Resilience Atlas server is running",
    db: dbStatus,
  });
});

// ============================
// API routes
// ============================
app.use("/auth", require("./routes/auth"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/quiz", require("./routes/quiz"));
app.use("/api/affiliates", require("./routes/affiliates"));
app.use("/api/stripe", require("./routes/stripe"));

// ============================
// Catch-all for SPA
// ============================
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// ============================
// Auto-pick free port starting at 3000
// ============================
let PORT = 3000;
function isPortFree(port) {
  try {
    execSync(`lsof -i:${port}`);
    return false; // port is in use
  } catch {
    return true; // port is free
  }
}

while (!isPortFree(PORT)) {
  PORT += 1;
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`✅ MongoDB status: ${dbStatus}`);
});
// SPA fallback for React/Vanilla frontends
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});
