import { useRef } from "react";
import { Upload, X } from "lucide-react";

interface UploadZoneProps {
  preview: string | null;
  onUpload: (base64: string) => void;
  onRemove: () => void;
}

export const UploadZone = ({ preview, onUpload, onRemove }: UploadZoneProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Le fichier est trop volumineux (max 5Mo)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpload(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1">
        <Upload size={12} /> Votre Photo/Vidéo comme thème (Optionnel)
      </label>
      {!preview ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-romantic-pink transition-colors bg-white/30"
          role="button"
          aria-label="Uploader une image de référence"
        >
          <Upload className="text-gray-400" size={24} />
          <span className="text-sm text-gray-500">Cliquez pour ajouter un média de référence (max 5Mo)</span>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFile}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
          />
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden aspect-video bg-black/5">
          <img src={preview} className="w-full h-full object-contain" alt="Aperçu de votre média" />
          <button
            onClick={onRemove}
            className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
            aria-label="Supprimer l'image"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
