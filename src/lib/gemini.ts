import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

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
  }
) => {
  const parts: any[] = [];
  
  let prompt = `Génère une image romantique de haute qualité pour une déclaration d'amour. 
  Thème: ${params.theme}. 
  Style artistique: ${params.style}.
  Police d'écriture suggérée pour l'ambiance: ${params.font}.
  Contexte: Une scène romantique montrant ${params.receiver} et ${params.sender}. 
  Message à inclure visuellement ou suggérer: "${params.message}". 
  Ambiance: Chaleureuse, émotionnelle. 
  Format: Carré (1:1), idéal pour Instagram.`;

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

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: {
      parts: parts,
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
      },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
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
  }
) => {
  const prompt = `Une vidéo romantique de 5 secondes pour une déclaration d'amour. 
  Thème: ${params.theme}. 
  Style visuel: ${params.style}.
  Action: Une scène douce et poétique inspirée par les noms ${params.sender} et ${params.receiver}. 
  Ambiance: Amour pur, tendresse. 
  Format: Portrait (9:16), idéal pour TikTok ou Reels.`;

  const config: any = {
    numberOfVideos: 1,
    resolution: "1080p",
    aspectRatio: "9:16",
  };

  const videoParams: any = {
    model: "veo-3.1-generate-preview",
    prompt: prompt,
    config: config,
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

  let operation = await ai.models.generateVideos(videoParams);

  while (!operation.done) {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) return null;

  const apiKey = (ai as any).apiKey;
  
  const response = await fetch(downloadLink, {
    method: "GET",
    headers: {
      "x-goog-api-key": apiKey,
    },
  });

  const blob = await response.blob();
  return URL.createObjectURL(blob);
};
