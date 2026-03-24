const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const streamifier = require("streamifier");

const MAX_UPLOAD_FILE_SIZE_MB = 10;
const MAX_UPLOAD_FILES = 5;
const CLOUDINARY_UPLOAD_TIMEOUT_MS =
  Number.parseInt(process.env.CLOUDINARY_UPLOAD_TIMEOUT_MS || "120000", 10) ||
  120000;
const CLOUDINARY_UPLOAD_CONCURRENCY = Math.max(
  1,
  Math.min(
    MAX_UPLOAD_FILES,
    Number.parseInt(process.env.CLOUDINARY_UPLOAD_CONCURRENCY || "2", 10) || 2,
  ),
);
const UPLOAD_DEBUG = process.env.UPLOAD_DEBUG === "true";

const SUPPORTED_MIME_TYPES = [
  "application/pdf",
  "application/json",
  "application/xml",
  "application/x-yaml",
  "text/plain",
  "text/markdown",
  "text/csv",
  "text/xml",
  "text/yaml",
];

const SUPPORTED_TYPES_TEXT =
  "image/*, audio/*, video/*, application/pdf, text/plain, text/markdown, text/csv, application/json, application/xml, text/xml, text/yaml, application/x-yaml";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  ...(process.env.CLOUDINARY_UPLOAD_PREFIX
    ? { upload_prefix: process.env.CLOUDINARY_UPLOAD_PREFIX }
    : {}),
});

const uploadLog = (event, payload = {}) => {
  if (!UPLOAD_DEBUG) return;
  console.log(`[upload] ${event}`, payload);
};

const isSupportedMimeType = (mimeType) => {
  if (!mimeType || typeof mimeType !== "string") return false;

  if (mimeType.startsWith("image/")) return true;
  if (mimeType.startsWith("audio/")) return true;
  if (mimeType.startsWith("video/")) return true;

  return SUPPORTED_MIME_TYPES.includes(mimeType);
};

const normalizeCloudinaryError = (error) => {
  const message =
    error?.error?.message ||
    error?.response?.data?.error?.message ||
    error?.message ||
    "Unknown Cloudinary error";

  const normalized = new Error(message);
  normalized.raw = {
    name: error?.name,
    message: error?.message,
    httpCode: error?.http_code,
  };

  return normalized;
};

const toAttachment = (cloudinaryResult, file) => ({
  name: file.originalname,
  url: cloudinaryResult.secure_url,
  mimeType: file.mimetype || "application/octet-stream",
  size: file.size || 0,
  cloudinaryPublicId: cloudinaryResult.public_id,
});

// upload 1 file
const uploadToCloudinary = (fileBuffer, originalName, mimeType, meta = {}) => {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    throw new Error("CLOUDINARY_CLOUD_NAME is required");
  }

  if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error(
      "CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET are required for signed uploads",
    );
  }

  const safeOriginalName = (originalName || "upload.bin").replace(
    /[^a-zA-Z0-9._-]/g,
    "_",
  );
  const startedAt = Date.now();
  const requestId = meta.requestId || "unknown";

  uploadLog("file.start", {
    requestId,
    fileName: safeOriginalName,
    mimeType,
    timeoutMs: CLOUDINARY_UPLOAD_TIMEOUT_MS,
    uploadType: "signed",
  });

  return new Promise((resolve, reject) => {
    let settled = false;
    let uploadStream;

    const timeoutId = setTimeout(() => {
      if (settled) return;
      settled = true;

      if (uploadStream) {
        uploadStream.destroy();
      }

      uploadLog("file.timeout", {
        requestId,
        fileName: safeOriginalName,
        elapsedMs: Date.now() - startedAt,
      });

      reject(
        new Error(
          `Cloudinary upload timed out after ${CLOUDINARY_UPLOAD_TIMEOUT_MS}ms`,
        ),
      );
    }, CLOUDINARY_UPLOAD_TIMEOUT_MS + 2000);

    uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        folder: "uploads",
        public_id: `${Date.now()}-${safeOriginalName}`,
        filename_override: safeOriginalName,
        timeout: CLOUDINARY_UPLOAD_TIMEOUT_MS,
      },
      (error, result) => {
        clearTimeout(timeoutId);
        if (settled) return;
        settled = true;

        if (error) {
          uploadLog("file.error", {
            requestId,
            fileName: safeOriginalName,
            elapsedMs: Date.now() - startedAt,
            message: error?.message,
            httpCode: error?.http_code,
            name: error?.name,
          });
          return reject(normalizeCloudinaryError(error));
        }

        if (!result?.secure_url) {
          return reject(new Error("Invalid Cloudinary response"));
        }

        uploadLog("file.success", {
          requestId,
          fileName: safeOriginalName,
          elapsedMs: Date.now() - startedAt,
          publicId: result.public_id,
          bytes: result.bytes,
        });

        resolve(result);
      },
    );

    uploadStream.on("error", (err) => {
      clearTimeout(timeoutId);
      if (settled) return;
      settled = true;
      reject(normalizeCloudinaryError(err));
    });

    streamifier
      .createReadStream(fileBuffer)
      .on("error", (err) => {
        clearTimeout(timeoutId);
        if (settled) return;
        settled = true;
        reject(normalizeCloudinaryError(err));
      })
      .pipe(uploadStream);
  });
};

const uploadFilesToCloudinary = async (files = [], options = {}) => {
  if (!Array.isArray(files) || files.length === 0) {
    return [];
  }

  const requestId = options.requestId || "unknown";
  const attachments = new Array(files.length);
  let currentIndex = 0;
  const workerCount = Math.min(CLOUDINARY_UPLOAD_CONCURRENCY, files.length);

  uploadLog("batch.start", {
    requestId,
    fileCount: files.length,
    workerCount,
    timeoutMs: CLOUDINARY_UPLOAD_TIMEOUT_MS,
    concurrency: CLOUDINARY_UPLOAD_CONCURRENCY,
  });

  const worker = async () => {
    while (true) {
      const index = currentIndex;
      currentIndex += 1;

      if (index >= files.length) return;

      const file = files[index];
      const result = await uploadToCloudinary(
        file.buffer,
        file.originalname,
        file.mimetype,
        { requestId },
      );
      attachments[index] = toAttachment(result, file);
    }
  };

  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  uploadLog("batch.success", {
    requestId,
    uploadedCount: attachments.length,
  });

  return attachments;
};

// multer config
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!isSupportedMimeType(file.mimetype)) {
      const error = new Error(`Unsupported file type: ${file.mimetype}`);
      error.code = "UNSUPPORTED_FILE_TYPE";
      return cb(error);
    }
    cb(null, true);
  },
  limits: {
    fileSize: MAX_UPLOAD_FILE_SIZE_MB * 1024 * 1024,
    files: MAX_UPLOAD_FILES,
  },
});

module.exports = {
  MAX_UPLOAD_FILE_SIZE_MB,
  MAX_UPLOAD_FILES,
  SUPPORTED_TYPES_TEXT,
  CLOUDINARY_UPLOAD_TIMEOUT_MS,
  CLOUDINARY_UPLOAD_CONCURRENCY,
  upload,
  uploadToCloudinary,
  uploadFilesToCloudinary,
  toAttachment,
};
