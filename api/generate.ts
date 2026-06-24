import { GoogleGenAI } from "@google/genai";
import pino from "pino";
import rateLimit from "express-rate-limit";
import express from "express";

const MAX_MESSAGE_LENGTH = 1000;
const MAX_MEDIA_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Inlined prompt generation to avoid relative import issues in serverless.
 * This makes the function autonomous and avoids ERR_MODULE_NOT_FOUND.
 */
function generateImagePrompt(params: any): string {
  return `Génère une image romantique de qualité exceptionnelle pour une déclaration d'amour.

  Détails de la scène :
  - Destinataire : ${params.receiver}
  - Expéditeur : ${params.sender}
  - Thème visuel : ${params.theme}
  - Style artistique : ${params.style}
  - Ambiance suggérée par la police : ${params.font}

  Contenu émotionnel :
  Le message "${params.message}" doit être l'inspiration centrale.
  Capture une atmosphère de tendresse, de passion et de sincérité.

  Directives techniques :
  - Ultra-réaliste avec des détails minutieux
  - Éclairage cinématographique (soft bokeh, golden hour rays)
  - Résolution 4K, composition professionnelle (règle des tiers)
  - Couleurs riches et harmonieuses adaptées au thème ${params.theme}
  - Format carré 1:1 optimisé pour les réseaux sociaux de haute qualité

  ${params.customMedia ? "IMPORTANT : Utilise l'image fournie en référence pour conserver la cohérence visuelle des visages ou de l'environnement." : ""}

  REMARQUE : Ne pas inclure de texte déformé ou illisible. Privilégier la suggestion visuelle du message par l'émotion des personnages et la symbolique du décor.`;
}

const app = express();
app.use(express.json({ limit: '10mb' }));

// Use a catch-all route to be more resilient to Vercel routing
app.post('*', async (req, res) => {
  try {
    const { sender, receiver, message, type, customMedia } = req.body || {};

    // 1. Validation (Matches expected test output)
    if (!sender || !receiver || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ error: "Message too long" });
    }

    // 2. API Key Check
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY environment variable is not set");
      return res.status(401).json({ error: "Clé API Gemini manquante. Veuillez configurer les variables d'environnement." });
    }

    // 3. Media Validation
    if (customMedia) {
      const matches = customMedia.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (matches) {
        const mimeType = matches[1];
        const base64Data = matches[2];
        const size = Buffer.from(base64Data, 'base64').length;

        if (size > MAX_MEDIA_SIZE) {
          return res.status(400).json({ error: "Image trop lourde (max 5Mo)." });
        }
        if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
          return res.status(400).json({ error: "Format d'image non supporté." });
        }
      }
    }

    if (type !== 'image') {
      return res.status(501).json({ error: "Seule la génération d'images est supportée." });
    }

    // 4. Generation Logic
    const genAI = new GoogleGenAI({ apiKey });
    const prompt = generateImagePrompt(req.body);

    // Confirmed models for image generation in @google/genai SDK
    const models = [
      "imagen-3.0-generate-001",
      "imagen-3.0-fast-001",
      "gemini-2.0-flash"
    ];

    let lastError = null;

    for (const modelName of models) {
      try {
        console.log(`Attempting generation with model: ${modelName}`);

        if (modelName.startsWith("imagen-")) {
          // Correct SDK method for Imagen models
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
            return res.status(200).json({ url: `data:${mimeType};base64,${generatedImage.image.imageBytes}` });
          }

          if (generatedImage?.raiFilteredReason) {
            console.warn(`Model ${modelName} filtered content: ${generatedImage.raiFilteredReason}`);
            throw new Error(`Contenu filtré par le modèle.`);
          }
        } else {
          // Multimodal fallback for standard Gemini models
          const parts: any[] = [];
          if (customMedia) {
            const matches = customMedia.match(/^data:([^;]+);base64,(.+)$/);
            if (matches) {
              parts.push({ inlineData: { data: matches[2], mimeType: matches[1] } });
            }
          }
          parts.push({ text: prompt });

          const result = await genAI.models.generateContent({
            model: modelName,
            contents: [{ role: "user", parts }]
          });

          // Check for image bytes in standard content parts
          const imagePart = result.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
          if (imagePart?.inlineData?.data) {
            return res.status(200).json({ url: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}` });
          }

          if (result.text) {
            console.warn(`Model ${modelName} returned text instead of image`);
            throw new Error("Le modèle a retourné du texte au lieu d'une image.");
          }
        }
      } catch (err: any) {
        // Detailed error logging as requested
        console.error({
          model: modelName,
          message: err?.message,
          status: err?.status,
          stack: err?.stack
        });

        lastError = err;
        // Don't retry if it's an auth or client-side bad request
        if (err.status === 401 || err.status === 403 || err.status === 400) break;
      }
    }

    // 5. Final Error Handling
    const finalStatus = lastError?.status || 500;
    let finalMessage = lastError?.message || "Erreur lors de la génération de l'image.";

    // Attempt to extract cleaner message from SDK errors
    try {
      const parsed = JSON.parse(finalMessage);
      if (parsed.error?.message) finalMessage = parsed.error.message;
    } catch (e) {}

    return res.status(finalStatus).json({ error: finalMessage });

  } catch (globalError: any) {
    console.error("CRITICAL BACKEND ERROR:", globalError);
    return res.status(500).json({ error: "Une erreur interne est survenue sur le serveur." });
  }
});

export default app;
