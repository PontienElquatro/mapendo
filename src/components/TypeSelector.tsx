import { Image as ImageIcon, Video as VideoIcon } from "lucide-react";
import { GenerationType } from "../utils/types";

interface TypeSelectorProps {
  type: GenerationType;
  onChange: (type: GenerationType) => void;
}

export const TypeSelector = ({ type, onChange }: TypeSelectorProps) => (
  <div className="flex p-1 bg-gray-100 rounded-xl" role="tablist">
    <button
      onClick={() => onChange("image")}
      role="tab"
      aria-selected={type === "image"}
      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
        type === "image" ? "bg-white shadow-sm text-romantic-red" : "text-gray-500 hover:text-gray-700"
      }`}
    >
      <ImageIcon size={18} />
      <span>Photo</span>
    </button>
    <button
      onClick={() => onChange("video")}
      role="tab"
      aria-selected={type === "video"}
      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
        type === "video" ? "bg-white shadow-sm text-romantic-red" : "text-gray-500 hover:text-gray-700"
      }`}
    >
      <VideoIcon size={18} />
      <span>Vidéo</span>
    </button>
  </div>
);
