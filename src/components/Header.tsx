import { Heart } from "lucide-react";
import { motion } from "motion/react";
import { Zap, Gift, Check } from "lucide-react";

interface HeaderProps {
  isPremium: boolean;
  hasSharedToday: boolean;
}

export const Header = ({ isPremium, hasSharedToday }: HeaderProps) => (
  <motion.header
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-center mb-12"
  >
    <div className="flex items-center justify-center mb-4">
      <Heart
        className="text-romantic-red w-10 h-10 fill-romantic-red animate-pulse"
        aria-hidden="true"
      />
    </div>
    <h1 className="font-display text-5xl md:text-6xl text-gray-900 mb-2 tracking-tight">
      Mapendo
    </h1>
    <p className="font-serif text-xl text-gray-600 italic">
      Créez des déclarations inoubliables pour ceux que vous aimez.
    </p>

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
);
