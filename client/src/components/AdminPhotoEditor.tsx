import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Image as ImageIcon } from "lucide-react";

interface Props {
  id: number;
  fullName: string;
  photoUrl: string | null;
  onSuccess: () => void;
}

export default function AdminPhotoEditor({ id, fullName, photoUrl, onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  
  // Base cloudinary URL format is typically: https://res.cloudinary.com/<cloud_name>/image/upload/v<version>/<public_id>
  // Transformations are injected after /upload/: https://res.cloudinary.com/<cloud_name>/image/upload/<transformations>/v<version>/<public_id>
  
  const [transformation, setTransformation] = useState("c_fill,g_face");
  
  const getPreviewUrl = () => {
    if (!photoUrl) return "";
    if (!photoUrl.includes("/upload/")) return photoUrl; // Not a standard cloudinary URL
    
    // Strip existing transformations if any (this is basic, handles simple cases)
    const baseUrlParts = photoUrl.split("/upload/");
    const rest = baseUrlParts[1].replace(/^(c_[^/]+,?[^/]*\/)+/, ''); // Strip existing c_*,w_*,h_* etc if they are right after upload/
    
    return `${baseUrlParts[0]}/upload/${transformation}/${rest}`;
  };

  const updatePhotoMutation = trpc.admin.updatePhoto.useMutation({
    onSuccess: () => {
      toast.success("Photo updated successfully");
      setOpen(false);
      onSuccess();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update photo");
    },
  });

  const handleSave = () => {
    const newUrl = getPreviewUrl();
    if (newUrl) {
      updatePhotoMutation.mutate({ id, photoUrl: newUrl });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-[#d4af37] hover:text-[#e5c158] hover:bg-[#d4af37]/10" title="Edit Photo">
          <ImageIcon className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#2a0a1a] border-[#d4af37] text-white max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-[#d4af37]">Edit Photo: {fullName}</DialogTitle>
          <DialogDescription className="text-gray-400">
            Apply Cloudinary transformations to resize or crop the photo.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-6">
          {!photoUrl ? (
            <p className="text-center text-gray-400 py-8">No photo uploaded.</p>
          ) : (
            <>
              <div className="flex justify-center">
                <div className="relative border-2 border-dashed border-[#d4af37] p-2 rounded-lg bg-black/50">
                  <img 
                    src={getPreviewUrl()} 
                    alt="Preview" 
                    className="max-w-full max-h-[300px] object-contain rounded"
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-300">Preset Transformations</p>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant={transformation === "" ? "default" : "outline"}
                    size="sm"
                    className={transformation === "" ? "bg-[#d4af37] text-black" : "border-[#d4af37] text-white"}
                    onClick={() => setTransformation("")}
                  >
                    Original
                  </Button>
                  <Button 
                    variant={transformation === "c_fill,g_face,w_400,h_400" ? "default" : "outline"}
                    size="sm"
                    className={transformation === "c_fill,g_face,w_400,h_400" ? "bg-[#d4af37] text-black" : "border-[#d4af37] text-white"}
                    onClick={() => setTransformation("c_fill,g_face,w_400,h_400")}
                  >
                    Square (Face)
                  </Button>
                  <Button 
                    variant={transformation === "c_fill,g_face,w_600,h_800" ? "default" : "outline"}
                    size="sm"
                    className={transformation === "c_fill,g_face,w_600,h_800" ? "bg-[#d4af37] text-black" : "border-[#d4af37] text-white"}
                    onClick={() => setTransformation("c_fill,g_face,w_600,h_800")}
                  >
                    Portrait (3:4)
                  </Button>
                  <Button 
                    variant={transformation === "c_fit,w_800" ? "default" : "outline"}
                    size="sm"
                    className={transformation === "c_fit,w_800" ? "bg-[#d4af37] text-black" : "border-[#d4af37] text-white"}
                    onClick={() => setTransformation("c_fit,w_800")}
                  >
                    Fit Width
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} className="border-[#d4af37] text-white hover:bg-white/10">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!photoUrl || updatePhotoMutation.isLoading} 
            className="bg-[#d4af37] text-black hover:bg-[#e5c158]"
          >
            {updatePhotoMutation.isLoading ? "Saving..." : "Save Photo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
