import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Heart, 
  Sparkles, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Send, 
  Download, 
  RefreshCw, 
  Lock,
  ChevronRight,
  User,
  MessageSquare,
  Palette,
  Upload,
  X,
  Share2,
  Gift,
  Quote,
  CreditCard,
  Check,
  Zap
} from "lucide-react";
import { GoogleGenAI } from "@google/genai";
import { generateLoveImage, generateLoveVideo } from "./lib/gemini";
import PaymentPage from "./components/PaymentPage";
import { POEMS_BANK, CATEGORIES, getDailyPoem } from "./data/poems";

// --- Types ---
type GenerationType = "image" | "video";

interface GenerationParams {
  sender: string;
  receiver: string;
  message: string;
  theme: string;
  style: string;
  font: string;
  type: GenerationType;
  customMedia?: string;
}

// --- Constants ---
const THEMES = [
  { id: "nuit-etoilee", label: "Nuit Étoilée", icon: "✨" },
  { id: "jardin-roses", label: "Jardin de Roses", icon: "🌹" },
  { id: "plage-crepuscule", label: "Plage au Crépuscule", icon: "🌅" },
  { id: "cafe-parisien", label: "Café Parisien", icon: "☕" },
  { id: "foret-enchantee", label: "Forêt Enchantée", icon: "🌲" },
];

const STYLES = [
  { id: "realiste", label: "Réaliste", icon: "📸" },
  { id: "aquarelle", label: "Aquarelle", icon: "🎨" },
  { id: "peinture-huile", label: "Peinture à l'huile", icon: "🖼️" },
  { id: "anime", label: "Anime / Manga", icon: "🎌" },
  { id: "3d-render", label: "Rendu 3D", icon: "🧊" },
  { id: "sketch", label: "Croquis", icon: "✏️" },
];

const FONTS = [
  { id: "playfair", label: "Classique (Playfair)", fontClass: "font-display" },
  { id: "cormorant", label: "Élégant (Cormorant)", fontClass: "font-serif" },
  { id: "great-vibes", label: "Romantique (Script)", fontClass: "font-script" },
  { id: "inter", label: "Moderne (Inter)", fontClass: "font-sans" },
];

const LOADING_MESSAGES = [
  "Préparation de votre déclaration d'amour...",
  "Capture de l'essence de vos sentiments...",
  "Ajout d'une touche de magie romantique...",
  "Peinture de vos émotions...",
  "Finalisation de votre chef-d'œuvre...",
];

// --- Components ---

