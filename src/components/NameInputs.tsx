import { User } from "lucide-react";

interface NameInputsProps {
  sender: string;
  receiver: string;
  onSenderChange: (val: string) => void;
  onReceiverChange: (val: string) => void;
}

export const NameInputs = ({ sender, receiver, onSenderChange, onReceiverChange }: NameInputsProps) => (
  <div className="grid grid-cols-2 gap-4">
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1">
        <User size={12} /> De la part de
      </label>
      <input
        type="text"
        placeholder="Votre nom"
        value={sender}
        onChange={(e) => onSenderChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-romantic-pink focus:border-transparent outline-none transition-all bg-white/50"
        aria-label="Votre nom"
      />
    </div>
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1">
        <User size={12} /> Pour
      </label>
      <input
        type="text"
        placeholder="Son nom"
        value={receiver}
        onChange={(e) => onReceiverChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-romantic-pink focus:border-transparent outline-none transition-all bg-white/50"
        aria-label="Son nom"
      />
    </div>
  </div>
);
