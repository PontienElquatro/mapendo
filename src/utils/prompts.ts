import type { GenerationParams } from "./types";

export const generateImagePrompt = (params: GenerationParams) => {
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
};
