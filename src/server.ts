import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { GenerationParams } from './lib/gemini';
import fetch from 'node-fetch';

dotenv.config();
dotenv.config({ path: '.env.local' });

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json({ limit: '10mb' }));

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('GEMINI_API_KEY is not set in environment variables');
}
const genAI = new GoogleGenAI({ apiKey: apiKey || '' });

app.post('/api/generate-image', async (req, res) => {
  try {
    const params: GenerationParams = req.body;

    let prompt = `Génère une image romantique de haute qualité pour une déclaration d'amour.
    Thème: ${params.theme}.
    Style artistique: ${params.style}.
    Police d'écriture suggérée pour l'ambiance: ${params.font}.
    Contexte: Une scène romantique montrant ${params.receiver} et ${params.sender}.
    Message à inclure visuellement ou suggérer: "${params.message}".
    Ambiance: Chaleureuse, émotionnelle.
    Format: Carré (1:1), idéal pour Instagram.`;

    const parts: any[] = [];
    if (params.customMedia) {
      const base64Data = params.customMedia.split(",")[1];
      const mimeType = params.customMedia.split(";")[0].split(":")[1];

      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      });
      prompt += ` UTILISE CETTE IMAGE COMME RÉFÉRENCE VISUELLE. Intègre les personnes ou l'ambiance de cette image dans la nouvelle création romantique tout en respectant le style ${params.style}.`;
    }
    parts.push({ text: prompt });

    const response = await genAI.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: [{ role: "user", parts }],
        config: {
          imageConfig: {
            aspectRatio: "1:1",
          },
        },
    } as any);

    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          return res.json({ url: `data:image/png;base64,${part.inlineData.data}` });
        }
      }
    }

    res.status(500).json({ error: 'Failed to extract image from response' });
  } catch (error: any) {
    console.error('Error in /api/generate-image:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/generate-video', async (req, res) => {
  try {
    const params: GenerationParams = req.body;

    const prompt = `Une vidéo romantique de 5 secondes pour une déclaration d'amour.
    Thème: ${params.theme}.
    Style visuel: ${params.style}.
    Action: Une scène douce et poétique inspirée par les noms ${params.sender} et ${params.receiver}.
    Ambiance: Amour pur, tendresse.
    Format: Portrait (9:16), idéal pour TikTok ou Reels.`;

    const videoParams: any = {
      model: "veo-3.1-lite-generate-preview",
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: "1080p",
        aspectRatio: "9:16",
      },
    };

    if (params.customMedia) {
      const base64Data = params.customMedia.split(",")[1];
      const mimeType = params.customMedia.split(";")[0].split(":")[1];

      videoParams.image = {
        imageBytes: base64Data,
        mimeType: mimeType,
      };
      videoParams.prompt += ` Utilise l'image fournie comme point de départ ou référence visuelle pour la vidéo en appliquant un style ${params.style}.`;
    }

    let operation = await genAI.models.generateVideos(videoParams);

    const MAX_RETRIES = 24;
    let retries = 0;

    while (!operation.done && retries < MAX_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      operation = await genAI.operations.getVideosOperation({ operation: operation });
      retries++;
    }

    if (!operation.done) {
      return res.status(408).json({ error: "Video generation timed out." });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) return res.status(500).json({ error: "No video URI in response" });

    const response = await fetch(downloadLink, {
      method: "GET",
      headers: {
        "x-goog-api-key": apiKey || '',
      },
    });

    if (!response.ok) {
        return res.status(500).json({ error: `Failed to fetch video from Google: ${response.statusText}` });
    }

    const buffer = await response.arrayBuffer();
    const base64Video = Buffer.from(buffer).toString('base64');

    res.json({ url: `data:video/mp4;base64,${base64Video}` });
  } catch (error: any) {
    console.error('Error in /api/generate-video:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
