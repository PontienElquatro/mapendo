import { AnimatePresence, motion } from "motion/react";
import { Heart, Download, RefreshCw, ZoomIn } from "lucide-react";
import { useState, useEffect } from "react";

interface ResultPreviewProps {
  isGenerating: boolean;
  loadingMessage: string;
  resultUrl: string | null;
  type: "image" | "video";
  onDownload: () => void;
  onRegenerate: () => void;
}

export const ResultPreview = ({
  isGenerating,
  loadingMessage,
  resultUrl,
  type,
  onDownload,
  onRegenerate
}: ResultPreviewProps) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isGenerating) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress(prev => (prev < 90 ? prev + Math.random() * 10 : prev));
      }, 1000);
    } else {
      setProgress(100);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  return (
    <div className="glass-card rounded-3xl overflow-hidden aspect-[4/5] flex items-center justify-center relative group" role="region" aria-label="Aperçu du résultat">
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
            <div className="w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-romantic-red"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </motion.div>
        ) : resultUrl ? (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full h-full relative"
          >
            {type === "image" ? (
              <img
                src={resultUrl}
                alt="Votre déclaration d'amour"
                className={`w-full h-full object-cover transition-transform duration-500 ${isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'}`}
                onClick={() => setIsZoomed(!isZoomed)}
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
                onClick={(e) => { e.stopPropagation(); onDownload(); }}
                className="p-4 bg-white rounded-full text-romantic-red hover:scale-110 transition-transform shadow-lg"
                title="Télécharger"
                aria-label="Télécharger le résultat"
              >
                <Download size={24} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onRegenerate(); }}
                className="p-4 bg-white rounded-full text-gray-800 hover:scale-110 transition-transform shadow-lg"
                title="Régénérer"
                aria-label="Générer à nouveau"
              >
                <RefreshCw size={24} />
              </button>
              {type === "image" && (
                 <button
                 onClick={(e) => { e.stopPropagation(); setIsZoomed(!isZoomed); }}
                 className="p-4 bg-white rounded-full text-blue-600 hover:scale-110 transition-transform shadow-lg"
                 title="Zoom"
               >
                 <ZoomIn size={24} />
               </button>
              )}
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
  );
};
