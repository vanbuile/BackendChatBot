const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    url: { type: String, default: "" },
    mimeType: { type: String, default: "" },
    size: { type: Number, default: 0 },
    cloudinaryPublicId: { type: String, default: "" },
  },
  { _id: false },
);

const messageSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      default: "default",
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["user", "assistant", "system"],
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    attachments: {
      type: [attachmentSchema],
      default: [],
    },
  },
  {
    timestamps: false,
  },
);

// Tạo index tổng hợp để tìm kiếm nhanh theo sessionId và timestamp
messageSchema.index({ sessionId: 1, timestamp: -1 });

module.exports = mongoose.model("Message", messageSchema);
