import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CreditCard, Check, ArrowLeft, Zap, ShieldCheck, Sparkles, Loader2 } from "lucide-react";

interface PricingPlan {
  id: string;
  name: string;
  price: number; 
  period: string;
  description: string;
  features: string[];
  isPopular?: boolean;
}

interface CurrencyInfo {
  symbol: string;
  rate: number;
  label: string;
}

const REGIONS: Record<string, CurrencyInfo> = {
  EUR: { symbol: "€", rate: 1, label: "Europe (Euro)" },
  USD: { symbol: "$", rate: 1.08, label: "USA / International (USD)" },
  XAF: { symbol: "FCFA", rate: 655.95, label: "Afrique Centrale (XAF)" },
  XOF: { symbol: "FCFA", rate: 655.95, label: "Afrique de l'Ouest (XOF)" },
  MAD: { symbol: "DH", rate: 10.85, label: "Maroc (MAD)" },
  CAD: { symbol: "C$", rate: 1.48, label: "Canada (CAD)" },
};

const SUBSCRIPTIONS: Omit<PricingPlan, 'price'>[] = [
  {
    id: "monthly",
    name: "Abonnement Mensuel",
    period: "/ mois",
    description: "Accès illimité à toutes nos fonctionnalités pour un mois de romance.",
    features: [
      "Images IA Illimitées",
      "20 Vidéos Romantiques / mois",
      "Tous les styles et polices",
      "Support standard",
      "Annulation à tout moment"
    ]
  },
  {
    id: "yearly",
    name: "Abonnement Annuel",
    period: "/ an",
    description: "L'engagement ultime pour les amoureux fidèles. Économisez 33% !",
    features: [
      "Images IA Illimitées",
      "Vidéos Romantiques Illimitées",
      "Priorité de génération ultra-rapide",
      "Support VIP 24/7",
      "Badge Profil 'Amoureux Éternel'",
      "Casting Beta pour nouveaux styles"
    ],
    isPopular: true
  }
];

// Base prices in EUR
const BASE_PRICES = {
  monthly: 9.99,
  yearly: 79.99,
  singleImage: 0.50,
  singleVideo: 2.50
};

interface PaymentPageProps {
  onBack: () => void;
  onPaymentSuccess: () => void;
  hasCustomImage: boolean;
  hasCustomText: boolean;
}

