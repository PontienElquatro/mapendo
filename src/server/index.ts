import express from 'express';
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
import { generateImagePrompt } from '../utils/prompts';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json({ limit: '10mb' }));

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY is not set in environment variables.");
}

const genAI = new GoogleGenAI({ apiKey: apiKey || "" });

// Validation constants
const MAX_MESSAGE_LENGTH = 1000;
const MAX_MEDIA_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

app.post('/api/generate', async (req, res) => {
  const { sender, receiver, message, theme, style, font, type, customMedia } = req.body;

  // Basic validation
  if (!sender || !receiver || !message) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ error: "Message too long" });
  }

  if (customMedia) {
    // Validate base64 media
    const matches = customMedia.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ error: "Invalid media format" });
    }
    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    if (buffer.length > MAX_MEDIA_SIZE) {
      return res.status(400).json({ error: "Media file too large (max 5MB)" });
    }
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return res.status(400).json({ error: "Unsupported media type" });
    }
  }

  try {
    if (type === 'image') {
      const url = await generateImage(req.body);
      res.json({ url });
    } else {
      // Video generation logic (Placeholder as it originally required specific key setup/SDK features)
      // For now, redirect to image if video not fully supported or implement similar fallback
      res.status(501).json({ error: "Video generation not yet implemented on backend" });
    }
  } catch (error: any) {
    console.error("Generation error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

async function generateImage(params: any) {
  const prompt = generateImagePrompt(params);

  const models = ["gemini-2.5-flash-image", "gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-flash-latest", "gemini-1.5-flash-8b"];
  let lastError = null;

  for (const modelName of models) {
    try {
      const parts: any[] = [];
      if (params.customMedia) {
        const matches = params.customMedia.match(/^data:([^;]+);base64,(.+)$/);
        parts.push({ inlineData: { data: matches[2], mimeType: matches[1] } });
      }
      parts.push({ text: prompt });

      // Using the direct SDK call pattern verified earlier
      const result = await (genAI as any).models.generateContent({
        model: modelName,
        contents: [{ role: "user", parts }]
      });

      const response = result.response;
      if (!response) {
          console.warn(`Model ${modelName} returned no response.`);
          continue;
      }
      const candidates = response.candidates || [];
      const imagePart = candidates[0]?.content?.parts?.find((p: any) => p.inlineData);

      if (imagePart?.inlineData) {
        return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
      }
    } catch (err: any) {
      console.warn(`Failed with ${modelName}:`, err.message);
      lastError = err;
    }
  }
  throw lastError || new Error("All models failed");
}

app.listen(port, () => {
  console.log(`Backend server listening on port ${port}`);
});
