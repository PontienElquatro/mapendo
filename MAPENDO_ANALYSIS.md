# Rapport d'Analyse du Projet Mapendo

## 1. Présentation Générale
**Mapendo** est une application web moderne conçue pour créer des déclarations d'amour personnalisées. Elle utilise l'intelligence artificielle générative de Google (Gemini) pour transformer des textes et des images de référence en créations visuelles (photos et vidéos) romantiques et artistiques.

---

## 2. Pile Technologique (Tech Stack)
L'application repose sur une stack de pointe :
*   **Frontend :** React 19 (dernière version stable) avec TypeScript.
*   **Build Tool :** Vite 6 pour un développement ultra-rapide.
*   **Styles :** Tailwind CSS 4, utilisant la nouvelle directive `@theme`.
*   **Animations :** Framer Motion (`motion/react`).
*   **IA :** SDK `@google/genai` (Google Generative AI).
    *   **Modèles :** `gemini-2.5-flash-image` (images) et `veo-3.1-lite` (vidéos).

---

## 3. Architecture du Code
Le projet est organisé de manière modulaire :
*   **`src/App.tsx` :** Orchestrateur principal (état, formulaires, navigation).
*   **`src/lib/gemini.ts` :** Couche d'abstraction pour l'IA (prompts, polling vidéo).
*   **`src/components/` :** Composants isolés (`PaymentPage.tsx`).
*   **`src/data/` :** Logique métier statique (`poems.ts`).

---

## 4. Analyse du Flux de l'IA
*   **Personnalisation :** Thèmes, styles et polices configurables.
*   **Image-to-Image / Image-to-Video :** Support du téléversement de médias de référence via conversion Base64.
*   **Prompt Engineering :** Structure de prompt rigoureuse pour maintenir une esthétique cohérente.

---

## 5. Points Forts et Points Faibles

### ✅ Points Forts
*   **Interface Soignée :** Design cohérent avec glassmorphism et animations fluides.
*   **Stack Moderne :** Utilisation optimale de React 19 et Tailwind 4.
*   **Expérience Utilisateur :** Flux de création intuitif.

### ⚠️ Points d'Attention
*   **Sécurité (Critique) :** Exposition de la `GEMINI_API_KEY` dans le bundle client.
*   **Architecture :** Absence de backend pour sécuriser les appels API et les paiements.
*   **Paiement :** Simulation côté client uniquement.

---

## 6. Recommandations
1.  **Backend Proxy :** Déplacer les appels API Gemini vers un serveur (Express) pour masquer la clé API.
2.  **Paiement Réel :** Intégration de Stripe ou PayPal.
3.  **Optimisation Médias :** Compression des images avant l'envoi à l'IA.
4.  **Persistance :** Ajout d'une base de données et d'une authentification utilisateur.

---

## 7. Vérification Technique
*   **Compilation TypeScript :** Succès (`tsc --noEmit` OK).
*   **Build Production :** Succès (`vite build` OK).
