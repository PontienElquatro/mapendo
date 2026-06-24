import { GoogleGenAI } from "@google/genai";
import pino from 'pino';
import { generateImagePrompt } from '../src/utils/prompts.ts';
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
    let errMessage = error.message || "Internal Server Error";
    try {
        const parsed = JSON.parse(errMessage);
        if (parsed.error?.message) {
            errMessage = parsed.error.message;
        }
    } catch (e) {}

    logger.error({ status, errMessage, originalError: error.message }, "Generation error");

    return res.status(status).json({ error: errMessage });
  }
});

async function generateImage(params: any, signal: AbortSignal) {
  const prompt = generateImagePrompt(params);

  // Use real available models. Imagen 3 is preferred for image generation.
  // Gemini 2.0 Flash is a fallback that might support image generation via tools or exp features.
  const models = [
    "imagen-3.0-generate-001",
    "imagen-3.0-fast-001",
    "gemini-2.0-flash"
  ];

  let lastError = null;

  for (const modelName of models) {
    try {
      logger.info({ model: modelName }, "Attempting generation");

      if (modelName.startsWith("imagen-")) {
        const result = await genAI.models.generateImages({
          model: modelName,
          prompt: prompt,
          config: {
            numberOfImages: 1,
            aspectRatio: "1:1",
            safetyFilterLevel: "BLOCK_ONLY_HIGH",
            personGeneration: "ALLOW_ALL"
          }
        });

        const generatedImage = result.generatedImages?.[0];
        if (generatedImage?.image?.imageBytes) {
          const mimeType = generatedImage.image.mimeType || "image/png";
          return `data:${mimeType};base64,${generatedImage.image.imageBytes}`;
        }

        if (generatedImage?.raiFilteredReason) {
            throw new Error(`Content filtered: ${generatedImage.raiFilteredReason}`);
        }
      } else {
        // Fallback for Gemini models
        const parts: any[] = [];
        if (params.customMedia) {
          const matches = params.customMedia.match(/^data:([^;]+);base64,(.+)$/);
          if (matches) {
            parts.push({ inlineData: { data: matches[2], mimeType: matches[1] } });
          }
        }
        parts.push({ text: prompt });

        const result = await genAI.models.generateContent({
          model: modelName,
          contents: [{ role: "user", parts }]
        });

        // Check for inlineData in response (image bytes)
        const imagePart = result.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
        if (imagePart?.inlineData) {
          return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
        }

        if (result.text) {
            logger.warn({ model: modelName }, "Model returned text instead of image");
            throw new Error("Le modèle a retourné du texte au lieu d'une image. Essayez un autre thème.");
        }
      }
    } catch (err: any) {
      logger.warn({ model: modelName, error: err.message }, "Model failed");
      lastError = err;
      if (err.status === 401 || err.status === 403 || err.status === 400) throw err;
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
