import { useState, useEffect } from "react";
import { geminiService } from "../services/gemini.service";
import { GenerationParams } from "../utils/types";
import { LOADING_MESSAGES } from "../utils/constants";

export const useGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: any;
    if (isGenerating) {
      interval = setInterval(() => {
        setLoadingMessage(prev => {
          const currentIndex = LOADING_MESSAGES.indexOf(prev);
          return LOADING_MESSAGES[(currentIndex + 1) % LOADING_MESSAGES.length];
        });
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const generate = async (params: GenerationParams) => {
    setIsGenerating(true);
    setError(null);
    setResultUrl(null);

    const result = await geminiService.generate(params);

    if (result.error) {
      setError(result.error);
    } else if (result.url) {
      setResultUrl(result.url);
    } else {
      setError("An unexpected error occurred.");
    }

    setIsGenerating(false);
  };

  return {
    isGenerating,
    loadingMessage,
    resultUrl,
    error,
    generate,
    setResultUrl
  };
};
