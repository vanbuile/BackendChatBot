const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");

let genAI;
let model;
let activeModelName;
let modelNames = [];
const modelCache = new Map();

const parseModelNames = () => {
  const primaryModel = (process.env.GEMINI_MODEL || "gemini-2.5-flash").trim();
  const backupModels = (process.env.GEMINI_BACKUP_MODELS || "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);

  return [...new Set([primaryModel, ...backupModels])];
};

const getOrCreateModel = (modelName) => {
  if (!modelCache.has(modelName)) {
    modelCache.set(modelName, genAI.getGenerativeModel({ model: modelName }));
  }
  return modelCache.get(modelName);
};

const isLimitError = (error) => {
  const message = String(error?.message || "").toLowerCase();
  const status = Number(error?.status || error?.statusCode || error?.code || 0);

  return (
    status === 429 ||
    message.includes("resource_exhausted") ||
    message.includes("quota") ||
    message.includes("rate limit") ||
    message.includes("too many requests")
  );
};

const getModelAttemptOrder = () => {
  if (!activeModelName || modelNames.length === 0) {
    return [...modelNames];
  }

  const others = modelNames.filter((name) => name !== activeModelName);
  return [activeModelName, ...others];
};

const initGemini = () => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not set in environment variables");
    }

    genAI = new GoogleGenerativeAI(apiKey);
    modelCache.clear();
    modelNames = parseModelNames();

    if (modelNames.length === 0) {
      throw new Error("No Gemini models configured");
    }

    activeModelName = modelNames[0];
    model = getOrCreateModel(activeModelName);
    console.log(
      `✓ Gemini AI initialized with model: ${activeModelName} (backups: ${Math.max(modelNames.length - 1, 0)})`,
    );
  } catch (error) {
    console.error("✗ Failed to initialize Gemini:", error.message);
  }
};

const toInlinePart = async (file) => {
  // Support both disk storage (file.path) and memory storage (file.buffer).
  const fileBuffer = file.buffer
    ? file.buffer
    : await fs.promises.readFile(file.path);
  return {
    inlineData: {
      data: fileBuffer.toString("base64"),
      mimeType: file.mimetype,
    },
  };
};

const chatWithGemini = async (userMessage, uploadedFiles = []) => {
  try {
    if (!model) {
      throw new Error("Gemini model not initialized");
    }

    const files = (uploadedFiles || []).filter(
      (file) => file && (file.path || file.buffer) && file.mimetype,
    );

    const fileParts = await Promise.all(files.map(toInlinePart));
    const promptText =
      typeof userMessage === "string" && userMessage.trim()
        ? userMessage.trim()
        : "Please analyze the uploaded file(s).";

    const attempts = getModelAttemptOrder();
    let lastError;

    for (let i = 0; i < attempts.length; i += 1) {
      const modelName = attempts[i];
      const candidateModel = getOrCreateModel(modelName);

      try {
        const result = await candidateModel.generateContent([
          promptText,
          ...fileParts,
        ]);
        const response = await result.response;
        const text = response.text();

        if (modelName !== activeModelName) {
          console.warn(
            `[gemini] switched active model from ${activeModelName} to ${modelName} after limit error`,
          );
          activeModelName = modelName;
          model = candidateModel;
        }

        return text;
      } catch (error) {
        lastError = error;
        const shouldFallback = isLimitError(error) && i < attempts.length - 1;

        if (shouldFallback) {
          console.warn(
            `[gemini] model ${modelName} hit limit, trying backup model ${attempts[i + 1]}`,
          );
          continue;
        }

        throw error;
      }
    }

    throw (
      lastError || new Error("Failed to get response from all Gemini models")
    );
  } catch (error) {
    console.error("✗ Gemini API error:", error.message);
    throw new Error(`Failed to get response from Gemini: ${error.message}`);
  }
};

module.exports = {
  initGemini,
  chatWithGemini,
};
