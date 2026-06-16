export interface PoemCategory {
  id: string;
  label: string;
  icon: string;
}

export const CATEGORIES: PoemCategory[] = [
  { id: "passion", label: "Passionné", icon: "🔥" },
  { id: "doux", label: "Doux & Tendre", icon: "🌸" },
  { id: "poetique", label: "Poétique", icon: "✍️" },
  { id: "court", label: "Court & Percutant", icon: "⚡" },
];

export const POEMS_BANK = [
  {
    text: "Ton amour est le soleil qui illumine mes jours les plus sombres, la boussole qui guide mes pas vers le bonheur.",
    category: "passion"
  },
  {
    text: "Dans le jardin de mon cœur, seule ta présence fait fleurir les roses de l'allégresse.",
    category: "poetique"
  },
  {
    text: "Chaque battement de mon cœur est une lettre d'amour que je t'envoie, un écho de mon âme qui ne jure que par toi.",
    category: "passion"
  },
  {
    text: "Si je devais dessiner le bonheur, il aurait tes yeux, ton sourire et la douceur de tes mains dans les miennes.",
    category: "doux"
  },
  {
    text: "Tu es mon refuge, mon horizon, et la plus belle raison que j'ai de remercier le ciel chaque matin.",
    category: "doux"
  },
  {
    text: "T'aimer est ma plus belle évidence, te chérir est ma plus douce mission.",
    category: "court"
  },
  {
    text: "Je t'aime plus qu'hier et bien moins que demain.",
    category: "court"
  },
  {
    text: "Ton regard est un océan de tendresse où j'aime me perdre pour mieux me retrouver.",
    category: "poetique"
  },
  {
    text: "Il n'y a pas assez de mots dans toutes les langues du monde pour décrire l'immensité de ce que je ressens pour toi.",
    category: "passion"
  },
  {
    text: "Tu es la mélodie qui berce mes nuits et la force qui anime mes jours.",
    category: "poetique"
  },
  {
    text: "À tes côtés, chaque seconde devient une éternité de douceur.",
    category: "court"
  },
  {
    text: "Ton nom est le plus beau mot que mes lèvres aient jamais prononcé.",
    category: "doux"
  },
  {
    text: "Dans le labyrinthe de la vie, tu es mon seul fil d'Ariane, ma lumière et ma certitude.",
    category: "poetique"
  },
  {
    text: "Mon amour pour toi ne connaît ni limites, ni fin, juste un éternel recommencement.",
    category: "passion"
  }
];

export const getDailyPoem = () => {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  return POEMS_BANK[dayOfYear % POEMS_BANK.length];
};
