import { GoogleGenAI } from "@google/genai";
import pino from 'pino';
import { generateImagePrompt } from '../src/utils/prompts';
import rateLimit from 'express-rate-limit';
import express from 'express';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  logger.error("GEMINI_API_KEY environment variable is not set");
}

const genAI = new GoogleGenAI({ apiKey: apiKey || "" });

const MAX_MESSAGE_LENGTH = 1000;
const MAX_MEDIA_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const app = express();
app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de requêtes, veuillez réessayer plus tard." }
});

// In Vercel, the handler can be at the root of the file or in an express app.
// We handle both potential paths.
app.post(['/', '/api/generate'], limiter, async (req: any, res: any) => {
  const { sender, receiver, message, type, customMedia } = req.body;

  if (!sender || !receiver || !message) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ error: "Message too long" });
  }

  if (customMedia) {
    const matches = customMedia.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ error: "Invalid media format" });
    }
    const mimeType = matches[1];
    const base64Data = matches[2];
    const size = Buffer.from(base64Data, 'base64').length;

    if (size > MAX_MEDIA_SIZE) {
      return res.status(400).json({ error: "Media file too large (max 5MB)" });
    }
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return res.status(400).json({ error: "Unsupported media type" });
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    if (type === 'image') {
      const url = await generateImage(req.body, controller.signal);
      clearTimeout(timeoutId);
      return res.status(200).json({ url });
    } else {
      clearTimeout(timeoutId);
      return res.status(501).json({ error: "Génération vidéo non implémentée" });
    }
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      return res.status(408).json({ error: "Request Timeout" });
    }

    const status = error.status || 500;
    const errMessage = error.message || "Internal Server Error";

    logger.error({ status, errMessage }, "Generation error");

    return res.status(status).json({ error: errMessage });
  }
});

async function generateImage(params: any, signal: AbortSignal) {
  const prompt = generateImagePrompt(params);

  // Confirmed models from probe
  const models = [
    "gemini-2.5-flash-image",
    "gemini-3.1-flash-image"
  ];

  let lastError = null;

  for (const modelName of models) {
    try {
      logger.info({ model: modelName }, "Attempting generation");

      const parts: any[] = [];
      if (params.customMedia) {
        const matches = params.customMedia.match(/^data:([^;]+);base64,(.+)$/);
        parts.push({ inlineData: { data: matches[2], mimeType: matches[1] } });
      }
      parts.push({ text: prompt });

      const result = await genAI.models.generateContent({
        model: modelName,
        contents: [{ role: "user", parts }]
      });

      const response = result;
      const candidates = response.candidates || [];
      const imagePart = candidates[0]?.content?.parts?.find((p: any) => p.inlineData);

      if (imagePart?.inlineData) {
        return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
      }
    } catch (err: any) {
      logger.warn({ model: modelName, error: err.message }, "Model failed");
      lastError = err;
      // If unauthorized or forbidden, don't retry other models
      if (err.status === 401 || err.status === 403) throw err;
    }
  }
  throw lastError || new Error("Image generation failed with all models");
}

// Support local development
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    logger.info(`Backend server running on http://localhost:${port}`);
  });
}

export default app;
