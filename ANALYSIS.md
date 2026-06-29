# Analyse du Projet Mapendo

## Présentation
Mapendo est une application web conçue pour générer des déclarations d'amour personnalisées (images et bientôt vidéos) en utilisant l'IA (Google Gemini/Imagen). L'application permet aux utilisateurs de personnaliser le destinataire, l'expéditeur, le message, le thème visuel, le style artistique et la police d'écriture.

## Stack Technique

### Frontend
- **Framework :** React 19
- **Build Tool :** Vite 6
- **Langage :** TypeScript
- **Stylisation :** Tailwind CSS 4 (utilisant la directive `@theme` pour les couleurs et polices personnalisées)
- **Animations :** Motion (framer-motion)
- **Icônes :** Lucide-React
- **Rendu Markdown :** React-Markdown (pour les messages générés)

### Backend (Serverless)
- **Plateforme :** Vercel Serverless Functions
- **Framework :** Express (utilisé au sein de la fonction serverless)
- **IA :** `@google/genai` (SDK Google Generative AI)
- **Journalisation :** Pino
- **Sécurité :** `express-rate-limit` pour limiter les abus sur l'API

## Architecture

L'application suit une architecture client-serveur moderne :
1. **Frontend (Vite) :** Gère l'interface utilisateur, la sélection des paramètres de génération et la prévisualisation des résultats.
2. **Backend (Vercel Function - `/api/generate`) :**
   - Valide les entrées utilisateur.
   - Construit les prompts pour l'IA.
   - Communique avec les modèles Google Gemini/Imagen de manière sécurisée (clé API cachée côté serveur).
   - Implémente une stratégie de repli (fallback) entre les modèles (`imagen-3.0-generate-001` -> `imagen-3.0-fast-001` -> `gemini-2.0-flash`).
3. **Services :** Le `gemini.service.ts` côté frontend fait office de pont avec l'API backend.

## Stratégie de Monétisation

Mapendo utilise un modèle hybride :
- **Gratuit :** Les utilisateurs peuvent générer du contenu gratuitement s'ils sont "Premium" ou s'ils partagent l'application (simulé via le localStorage).
- **Premium :** Deux plans d'abonnement (Mensuel et Annuel) offrant un accès illimité et des fonctionnalités avancées.
- **Paiement à l'acte :** Possibilité d'acheter une photo ou une vidéo unique avec un système de réduction dynamique :
  - -30% si l'utilisateur fournit sa propre image.
  - -20% si l'utilisateur fournit son propre texte long (> 20 caractères).
- **Support Multi-Régions :** Gestion des prix en EUR, USD, XAF, XOF, MAD, et CAD avec des taux de conversion spécifiques.

## Dette Technique et Améliorations Futures

1. **Génération Vidéo :** L'implémentation est fonctionnelle via les modèles Google Veo 2.0 (`veo-2.0-generate-001`). Cependant, le polling synchrone dans une fonction serverless présente un risque de timeout pour les vidéos longues.
2. **Paiements :** Le processus de paiement est actuellement une simulation frontend. Une intégration réelle avec un processeur de paiement (Stripe, CinetPay, etc.) est nécessaire.
3. **Stockage :** Les images générées sont renvoyées sous forme de base64. Pour une mise à l'échelle, un stockage cloud (AWS S3, Vercel Blob) serait préférable.
4. **Authentification :** Le statut Premium est stocké uniquement dans le `localStorage`, ce qui n'est pas sécurisé pour une application de production.
5. **Tests :** La couverture des tests est basique (validation d'API et rendu de Header). Des tests d'intégration complets pour le flux de génération seraient bénéfiques.
