const express = require("express");
const cors = require("cors");
const dns = require("node:dns");
require("dotenv").config();

const { connectDB } = require("./config/db");
const { initGemini } = require("./services/geminiService");
const messageRoutes = require("./routes/messageRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Prefer IPv4 to reduce network timeouts in environments with unstable IPv6.
dns.setDefaultResultOrder("ipv4first");

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the Node.js Backend API" });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "Server is running",
    mongodb: "Connected",
    gemini: "Initialized",
  });
});

// Message routes
app.use("/api/messages", messageRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Initialize Gemini API
    initGemini();

    app.listen(PORT, () => {
      console.log(`✓ Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("✗ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
