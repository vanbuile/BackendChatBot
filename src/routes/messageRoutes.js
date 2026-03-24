const express = require("express");
const multer = require("multer");
const router = express.Router();
const Message = require("../models/Message");
const { chatWithGemini } = require("../services/geminiService");
const {
  MAX_UPLOAD_FILE_SIZE_MB,
  MAX_UPLOAD_FILES,
  SUPPORTED_TYPES_TEXT,
  upload,
  uploadFilesToCloudinary,
} = require("../services/fileUploadService");

const SINGLE_SESSION_ID = "default";

const parseAttachments = (rawAttachments) => {
  if (!rawAttachments) return [];

  if (Array.isArray(rawAttachments)) {
    return rawAttachments;
  }

  if (typeof rawAttachments === "string") {
    try {
      const parsed = JSON.parse(rawAttachments);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  return [];
};

// POST /api/messages - Gửi tin nhắn và nhận response từ Gemini
router.post("/", (req, res) => {
  upload.any()(req, res, async (uploadError) => {
    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    if (uploadError) {
      console.error("Upload middleware error", {
        requestId,
        code: uploadError.code,
        message: uploadError.message,
      });

      if (uploadError instanceof multer.MulterError) {
        if (uploadError.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            error: `File too large. Maximum size is ${MAX_UPLOAD_FILE_SIZE_MB}MB per file.`,
          });
        }

        if (uploadError.code === "LIMIT_FILE_COUNT") {
          return res.status(400).json({
            success: false,
            error: `Too many files. Maximum is ${MAX_UPLOAD_FILES} files per request.`,
          });
        }
      }

      if (uploadError.code === "UNSUPPORTED_FILE_TYPE") {
        return res.status(400).json({
          success: false,
          error: `${uploadError.message}. Supported types: ${SUPPORTED_TYPES_TEXT}.`,
        });
      }

      return res.status(500).json({
        success: false,
        error: uploadError.message || "Failed to upload file",
      });
    }

    try {
      const { content, attachments } = req.body;
      const normalizedContent =
        typeof content === "string" ? content.trim() : "";
      const uploadedFiles = req.files || [];
      const bodyAttachments = parseAttachments(attachments);

      console.log("[messages][upload] request started", {
        requestId,
        uploadedFileCount: uploadedFiles.length,
        bodyAttachmentCount: bodyAttachments.length,
      });

      // Upload files to Cloudinary with limited concurrency to avoid overload.
      let uploadedAttachments = [];
      try {
        uploadedAttachments = await uploadFilesToCloudinary(uploadedFiles, {
          requestId,
        });
      } catch (cloudinaryError) {
        console.error("Cloudinary upload error:", {
          requestId,
          message: cloudinaryError?.message,
          name: cloudinaryError?.name,
          cause: cloudinaryError?.cause,
          stack: cloudinaryError?.stack,
        });
        return res.status(500).json({
          success: false,
          error: `Failed to upload file to CDN: ${cloudinaryError.message}`,
        });
      }

      const finalAttachments = [...bodyAttachments, ...uploadedAttachments];

      console.log("[messages][upload] request upload completed", {
        requestId,
        uploadedAttachmentCount: uploadedAttachments.length,
        finalAttachmentCount: finalAttachments.length,
      });

      // Validate input
      if (!normalizedContent && uploadedFiles.length === 0) {
        return res.status(400).json({
          success: false,
          error: "content or at least one file is required",
        });
      }

      // Gọi Gemini API để lấy response
      const botContent = await chatWithGemini(normalizedContent, uploadedFiles);

      const userTimestamp = new Date();
      const assistantTimestamp = new Date(userTimestamp.getTime() + 1);

      // Lưu cả 2 message (user + assistant) vào MongoDB
      const userMessage = new Message({
        sessionId: SINGLE_SESSION_ID,
        content: normalizedContent || "[Uploaded file]",
        role: "user",
        timestamp: userTimestamp,
        attachments: finalAttachments,
      });

      const assistantMessage = new Message({
        sessionId: SINGLE_SESSION_ID,
        content: botContent,
        role: "assistant",
        timestamp: assistantTimestamp,
        attachments: [],
      });

      await Message.insertMany([userMessage, assistantMessage]);

      return res.status(201).json({
        success: true,
        data: {
          message: assistantMessage,
        },
      });
    } catch (error) {
      console.error("Error in POST /api/messages:", {
        message: error.message,
        stack: error.stack,
      });
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to send message",
      });
    }
  });
});

// GET /api/messages - Lấy lịch sử trò chuyện cho phiên mặc định
router.get("/", async (req, res) => {
  try {
    const { limit = 50, skip = 0 } = req.query;
    const parsedLimit = Number.parseInt(limit, 10) || 50;
    const parsedSkip = Number.parseInt(skip, 10) || 0;

    // Lấy tin nhắn từ database
    const messages = await Message.find({ sessionId: SINGLE_SESSION_ID })
      .sort({ timestamp: -1 })
      .limit(parsedLimit)
      .skip(parsedSkip);

    // Lấy tổng số tin nhắn
    const total = await Message.countDocuments({
      sessionId: SINGLE_SESSION_ID,
    });

    res.status(200).json({
      success: true,
      data: {
        sessionId: SINGLE_SESSION_ID,
        total,
        count: messages.length,
        limit: parsedLimit,
        skip: parsedSkip,
        messages: messages.reverse(),
      },
    });
  } catch (error) {
    console.error("Error in GET /api/messages:", error.message);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch messages",
    });
  }
});

module.exports = router;
