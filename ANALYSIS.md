# Rapport d'Analyse : Projet Mapendo

## 1. Vue d'Ensemble
Mapendo est une application web moderne permettant de générer des déclarations d'amour personnalisées sous forme d'images et de vidéos grâce à l'IA de Google (Gemini). L'application cible une utilisation sur les réseaux sociaux avec des formats optimisés (1:1 pour Instagram, 9:16 pour TikTok/Reels).

## 2. Pile Technologique
- **Frontend :** React 19, TypeScript, Tailwind CSS 4, Framer Motion.
- **Icônes :** Lucide React.
- **IA :** Google Generative AI SDK (`@google/genai`).
- **Build Tool :** Vite 6.

## 3. Architecture du Code
- `src/App.tsx` : Gestion de l'état global, formulaire et logique métier.
- `src/lib/gemini.ts` : Couche d'abstraction pour l'API Gemini.
- `src/components/PaymentPage.tsx` : Interface de paiement (simulée).
- `src/data/poems.ts` : Contenu statique pour l'inspiration des utilisateurs.

## 4. Analyse de l'Intégration IA
- **Modèles utilisés :**
  - Image : `gemini-2.5-flash-image`
  - Vidéo : `veo-3.1-lite-generate-preview`
- **Limites identifiées :**
  - Absence de mécanisme de "fallback" vers des modèles plus anciens en cas d'erreur 429 (quota) ou 404.
  - Le prompt pourrait être plus détaillé pour éviter les artefacts visuels.

## 5. Monétisation et Flux Utilisateur
L'application utilise un modèle **Freemium** :
- Accès gratuit débloqué par le partage social (basé sur le `localStorage`).
- Incitation à l'abonnement Premium pour des générations illimitées et des fonctionnalités avancées (vidéos haute résolution).

## 6. Recommandations Techniques
1. **Résilience :** Implémenter une chaîne de secours pour les modèles IA (ex: fallback sur `gemini-2.0-flash` si le 2.5 échoue).
2. **Performance :** Mettre en place du code-splitting pour réduire la taille du bundle initial.
3. **Sécurité :** Consolider la détection des clés API pour assurer la compatibilité totale avec l'environnement AI Studio.
