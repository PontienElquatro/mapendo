import { motion, AnimatePresence } from "motion/react";
import { Lock, X } from "lucide-react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const PaymentModal = ({ isOpen, onClose, onConfirm }: PaymentModalProps) => (
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
          className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center relative"
          onClick={(e) => e.stopPropagation()}
          role="alertdialog"
          aria-labelledby="payment-title"
          aria-describedby="payment-desc"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>

          <div className="w-20 h-20 bg-romantic-red/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="text-romantic-red w-10 h-10" />
          </div>

          <h2 id="payment-title" className="font-display text-2xl mb-4 text-gray-900">Génération Premium</h2>
          <p id="payment-desc" className="text-gray-600 mb-8">
            Toutes les images générées par IA sont désormais réservées aux membres Premium.
            Passez à la version Premium pour créer votre déclaration !
          </p>

          <div className="space-y-3">
            <button
              onClick={onConfirm}
              className="w-full py-4 bg-romantic-red text-white rounded-2xl font-bold shadow-lg hover:bg-red-600 transition-all block text-center"
            >
              Débloquer l'accès illimité (2.99€)
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 text-gray-500 font-medium hover:text-gray-700 transition-colors"
            >
              Peut-être plus tard
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);
