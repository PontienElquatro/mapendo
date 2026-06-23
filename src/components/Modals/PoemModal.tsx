import { motion, AnimatePresence } from "motion/react";
import { X, Quote } from "lucide-react";
import { CATEGORIES, POEMS_BANK, getDailyPoem } from "../../data/poems";
import { useState } from "react";

interface PoemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (text: string) => void;
}

export const PoemModal = ({ isOpen, onClose, onSelect }: PoemModalProps) => {
  const [activeCategory, setActiveCategory] = useState("passion");

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="poem-title"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600"
              aria-label="Fermer"
            >
              <X size={20} />
            </button>

            <h2 id="poem-title" className="font-display text-2xl mb-4 text-romantic-red">Inspiration Amoureuse</h2>

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
                  aria-pressed={activeCategory === cat.id}
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
                 onClick={() => onSelect(getDailyPoem().text)}
                className="mt-2 text-xs font-bold text-romantic-red hover:underline"
              >
                Utiliser ce texte
              </button>
            </div>

            <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
              {POEMS_BANK.filter(p => p.category === activeCategory).map((poem, i) => (
                <button
                  key={i}
                  onClick={() => onSelect(poem.text)}
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
  );
};
