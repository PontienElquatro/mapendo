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

    try {
      const result = await geminiService.generate(params);

      if (result.error) {
        // BLOQUANT 6: Robust error handling
        handleServiceError(result.error);
      } else if (result.url) {
        setResultUrl(result.url);
      }
    } catch (err: any) {
      setError("Connexion perdue. Veuillez vérifier votre réseau.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleServiceError = (errMessage: string) => {
    if (errMessage.includes("429") || errMessage.toLowerCase().includes("quota")) {
      setError("Quota atteint. Veuillez réessayer plus tard.");
    } else if (errMessage.includes("503") || errMessage.includes("500")) {
      setError("Service temporairement indisponible.");
    } else if (errMessage.includes("408") || errMessage.toLowerCase().includes("timeout")) {
      setError("La requête a mis trop de temps. Veuillez réessayer.");
    } else if (errMessage.includes("401") || errMessage.includes("403")) {
      setError("Erreur d'authentification. Contactez le support.");
    } else {
      setError("Une erreur est survenue lors de la génération.");
    }
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
