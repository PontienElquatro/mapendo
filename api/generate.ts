import { GoogleGenAI, SafetyFilterLevel, PersonGeneration } from "@google/genai";
import express from 'express';
import { rateLimit } from 'express-rate-limit';

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

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10, // Limit each IP to 10 requests per window
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: "Trop de requêtes. Veuillez réessayer dans 15 minutes." }
});

app.use(limiter);

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

    // 2. API Key Check (Env var or headers for dynamic environments like AI Studio)
    const authHeader = req.headers['authorization'] as string;
    const bearerKey = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    const apiKey = process.env.GEMINI_API_KEY ||
                   process.env.GOOGLE_API_KEY ||
                   bearerKey ||
                   req.headers['x-api-key'] as string ||
                   req.headers['x-goog-api-key'] as string;

    if (!apiKey) {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level: "ERROR",
        context: "API_KEY_VALIDATION",
        message: "Authentication failed: No API key found in process.env or headers.",
        availableHeaders: Object.keys(req.headers).filter(h => h.toLowerCase().includes('key') || h.toLowerCase().includes('auth'))
      };
      console.error(JSON.stringify(logEntry));
      return res.status(401).json({
        error: "AUTHENTICATION_REQUIRED",
        message: "Clé API Gemini manquante. Veuillez configurer GEMINI_API_KEY dans les paramètres Vercel."
      });
    }

    // 3. Media Validation
    if (customMedia) {
      // More relaxed regex for data URIs
      const matches = customMedia.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        const mimeType = matches[1];
        const base64Data = matches[2];
        const size = Buffer.from(base64Data, 'base64').length;

        if (size > MAX_MEDIA_SIZE) {
          return res.status(400).json({ error: "Média trop lourd (max 5Mo)." });
        }
        if (type === 'image' && !ALLOWED_MIME_TYPES.includes(mimeType)) {
          return res.status(400).json({ error: "Format d'image non supporté." });
        }
      }
    }

    if (type !== 'image' && type !== 'video') {
      return res.status(400).json({ error: "Type de génération non supporté." });
    }

    // 4. Generation Logic
    const genAI = new GoogleGenAI({ apiKey });
    const prompt = generateImagePrompt(req.body);

    let models: string[] = [];
    if (type === 'video') {
       models = ["veo-2.0-generate-001", "veo-2.0-preview-001"];
    } else {
       models = [
         "gemini-3.1-flash-image-preview",
         "gemini-2.5-flash-image",
         "imagen-4.0-generate-001",
         "imagen-3.0-generate-001",
         "imagen-3.0-fast-001",
         "gemini-2.0-flash",
         "gemini-1.5-flash"
       ];
    }

    let lastError = null;

    for (const modelName of models) {
      try {
        console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          level: "INFO",
          context: "GENERATION_ATTEMPT",
          type,
          model: modelName
        }));

        if (modelName.startsWith("veo-")) {
          // Video generation logic
          const operation = await (genAI.models as any).generateVideos({
            model: modelName,
            prompt: prompt
          });

          // Serverless timeout risk: we check once, but usually videos take longer.
          // In production, this should be handled via a webhook or long-polling.
          // For now, we wait a few seconds as a best effort.
          let result = operation;
          if (!result.done) {
             await new Promise(r => setTimeout(r, 5000));
             result = await (genAI.models as any).get({ name: operation.name });
          }

          const video = result.response?.generatedVideos?.[0];
          if (video?.video?.videoBytes) {
            const mimeType = video.video.mimeType || "video/mp4";
            return res.status(200).json({ url: `data:${mimeType};base64,${video.video.videoBytes}` });
          }
          throw new Error("La génération vidéo est en cours ou a échoué. Veuillez réessayer.");

        } else if (modelName.startsWith("imagen-")) {
          // Correct SDK method for Imagen models
          const result = await genAI.models.generateImages({
            model: modelName,
            prompt: prompt,
            config: {
              numberOfImages: 1,
              aspectRatio: "1:1",
              safetyFilterLevel: SafetyFilterLevel.BLOCK_ONLY_HIGH,
              personGeneration: PersonGeneration.ALLOW_ALL
            }
          });

          const generatedImage = result.generatedImages?.[0];
          if (generatedImage?.image?.imageBytes) {
            const mimeType = generatedImage.image.mimeType || "image/png";
            return res.status(200).json({ url: `data:${mimeType};base64,${generatedImage.image.imageBytes}` });
          }

          if (generatedImage?.raiFilteredReason) {
            console.warn(JSON.stringify({
              timestamp: new Date().toISOString(),
              level: "WARN",
              context: "CONTENT_FILTERED",
              model: modelName,
              reason: generatedImage.raiFilteredReason
            }));
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
            console.warn(JSON.stringify({
              timestamp: new Date().toISOString(),
              level: "WARN",
              context: "UNEXPECTED_RESPONSE_TYPE",
              model: modelName,
              message: "Model returned text instead of image"
            }));
            throw new Error("Le modèle a retourné du texte au lieu d'une image.");
          }
        }
      } catch (err: any) {
        // Detailed error logging as requested
        console.error(JSON.stringify({
          timestamp: new Date().toISOString(),
          level: "ERROR",
          context: "MODEL_GENERATION_FAILED",
          model: modelName,
          message: err?.message,
          status: err?.status,
          stack: err?.stack
        }));

        lastError = err;
        // Don't retry if it's an auth error
        // Note: 400 (Bad Request) is often returned for restricted/unsupported models in specific regions,
        // so we continue the loop to try the next model in the fallback chain.
        if (err.status === 401 || err.status === 403) break;
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
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "FATAL",
      context: "GLOBAL_ERROR_HANDLER",
      message: globalError?.message,
      stack: globalError?.stack
    }));
    return res.status(500).json({
      error: "INTERNAL_SERVER_ERROR",
      message: "Une erreur interne est survenue sur le serveur."
    });
  }
});

export default app;