export default function PaymentPage({ onBack, onPaymentSuccess, hasCustomImage, hasCustomText }: PaymentPageProps) {
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [region, setRegion] = useState<string>("EUR");

  const currency = REGIONS[region];

  const formatPrice = (baseVal: number) => {
    const converted = baseVal * currency.rate;
    if (region === "XAF" || region === "XOF") {
       return `${Math.round(converted).toLocaleString()} ${currency.symbol}`;
    }
    return `${converted.toFixed(2)}${currency.symbol}`;
  };

  // Gemini + 50% pricing logic
  const discountMultiplier = (1 - (hasCustomImage ? 0.30 : 0) - (hasCustomText ? 0.20 : 0));
  
  const finalImagePrice = BASE_PRICES.singleImage * discountMultiplier;
  const finalVideoPrice = BASE_PRICES.singleVideo * discountMultiplier;

  const handlePayment = (plan: any) => {
    setSelectedPlan(plan);
  };

  const confirmPayment = () => {
    setIsProcessing(true);
    // Simulate a local payment process
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      setTimeout(() => {
        onPaymentSuccess();
      }, 2000);
    }, 2500);
  };

  return (
    <div className="min-h-screen romantic-gradient py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {!selectedPlan ? (
          <>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <button 
                onClick={onBack}
                className="flex items-center gap-2 text-romantic-red font-medium hover:gap-3 transition-all"
              >
                <ArrowLeft size={20} /> Retour à la création
              </button>

              <div className="flex items-center gap-2 bg-white/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20">
                <span className="text-xs font-bold text-gray-500 uppercase">Région :</span>
                <select 
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="bg-transparent text-sm font-bold text-romantic-red outline-none cursor-pointer"
                >
                  {Object.entries(REGIONS).map(([key, info]) => (
                    <option key={key} value={key}>{info.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-center mb-16">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-display text-4xl md:text-5xl text-gray-900 mb-4"
              >
                Choisissez votre formule <span className="text-romantic-red">Mapendo</span>
              </motion.h1>
              <p className="text-gray-600 max-w-2xl mx-auto font-serif italic text-lg">
                Le paiement s'effectue directement sur cette page de manière sécurisée en <span className="font-bold text-romantic-red">{currency.symbol}</span>.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              {SUBSCRIPTIONS.map((plan, index) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`glass-card rounded-3xl p-8 flex flex-col relative ${
                    plan.isPopular ? "border-romantic-red ring-2 ring-romantic-red/20 scale-105 z-10" : ""
                  }`}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-romantic-red text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 uppercase tracking-tight">
                      <Zap size={12} fill="currentColor" /> Recommandé
                    </div>
                  )}

                  <div className="mb-8">
                    <h3 className="font-display text-2xl mb-2">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-4xl font-bold">
                        {formatPrice(plan.id === 'monthly' ? BASE_PRICES.monthly : BASE_PRICES.yearly)}
                      </span>
                      <span className="text-gray-500 text-sm">{plan.period}</span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {plan.description}
                    </p>
                  </div>

                  <ul className="space-y-4 mb-8 flex-grow">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                        <div className="mt-1 bg-romantic-pink/20 rounded-full p-0.5">
                          <Check size={12} className="text-romantic-red" />
                        </div>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handlePayment({ 
                      name: plan.name, 
                      price: formatPrice(plan.id === 'monthly' ? BASE_PRICES.monthly : BASE_PRICES.yearly)
                    })}
                    className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
                      plan.isPopular 
                        ? "bg-romantic-red text-white shadow-lg hover:bg-red-600 hover:shadow-xl" 
                        : "bg-white border-2 border-romantic-pink text-romantic-red hover:bg-romantic-pink/5"
                    }`}
                  >
                    <CreditCard size={18} />
                    S'abonner
                  </button>
                </motion.div>
              ))}
            </div>

            <div className="text-center mb-8">
              <h2 className="font-display text-3xl mb-4">Ou payez à la création</h2>
              <p className="text-gray-500 italic">Des réductions immédiates si vous fournissez du contenu !</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-card p-8 rounded-3xl border-2 border-dashed border-gray-200"
              >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-display text-xl">Une Photo Unique</h3>
                    <div className="bg-romantic-pink/10 text-romantic-red px-3 py-1 rounded-full text-xs font-bold">
                      GEMINI + 50%
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-3xl font-bold text-gray-900">{formatPrice(finalImagePrice)}</span>
                    <span className="text-sm text-gray-400 line-through">{formatPrice(BASE_PRICES.singleImage)}</span>
                  </div>
                  <ul className="space-y-3 text-sm text-gray-600 mb-8">
                    <li className="flex items-center gap-2">
                       <Check size={14} className={hasCustomImage ? "text-green-500" : "text-gray-300"} />
                       Votre propre photo : {hasCustomImage ? "-30% appliqué" : "-30% possible"}
                    </li>
                    <li className="flex items-center gap-2">
                       <Check size={14} className={hasCustomText ? "text-green-500" : "text-gray-300"} />
                       Votre propre message : {hasCustomText ? "-20% appliqué" : "-20% possible"}
                    </li>
                  </ul>
                  <button 
                    onClick={() => handlePayment({ name: "Photo Unique", price: formatPrice(finalImagePrice) })}
                    className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all"
                  >
                    Acheter cette photo
                  </button>
               </motion.div>

               <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-card p-8 rounded-3xl border-2 border-dashed border-gray-200"
              >
                   <div className="flex justify-between items-center mb-4">
                    <h3 className="font-display text-xl">Une Vidéo Unique</h3>
                    <div className="bg-romantic-pink/10 text-romantic-red px-3 py-1 rounded-full text-xs font-bold">
                      GEMINI + 50%
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-3xl font-bold text-gray-900">{formatPrice(finalVideoPrice)}</span>
                    <span className="text-sm text-gray-400 line-through">{formatPrice(BASE_PRICES.singleVideo)}</span>
                  </div>
                  <ul className="space-y-3 text-sm text-gray-600 mb-8">
                  <li className="flex items-center gap-2">
                       <Check size={14} className={hasCustomImage ? "text-green-500" : "text-gray-300"} />
                       Votre propre photo : {hasCustomImage ? "-30% appliqué" : "-30% possible"}
                    </li>
                    <li className="flex items-center gap-2">
                       <Check size={14} className={hasCustomText ? "text-green-500" : "text-gray-300"} />
                       Votre propre message : {hasCustomText ? "-20% appliqué" : "-20% possible"}
                    </li>
                  </ul>
                  <button 
                    onClick={() => handlePayment({ name: "Vidéo Unique", price: formatPrice(finalVideoPrice) })}
                    className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all"
                  >
                    Acheter cette vidéo
                  </button>
               </motion.div>
            </div>
          </>
        ) : (
          <div className="max-w-md mx-auto">
            <button 
              onClick={() => setSelectedPlan(null)}
              className="flex items-center gap-2 text-gray-500 font-medium mb-8 hover:gap-3 transition-all"
            >
              <ArrowLeft size={20} /> Changer de plan
            </button>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-8 rounded-3xl"
            >
              <h2 className="font-display text-2xl mb-6 text-center">Finaliser votre achat</h2>
              
              <div className="bg-romantic-pink/5 p-4 rounded-2xl mb-8 flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-romantic-red uppercase tracking-wider">Plan sélectionné</p>
                  <p className="font-display text-lg">{selectedPlan.name}</p>
                </div>
                <p className="font-bold text-xl">{selectedPlan.price}</p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Numéro de carte</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="0000 0000 0000 0000" 
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-romantic-pink outline-none transition-all"
                    />
                    <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Expiration</label>
                    <input 
                      type="text" 
                      placeholder="MM/YY" 
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-romantic-pink outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">CVC</label>
                    <input 
                      type="text" 
                      placeholder="123" 
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-romantic-pink outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={confirmPayment}
                disabled={isProcessing || isSuccess}
                className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
                  isSuccess 
                    ? "bg-green-500 text-white" 
                    : "bg-romantic-red text-white hover:bg-red-600 shadow-lg"
                }`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Traitement en cours...
                  </>
                ) : isSuccess ? (
                  <>
                    <Check size={20} />
                    Paiement Réussi !
                  </>
                ) : (
                  <>
                    <ShieldCheck size={20} />
                    Payer {selectedPlan.price}
                  </>
                )}
              </button>

              <p className="text-center text-[10px] text-gray-400 mt-6 uppercase tracking-widest">
                Paiement sécurisé par Mapendo Pay
              </p>
            </motion.div>
          </div>
        )}

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="glass-card p-8 rounded-3xl bg-white/40">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-romantic-pink/10 rounded-2xl">
                <ShieldCheck className="text-romantic-red" />
              </div>
              <h3 className="font-display text-xl">Paiement Sécurisé</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Vos transactions sont traitées directement sur notre plateforme sécurisée. Nous utilisons un cryptage de bout en bout pour protéger vos données.
            </p>
          </div>

          <div className="glass-card p-8 rounded-3xl bg-white/40">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-romantic-gold/10 rounded-2xl">
                <Sparkles className="text-romantic-gold" />
              </div>
              <h3 className="font-display text-xl">Gratuité Spéciale</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              <strong>Bonne nouvelle !</strong> Si vous utilisez vos propres photos comme thème, la génération est 100% gratuite si vous partagez Mapendo sur vos réseaux sociaux.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
