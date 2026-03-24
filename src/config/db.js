const mongoose = require("mongoose");

const LOCAL_FALLBACK_URI = "mongodb://localhost:27017/chatbot_db";

const sanitizeMongoUri = (uri) => {
  if (!uri) return "<empty>";
  return uri.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:****@");
};

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || LOCAL_FALLBACK_URI;

    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
    });

    console.log(
      `✓ MongoDB connected successfully: ${sanitizeMongoUri(mongoURI)}`,
    );
    return mongoose.connection;
  } catch (error) {
    console.error("✗ MongoDB connection failed:", error.message);
    console.error(
      "Mongo URI in use:",
      sanitizeMongoUri(process.env.MONGODB_URI || LOCAL_FALLBACK_URI),
    );
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log("✓ MongoDB disconnected");
  } catch (error) {
    console.error("✗ MongoDB disconnection failed:", error.message);
  }
};

module.exports = { connectDB, disconnectDB };
