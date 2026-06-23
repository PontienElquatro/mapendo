import { GenerationParams, GenerationResponse } from "../utils/types";

export const geminiService = {
  generate: async (params: GenerationParams): Promise<GenerationResponse> => {
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Generation failed");
      }
      return data;
    } catch (error: any) {
      console.error("Gemini service error:", error);
      return { error: error.message || "Network error" };
    }
  },
};
