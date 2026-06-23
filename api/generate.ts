import { GoogleGenAI } from "@google/genai";
import express from 'express';

const MAX_MESSAGE_LENGTH = 1000;
const MAX_MEDIA_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Inlined prompt generation to avoid any relative import issues in serverless bundle
function generateImagePrompt(params: any) {
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

app.post('*', async (req, res) => {
  console.log("Processing image generation request...");
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
      console.error("GEMINI_API_KEY is not set in environment");
      return res.status(401).json({ error: "Clé API manquante sur le serveur." });
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

    // Models confirmed by probing and project history
    const models = [
      "gemini-2.5-flash-image",
      "imagen-4.0-generate-001",
      "imagen-3.0-generate-001",
      "gemini-2.0-flash"
    ];

    let lastError = null;

    for (const modelName of models) {
      try {
        console.log(`Attempting model: ${modelName}`);

        // Try generateImages for models with "image" or "imagen" in their name
        if (modelName.includes("image") || modelName.includes("imagen")) {
          try {
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

            const img = result.generatedImages?.[0]?.image;
            if (img?.imageBytes) {
              console.log(`Successfully generated image with ${modelName} via generateImages`);
              return res.status(200).json({
                url: `data:${img.mimeType || "image/png"};base64,${img.imageBytes}`
              });
            }
          } catch (e: any) {
            console.warn(`generateImages failed for ${modelName}: ${e.message}`);
            // If it's a 401/403/400, don't just swallow it, might be relevant
            if (e.status === 401 || e.status === 403 || e.status === 400) throw e;
          }
        }

        // Fallback/Standard method: generateContent (inlineData response)
        const result = await genAI.models.generateContent({
          model: modelName,
          contents: [{ role: "user", parts: [{ text: prompt }] }]
        });

        const imagePart = result.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
        if (imagePart?.inlineData?.data) {
          console.log(`Successfully generated image with ${modelName} via generateContent`);
          return res.status(200).json({
            url: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`
          });
        }

      } catch (err: any) {
        console.warn(`Model ${modelName} attempt failed:`, err.message);
        lastError = err;
        // Don't retry other models if it's an auth or invalid param error
        if (err.status === 401 || err.status === 403 || err.status === 400) break;
      }
    }

    // 5. Final Error Handling
    const finalStatus = lastError?.status || 500;
    let finalMessage = lastError?.message || "Impossible de générer l'image.";

    try {
      const parsed = JSON.parse(finalMessage);
      if (parsed.error?.message) finalMessage = parsed.error.message;
    } catch (e) {}

    return res.status(finalStatus).json({ error: finalMessage });

  } catch (globalError: any) {
    console.error("CRITICAL BACKEND ERROR:", globalError);
    return res.status(500).json({ error: "Une erreur serveur est survenue." });
  }
});

export default app;
