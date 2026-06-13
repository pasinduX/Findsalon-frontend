import { useState, useRef } from "react";
import { salonService } from "@/services/salon.service";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2 } from "lucide-react";
import { buildImageUrl } from "@/lib/utils";

interface ImageUploaderProps {
  salonId: string;
  currentUrl?: string | null;
  onUpload: (url: string) => void;
  label?: string;
  bucket?: string;
  aspectRatio?: string;
}

const ImageUploader = ({ salonId, currentUrl, onUpload, label = "Upload Image", bucket = "salon-images", aspectRatio = "16/9" }: ImageUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);
    formData.append("Folder", bucket || salonId);

    const { data, error } = await salonService.uploadImage(formData);
    if (error || !data) {
      toast({ title: "Upload failed", description: error ?? "Unable to upload image", variant: "destructive" });
      setPreview(null);
      setUploading(false);
      return;
    }

    const uploadedUrl = (data as any)?.data?.Url || (data as any)?.Url;
    if (!uploadedUrl) {
      toast({ title: "Upload failed", description: "Invalid upload response", variant: "destructive" });
      setPreview(null);
      setUploading(false);
      return;
    }

    onUpload(buildImageUrl(uploadedUrl));
    setPreview(null);
    setUploading(false);
    toast({ title: "Image uploaded!" });
  };

  const displayUrl = preview || currentUrl;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div
        className="relative border-2 border-dashed border-border rounded-xl overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
        style={{ aspectRatio }}
        onClick={() => inputRef.current?.click()}
      >
        {displayUrl ? (
          <>
            <img src={displayUrl} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-foreground/0 hover:bg-foreground/30 transition-colors flex items-center justify-center">
              <span className="text-primary-foreground font-medium opacity-0 hover:opacity-100 transition-opacity">Change</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
            <Upload className="h-8 w-8" />
            <span className="text-sm">Click to upload</span>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
};

export default ImageUploader;
