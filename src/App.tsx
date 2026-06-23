import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Sparkles, Send, RefreshCw, Quote } from "lucide-react";

import { Header } from "./components/Header";
import { TypeSelector } from "./components/TypeSelector";
import { NameInputs } from "./components/NameInputs";
import { MessageInput } from "./components/MessageInput";
import { UploadZone } from "./components/UploadZone";
import { SelectorGrid } from "./components/SelectorGrid";
import { ResultPreview } from "./components/ResultPreview";
import { SocialSection } from "./components/SocialSection";
import { PoemModal } from "./components/Modals/PoemModal";
import { PaymentModal } from "./components/Modals/PaymentModal";
import PaymentPage from "./components/PaymentPage";

import { useGeneration } from "./hooks/useGeneration";
import { GenerationParams } from "./utils/types";
import { THEMES, STYLES, FONTS } from "./utils/constants";
import { Palette, Image as ImageIcon } from "lucide-react";

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

  const [hasSharedToday, setHasSharedToday] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [showPoemModal, setShowPoemModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [view, setView] = useState<"app" | "payment">("app");

  const { isGenerating, loadingMessage, resultUrl, error, generate, setResultUrl } = useGeneration();

  useEffect(() => {
    const today = new Date().toDateString();
    const sharedDate = localStorage.getItem("mapendo_shared_date");
    const premiumStatus = localStorage.getItem("mapendo_is_premium") === "true";
    
    if (sharedDate === today) setHasSharedToday(true);
    if (premiumStatus) setIsPremium(true);
  }, []);

  const handleGenerate = async () => {
    if (!params.sender || !params.receiver || !params.message) {
      alert("Veuillez remplir tous les champs.");
      return;
    }

    if (!hasSharedToday && !isPremium) {
      setShowPaymentModal(true);
      return;
    }

    await generate(params);
  };

  const handleShare = () => {
    try {
      const url = window.location.href;
      navigator.clipboard.writeText(url);
      localStorage.setItem("mapendo_shared_date", new Date().toDateString());
      setHasSharedToday(true);
    } catch (err) {
      console.error("Share failed:", err);
      setHasSharedToday(true);
    }
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const link = document.createElement("a");
    link.href = resultUrl;
    link.download = `mapendo-${Date.now()}.${params.type === "image" ? "png" : "mp4"}`;
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
      <Header isPremium={isPremium} hasSharedToday={hasSharedToday} />

      <main className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8">
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
            <TypeSelector type={params.type} onChange={(type) => setParams({ ...params, type })} />

            <NameInputs
              sender={params.sender}
              receiver={params.receiver}
              onSenderChange={(sender) => setParams({ ...params, sender })}
              onReceiverChange={(receiver) => setParams({ ...params, receiver })}
            />

            <MessageInput
              message={params.message}
              onChange={(message) => setParams({ ...params, message })}
            />

            <UploadZone
              preview={params.customMedia || null}
              onUpload={(base64) => setParams({ ...params, customMedia: base64 })}
              onRemove={() => setParams({ ...params, customMedia: undefined })}
            />

            <SelectorGrid
              label="Thème Visuel"
              icon={Palette}
              options={THEMES}
              selectedId={params.theme}
              onChange={(theme) => setParams({ ...params, theme })}
              columns={3}
            />

            <SelectorGrid
              label="Style Artistique"
              icon={ImageIcon}
              options={STYLES}
              selectedId={params.style}
              onChange={(style) => setParams({ ...params, style })}
              columns={3}
            />

            <SelectorGrid
              label="Police d'écriture"
              icon={Quote}
              options={FONTS}
              selectedId={params.font}
              onChange={(font) => setParams({ ...params, font })}
            />

            {error && (
              <p className="text-red-500 text-sm text-center font-medium bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>
            )}

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`w-full py-4 rounded-2xl font-display text-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl active:scale-95 ${
                isGenerating 
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed" 
                  : "bg-romantic-red text-white hover:bg-red-600"
              }`}
            >
              {isGenerating ? <RefreshCw className="animate-spin" /> : <><Send size={20} /><span>Générer ma Déclaration</span></>}
            </button>
          </div>
        </motion.section>

        <motion.section 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-5 flex flex-col gap-6"
        >
          <ResultPreview
            isGenerating={isGenerating}
            loadingMessage={loadingMessage}
            resultUrl={resultUrl}
            type={params.type}
            onDownload={handleDownload}
            onRegenerate={handleGenerate}
          />

          <SocialSection
            hasSharedToday={hasSharedToday}
            isPremium={isPremium}
            onShare={handleShare}
            onViewPremium={() => setView("payment")}
          />
        </motion.section>
      </main>

      <PoemModal
        isOpen={showPoemModal}
        onClose={() => setShowPoemModal(false)}
        onSelect={(text) => { setParams({ ...params, message: text }); setShowPoemModal(false); }}
      />

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onConfirm={() => { setShowPaymentModal(false); setView("payment"); }}
      />

      <footer className="mt-16 text-center text-gray-400 text-sm font-serif italic">
        Fait avec amour par Mapendo &bull; 2026
      </footer>
    </div>
  );
}
