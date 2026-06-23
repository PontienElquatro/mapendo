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

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || `Error ${response.status}: Generation failed`);
        }
        return data;
      } else {
        const text = await response.text();
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${text || "Unknown error"}`);
        }
        throw new Error("Invalid response format from server");
      }
    } catch (error: any) {
      console.error("Gemini service error:", error);
      return { error: error.message || "Network error" };
    }
  },
};
