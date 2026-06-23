import { Share2, CreditCard, Zap, Sparkles, ChevronRight } from "lucide-react";

interface SocialSectionProps {
  hasSharedToday: boolean;
  isPremium: boolean;
  onShare: () => void;
  onViewPremium: () => void;
}

export const SocialSection = ({ hasSharedToday, isPremium, onShare, onViewPremium }: SocialSectionProps) => (
  <>
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
              onClick={onShare}
              disabled={hasSharedToday}
              className={`w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                hasSharedToday
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                  : "bg-white border border-romantic-pink text-romantic-red hover:bg-romantic-pink/10"
              }`}
              aria-label="Partager le lien de l'application"
            >
              <Share2 size={16} /> {hasSharedToday ? "Lien déjà partagé" : "Partager le lien"}
            </button>
            <button
              onClick={onViewPremium}
              className="w-full py-3 bg-white border border-romantic-pink text-romantic-red rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-romantic-pink/10 transition-colors"
              aria-label="Voir les offres premium"
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

    <div className="glass-card p-6 rounded-3xl">
      <h3 className="font-display text-lg mb-3 flex items-center gap-2">
        <Sparkles className="text-romantic-gold w-4 h-4" />
        Conseils de partage
      </h3>
      <ul className="space-y-2 text-sm text-gray-600">
        <li className="flex items-center gap-2">
          <ChevronRight size={14} className="text-romantic-red" aria-hidden="true" />
          Les photos sont au format 1:1, parfaites pour Instagram.
        </li>
        <li className="flex items-center gap-2">
          <ChevronRight size={14} className="text-romantic-red" aria-hidden="true" />
          Les vidéos sont au format 9:16, idéales pour vos Stories et Reels.
        </li>
      </ul>
    </div>
  </>
);
