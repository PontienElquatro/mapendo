import { GoogleGenAI } from "@google/genai";

export const getAI = (apiKey: string) => {
  return new GoogleGenAI({ apiKey });
};

export const generateLoveImage = async (
  ai: GoogleGenAI,
  params: {
    sender: string;
    receiver: string;
    message: string;
    theme: string;
    style: string;
    font: string;
    customMedia?: string; // base64 string
  },
  apiKey: string
) => {
  const prompt = `Génère une image romantique de haute qualité pour une déclaration d'amour.
  Thème: ${params.theme}.
  Style artistique: ${params.style}.
  Police d'écriture suggérée pour l'ambiance: ${params.font}.
  Contexte: Une scène romantique montrant ${params.receiver} et ${params.sender}.
  Message à inclure visuellement ou suggérer: "${params.message}".
  Ambiance: Chaleureuse, émotionnelle.
  Format: Carré (1:1), idéal pour Instagram. ${params.customMedia ? "Utilise l'image fournie comme référence visuelle." : ""}`;

  const attempts = [
    { model: "gemini-2.5-flash-image", method: "generateContent" },
    { model: "gemini-2.5-flash", method: "generateContent" },
    { model: "gemini-3.5-flash", method: "generateContent" },
    { model: "gemini-2.0-flash", method: "generateContent" }
  ];

  let lastError: any = null;

  for (const attempt of attempts) {
    try {
      console.log(`Trying image generation with ${attempt.model}...`);
      const parts: any[] = [];
      if (params.customMedia) {
        const base64Data = params.customMedia.split(",")[1];
        const mimeType = params.customMedia.split(";")[0].split(":")[1];
        parts.push({ inlineData: { data: base64Data, mimeType: mimeType } });
      }
      parts.push({ text: prompt });

      const response = await ai.models.generateContent({
        model: attempt.model,
        contents: { parts: parts },
      });

      const imagePart = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
      if (imagePart?.inlineData) {
        return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
      }
    } catch (err: any) {
      console.warn(`Failed with ${attempt.model}:`, err.message);
      lastError = err;
      if (err.message?.includes("API key") || err.message?.includes("auth") || err.message?.includes("401") || err.message?.includes("403")) {
        throw err;
      }
    }
  }

  throw lastError || new Error("Échec de la génération avec tous les modèles disponibles.");
};

export const generateLoveVideo = async (
  ai: GoogleGenAI,
  params: {
    sender: string;
    receiver: string;
    message: string;
    theme: string;
    style: string;
    font: string;
    customMedia?: string; // base64 string
  },
  apiKey: string
) => {
  const prompt = `Une vidéo romantique de 5 secondes pour une déclaration d'amour. 
  Thème: ${params.theme}. 
  Style visuel: ${params.style}.
  Action: Une scène douce et poétique inspirée par les noms ${params.sender} et ${params.receiver}. 
  Ambiance: Amour pur, tendresse. 
  Format: Portrait (9:16), idéal pour TikTok ou Reels.`;

  const models = ["veo-3.1-lite-generate-preview", "veo-3.1-generate-preview"];
  let lastError: any = null;

  for (const modelName of models) {
    try {
      console.log(`Trying video generation with ${modelName}...`);
      const videoParams: any = {
        model: modelName,
        prompt: prompt,
        config: { numberOfVideos: 1, resolution: "1080p", aspectRatio: "9:16" },
      };

      if (params.customMedia) {
        const base64Data = params.customMedia.split(",")[1];
        const mimeType = params.customMedia.split(";")[0].split(":")[1];
        videoParams.image = { imageBytes: base64Data, mimeType: mimeType };
      }

      let operation = await (ai as any).models.generateVideos(videoParams);

      while (!operation.done) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({ operation: (operation as any).name || operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const response = await fetch(downloadLink, {
          method: "GET",
          headers: { "x-goog-api-key": apiKey },
        });
        if (!response.ok) throw new Error(`Erreur lors du téléchargement de la vidéo: ${response.status}`);
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      }
    } catch (err: any) {
      console.warn(`Failed video with ${modelName}:`, err.message);
      lastError = err;
      if (err.message?.includes("API key") || err.message?.includes("auth") || err.message?.includes("401") || err.message?.includes("403")) {
        throw err;
      }
    }
  }

  throw lastError || new Error("Échec de la génération vidéo avec tous les modèles disponibles.");
}
