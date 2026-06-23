import { MessageSquare } from "lucide-react";

interface MessageInputProps {
  message: string;
  onChange: (val: string) => void;
}

export const MessageInput = ({ message, onChange }: MessageInputProps) => (
  <div className="space-y-2">
    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1">
      <MessageSquare size={12} /> Votre Message
    </label>
    <textarea
      placeholder="Ex: Je t'aime plus que tout au monde..."
      rows={3}
      value={message}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-romantic-pink focus:border-transparent outline-none transition-all bg-white/50 resize-none"
      aria-label="Votre message romantique"
      maxLength={1000}
    />
    <div className="text-right text-[10px] text-gray-400">
      {message.length}/1000
    </div>
  </div>
);