export default function App() {
  const [params, setParams] = useState<GenerationParams>({
    sender: "",
    receiver: "",
    message: "",
    theme: THEMES[0].id,
    style: STYLES[0].id,
    font: FONTS[0].id,
    type: "image",
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [hasSharedToday, setHasSharedToday] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("passion");
  const [showPoemModal, setShowPoemModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [view, setView] = useState<"app" | "payment">("app");
  const [customMediaPreview, setCustomMediaPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check for API key and handle daily quota
  useEffect(() => {
    const checkKey = async () => {
      if ((window as any).aistudio?.hasSelectedApiKey) {
        const selected = await (window as any).aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      } else {
        setHasApiKey(true);
      }
    };
    checkKey();

    // Sharing Logic
    const today = new Date().toDateString();
    const sharedDate = localStorage.getItem("mapendo_shared_date");
    const premiumStatus = localStorage.getItem("mapendo_is_premium") === "true";
    
    if (sharedDate === today) {
      setHasSharedToday(true);
    }
    if (premiumStatus) {
      setIsPremium(true);
    }
  }, []);

  // Cycle loading messages
  useEffect(() => {
    if (isGenerating) {
      const interval = setInterval(() => {
        setLoadingMessage(prev => {
          const currentIndex = LOADING_MESSAGES.indexOf(prev);
          return LOADING_MESSAGES[(currentIndex + 1) % LOADING_MESSAGES.length];
        });
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isGenerating]);

  const handleOpenKeySelector = async () => {
    if ((window as any).aistudio?.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setCustomMediaPreview(base64);
        setParams({ ...params, customMedia: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeCustomMedia = () => {
    setCustomMediaPreview(null);
    setParams({ ...params, customMedia: undefined });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleShare = () => {
    try {
      const url = window.location.href;
      navigator.clipboard.writeText(url);

      const today = new Date().toDateString();
      localStorage.setItem("mapendo_shared_date", today);
      setHasSharedToday(true);
      setError(null);
    } catch (err) {
      console.error("Share failed:", err);
      const today = new Date().toDateString();
      setHasSharedToday(true);
    }
  };

  const handleGenerate = async () => {
    if (!params.sender || !params.receiver || !params.message) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    // Logic for free vs paid
    // Generations are free if the user has shared the app today OR is Premium
    const isFreeGeneration = hasSharedToday || isPremium;

    if (!isFreeGeneration) {
      setShowPaymentModal(true);
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResultUrl(null);

    try {
      // Priority: 1. window.aistudio (if available), 2. process.env
      let apiKey = process.env.GEMINI_API_KEY;

      if ((window as any).aistudio?.getSelectedApiKey) {
        try {
          const platformKey = await (window as any).aistudio.getSelectedApiKey();
          if (platformKey) apiKey = platformKey;
        } catch (e) {
          console.warn("Failed to get key from platform:", e);
        }
      }

      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "undefined" || apiKey === "") {
        console.warn("Gemini API key is missing or placeholder:", apiKey);
        if (!hasApiKey) {
          setError("La clé API Gemini est manquante. Veuillez configurer votre clé dans le panneau Secrets d'AI Studio.");
          setIsGenerating(false);
          return;
        }
      }

      const ai = new GoogleGenAI({ apiKey: apiKey || "" });

      let url: string | null = null;
      if (params.type === "image") {
        url = await generateLoveImage(ai, params, apiKey || "");
      } else {
        url = await generateLoveVideo(ai, params, apiKey || "");
      }

      if (url) {
        setResultUrl(url);
      } else {
        setError("La génération a échoué. Veuillez réessayer.");
      }
    } catch (err: any) {
      console.error("Generation error details:", err);
      if (err.message?.includes("Requested entity was not found") || err.message?.includes("404")) {
        setError("Modèle ou ressource non trouvée (404). Vérifiez la configuration de votre projet.");
      } else if (err.message?.includes("API key") || err.message?.includes("auth") || err.message?.includes("401")) {
        setHasApiKey(false);
        setError("Clé API manquante ou invalide. Veuillez configurer votre clé dans AI Studio.");
      } else if (err.message?.includes("quota") || err.message?.includes("429")) {
        setError("Quota dépassé. Veuillez réessayer plus tard ou utiliser une autre clé.");
      } else {
        setError(`Une erreur est survenue : ${err.message || "Erreur inconnue"}`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const link = document.createElement("a");
    link.href = resultUrl;
    link.download = `mapendo-declaration-${Date.now()}.${params.type === "image" ? "png" : "mp4"}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (view === "payment") {
    return (
      <PaymentPage 
        onBack={() => setView("app")} 
        onPaymentSuccess={() => {
          setIsPremium(true);
          localStorage.setItem("mapendo_is_premium", "true");
          setView("app");
        }}
        hasCustomImage={!!params.customMedia}
        hasCustomText={params.message.length > 20}
      />
    );
  }

  return (
    <div className="min-h-screen romantic-gradient flex flex-col items-center py-12 px-4 sm:px-6">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="flex items-center justify-center mb-4">
          <Heart className="text-romantic-red w-10 h-10 fill-romantic-red animate-pulse" />
        </div>
        <h1 className="font-display text-5xl md:text-6xl text-gray-900 mb-2 tracking-tight">
          Mapendo
        </h1>
        <p className="font-serif text-xl text-gray-600 italic">
          Créez des déclarations inoubliables pour ceux que vous aimez.
        </p>
        
        {/* Sharing Bonus Info */}
        <div className="mt-4 inline-flex flex-col items-center gap-2">
          {isPremium ? (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-romantic-gold/10 backdrop-blur-sm rounded-full border border-romantic-gold/30 text-romantic-gold font-bold text-sm">
              <Zap size={14} fill="currentColor" />
              Accès Premium Illimité Activé
            </div>
          ) : !hasSharedToday ? (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/50 backdrop-blur-sm rounded-full border border-romantic-pink/30 text-romantic-red font-medium text-sm animate-pulse">
              <Gift size={14} />
              Partagez pour débloquer la gratuité sur vos photos !
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-50 backdrop-blur-sm rounded-full border border-green-200 text-green-600 font-medium text-sm">
              <Check size={14} />
              Gratuité activée pour vos photos personnelles
            </div>
          )}
        </div>
      </motion.header>

      <main className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Section */}
        <motion.section 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-7 glass-card p-8 rounded-3xl"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl flex items-center gap-2">
              <Sparkles className="text-romantic-gold w-5 h-5" />
              Personnalisation
            </h2>
            <button 
              onClick={() => setShowPoemModal(true)}
              className="text-xs font-semibold text-romantic-red hover:underline flex items-center gap-1"
            >
              <Quote size={12} /> Besoin d'inspiration ?
            </button>
          </div>

          <div className="space-y-6">
            {/* Type Selection */}
            <div className="flex p-1 bg-gray-100 rounded-xl">
              <button
                onClick={() => setParams({ ...params, type: "image" })}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
                  params.type === "image" ? "bg-white shadow-sm text-romantic-red" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <ImageIcon size={18} />
                <span>Photo</span>
              </button>
              <button
                onClick={() => setParams({ ...params, type: "video" })}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
                  params.type === "video" ? "bg-white shadow-sm text-romantic-red" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <VideoIcon size={18} />
                <span>Vidéo</span>
              </button>
            </div>

            {/* Names */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                  <User size={12} /> De la part de
                </label>
                <input
                  type="text"
                  placeholder="Votre nom"
                  value={params.sender}
                  onChange={(e) => setParams({ ...params, sender: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-romantic-pink focus:border-transparent outline-none transition-all bg-white/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                  <User size={12} /> Pour
                </label>
                <input
                  type="text"
                  placeholder="Son nom"
                  value={params.receiver}
                  onChange={(e) => setParams({ ...params, receiver: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-romantic-pink focus:border-transparent outline-none transition-all bg-white/50"
                />
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                <MessageSquare size={12} /> Votre Message
              </label>
              <textarea
                placeholder="Ex: Je t'aime plus que tout au monde..."
                rows={3}
                value={params.message}
                onChange={(e) => setParams({ ...params, message: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-romantic-pink focus:border-transparent outline-none transition-all bg-white/50 resize-none"
              />
            </div>

            {/* Custom Media Upload */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                <Upload size={12} /> Votre Photo/Vidéo comme thème (Optionnel)
              </label>
              {!customMediaPreview ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-romantic-pink transition-colors bg-white/30"
                >
                  <Upload className="text-gray-400" size={24} />
                  <span className="text-sm text-gray-500">Cliquez pour ajouter un média de référence</span>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden aspect-video bg-black/5">
                  <img src={customMediaPreview} className="w-full h-full object-contain" alt="Preview" />
                  <button 
                    onClick={removeCustomMedia}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Theme Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                <Palette size={12} /> Thème Visuel
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setParams({ ...params, theme: t.id })}
                    className={`px-3 py-2 rounded-xl border text-sm transition-all flex items-center gap-2 ${
                      params.theme === t.id 
                        ? "border-romantic-red bg-romantic-red/10 text-romantic-red" 
                        : "border-gray-200 bg-white/50 text-gray-600 hover:border-romantic-pink"
                    }`}
                  >
                    <span>{t.icon}</span>
                    <span className="truncate">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Style Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                <ImageIcon size={12} /> Style Artistique
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {STYLES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setParams({ ...params, style: s.id })}
                    className={`px-3 py-2 rounded-xl border text-sm transition-all flex items-center gap-2 ${
                      params.style === s.id 
                        ? "border-romantic-red bg-romantic-red/10 text-romantic-red" 
                        : "border-gray-200 bg-white/50 text-gray-600 hover:border-romantic-pink"
                    }`}
                  >
                    <span>{s.icon}</span>
                    <span className="truncate">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Font Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                <Quote size={12} /> Police d'écriture
              </label>
              <div className="grid grid-cols-2 gap-2">
                {FONTS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setParams({ ...params, font: f.id })}
                    className={`px-3 py-2 rounded-xl border text-sm transition-all text-left ${
                      params.font === f.id 
                        ? "border-romantic-red bg-romantic-red/10 text-romantic-red" 
                        : "border-gray-200 bg-white/50 text-gray-600 hover:border-romantic-pink"
                    }`}
                  >
                    <span className={f.fontClass}>{f.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* API Key Warning for Video */}
            {params.type === "video" && !hasApiKey && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col gap-3"
              >
                <div className="flex items-start gap-3">
                  <Lock className="text-amber-600 w-5 h-5 mt-0.5 shrink-0" />
                  <p className="text-sm text-amber-800">
                    La génération de vidéo nécessite une clé API payante configurée dans AI Studio.
                  </p>
                </div>
                <button
                  onClick={handleOpenKeySelector}
                  className="w-full py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
                >
                  Sélectionner une clé API
                </button>
              </motion.div>
            )}

            {/* Error Message */}
            {error && (
              <p className="text-red-500 text-sm text-center font-medium">{error}</p>
            )}

            {/* Action Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`w-full py-4 rounded-2xl font-display text-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl active:scale-95 ${
                isGenerating 
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed" 
                  : "bg-romantic-red text-white hover:bg-red-600"
              }`}
            >
              {isGenerating ? (
                <RefreshCw className="animate-spin" />
              ) : (
                <>
                  <Send size={20} />
                  <span>Générer ma Déclaration</span>
                </>
              )}
            </button>
          </div>
        </motion.section>

        {/* Result Section */}
        <motion.section 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-5 flex flex-col gap-6"
        >
          <div className="glass-card rounded-3xl overflow-hidden aspect-[4/5] flex items-center justify-center relative group">
            <AnimatePresence mode="wait">
              {isGenerating ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-6 p-8 text-center"
                >
                  <div className="relative">
                    <Heart className="text-romantic-red w-16 h-16 fill-romantic-red animate-ping absolute opacity-20" />
                    <Heart className="text-romantic-red w-16 h-16 fill-romantic-red relative" />
                  </div>
                  <p className="font-serif text-xl italic text-gray-600 animate-pulse">
                    {loadingMessage}
                  </p>
                </motion.div>
              ) : resultUrl ? (
                <motion.div 
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full h-full"
                >
                  {params.type === "image" ? (
                    <img 
                      src={resultUrl} 
                      alt="Votre déclaration d'amour" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <video 
                      src={resultUrl} 
                      autoPlay 
                      loop 
                      muted 
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  )}
                  
                  {/* Overlay Controls */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button
                      onClick={handleDownload}
                      className="p-4 bg-white rounded-full text-romantic-red hover:scale-110 transition-transform shadow-lg"
                      title="Télécharger"
                    >
                      <Download size={24} />
                    </button>
                    <button
                      onClick={handleGenerate}
                      className="p-4 bg-white rounded-full text-gray-800 hover:scale-110 transition-transform shadow-lg"
                      title="Régénérer"
                    >
                      <RefreshCw size={24} />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="text-center p-12 space-y-4">
                  <div className="w-20 h-20 bg-romantic-pink/10 rounded-full flex items-center justify-center mx-auto">
                    <Heart className="text-romantic-pink w-10 h-10" />
                  </div>
                  <p className="text-gray-400 font-serif italic">
                    Votre création apparaîtra ici...
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Referral / Share Section */}
          <div className="glass-card p-6 rounded-3xl bg-romantic-pink/5 border-romantic-pink/20">
            <h3 className="font-display text-lg mb-3 flex items-center gap-2">
              <Share2 className="text-romantic-red w-4 h-4" />
              {hasSharedToday ? "Merci du partage !" : "Une déclaration de plus ?"}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {hasSharedToday 
                ? "Vous avez débloqué la gratuité pour vos photos personnelles aujourd'hui. Merci du soutien !" 
                : "Partagez Mapendo avec vos amis et débloquez instantanément la gratuité pour les générations basées sur vos propres photos !"}
            </p>
            <div className="space-y-3">
              {!isPremium && (
                <>
                  <button 
                    onClick={handleShare}
                    disabled={hasSharedToday}
                    className={`w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                      hasSharedToday 
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200" 
                        : "bg-white border border-romantic-pink text-romantic-red hover:bg-romantic-pink/10"
                    }`}
                  >
                    <Share2 size={16} /> {hasSharedToday ? "Lien déjà partagé" : "Partager le lien"}
                  </button>
                  <button 
                    onClick={() => setView("payment")}
                    className="w-full py-3 bg-white border border-romantic-pink text-romantic-red rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-romantic-pink/10 transition-colors"
                  >
                    <CreditCard size={16} /> Voir les tarifs Premium
                  </button>
                </>
              )}
              {isPremium && (
                <div className="p-4 bg-romantic-gold/5 border border-romantic-gold/20 rounded-2xl text-center">
                  <p className="text-romantic-gold font-bold text-sm flex items-center justify-center gap-2">
                    <Zap size={14} fill="currentColor" /> Membre Premium
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Tips / Social Media Info */}
          <div className="glass-card p-6 rounded-3xl">
            <h3 className="font-display text-lg mb-3 flex items-center gap-2">
              <Sparkles className="text-romantic-gold w-4 h-4" />
              Conseils de partage
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <ChevronRight size={14} className="text-romantic-red" />
                Les photos sont au format 1:1, parfaites pour Instagram.
              </li>
              <li className="flex items-center gap-2">
                <ChevronRight size={14} className="text-romantic-red" />
                Les vidéos sont au format 9:16, idéales pour vos Stories et Reels.
              </li>
            </ul>
          </div>
        </motion.section>
      </main>

      {/* Poem Modal */}
      <AnimatePresence>
        {showPoemModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowPoemModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl overflow-hidden relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowPoemModal(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
              
              <h2 className="font-display text-2xl mb-4 text-romantic-red">Inspiration Amoureuse</h2>
              
              <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                      activeCategory === cat.id 
                        ? "bg-romantic-red text-white" 
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>

              <div className="p-4 bg-romantic-gold/5 border border-romantic-gold/20 rounded-2xl mb-6">
                <p className="text-[10px] font-bold text-romantic-gold uppercase mb-2">Poème du Jour ✨</p>
                <p className="font-serif italic text-gray-800 text-sm">"{getDailyPoem().text}"</p>
                <button 
                   onClick={() => {
                    setParams({ ...params, message: getDailyPoem().text });
                    setShowPoemModal(false);
                  }}
                  className="mt-2 text-xs font-bold text-romantic-red hover:underline"
                >
                  Utiliser ce texte
                </button>
              </div>

              <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {POEMS_BANK.filter(p => p.category === activeCategory).map((poem, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setParams({ ...params, message: poem.text });
                      setShowPoemModal(false);
                    }}
                    className="w-full p-4 text-left rounded-2xl border border-gray-100 hover:border-romantic-pink hover:bg-romantic-pink/5 transition-all group"
                  >
                    <p className="font-serif italic text-gray-700 leading-relaxed group-hover:text-romantic-red">
                      "{poem.text}"
                    </p>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowPaymentModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
              
              <div className="w-20 h-20 bg-romantic-red/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="text-romantic-red w-10 h-10" />
              </div>
              
              <h2 className="font-display text-2xl mb-4 text-gray-900">Génération Premium</h2>
              <p className="text-gray-600 mb-8">
                Toutes les images générées par IA sont désormais réservées aux membres Premium. 
                Passez à la version Premium pour créer votre déclaration !
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setView("payment");
                  }}
                  className="w-full py-4 bg-romantic-red text-white rounded-2xl font-bold shadow-lg hover:bg-red-600 transition-all block text-center"
                >
                  Débloquer l'accès illimité (2.99€)
                </button>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="w-full py-3 text-gray-500 font-medium hover:text-gray-700 transition-colors"
                >
                  Peut-être plus tard
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Footer */}
      <footer className="mt-16 text-center text-gray-400 text-sm font-serif italic">
        Fait avec amour par Mapendo &bull; 2026
      </footer>
    </div>
  );
}
