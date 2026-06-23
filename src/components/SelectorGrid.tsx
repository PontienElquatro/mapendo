import { LucideIcon } from "lucide-react";

interface Option {
  id: string;
  label: string;
  icon?: string;
  fontClass?: string;
}

interface SelectorGridProps {
  label: string;
  icon: LucideIcon;
  options: Option[];
  selectedId: string;
  onChange: (id: string) => void;
  columns?: number;
}

export const SelectorGrid = ({
  label,
  icon: Icon,
  options,
  selectedId,
  onChange,
  columns = 2
}: SelectorGridProps) => (
  <div className="space-y-2">
    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1">
      <Icon size={12} /> {label}
    </label>
    <div className={`grid grid-cols-2 ${columns === 3 ? 'sm:grid-cols-3' : ''} gap-2`}>
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={`px-3 py-2 rounded-xl border text-sm transition-all flex items-center gap-2 ${
            selectedId === opt.id
              ? "border-romantic-red bg-romantic-red/10 text-romantic-red shadow-sm"
              : "border-gray-200 bg-white/50 text-gray-600 hover:border-romantic-pink"
          }`}
          aria-pressed={selectedId === opt.id}
        >
          {opt.icon && <span>{opt.icon}</span>}
          <span className={`truncate ${opt.fontClass || ''}`}>{opt.label}</span>
        </button>
      ))}
    </div>
  </div>
);
