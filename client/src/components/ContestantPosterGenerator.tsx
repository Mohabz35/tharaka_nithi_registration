import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Share2, Download, Loader2, AlertCircle, CheckCircle, RotateCcw } from "lucide-react";

interface ContestantPosterGeneratorProps {
  defaultName?: string;
  defaultCategory?: "Adult" | "Teen" | "Little Stars";
}

export default function ContestantPosterGenerator({
  defaultName = "",
  defaultCategory = "Adult",
}: ContestantPosterGeneratorProps) {
  const [name, setName] = useState(defaultName);
  const [category, setCategory] = useState<"Adult" | "Teen" | "Little Stars">(defaultCategory);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>("");
  const [generatedFilename, setGeneratedFilename] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const generatePosterMutation = trpc.contestant.generatePoster.useMutation();

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    setPhotoFile(file);
    setError("");

    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGeneratePoster = async () => {
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!photoFile) {
      setError("Please select a photo");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess(false);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(",")[1];

        try {
          const result = await generatePosterMutation.mutateAsync({
            photoBase64: base64,
            name: name.trim(),
            category,
          });

          setGeneratedImageUrl(result.imageUrl);
          setGeneratedFilename(result.filename);
          setSuccess(true);
          setError("");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to generate poster");
        } finally {
          setIsLoading(false);
        }
      };

      reader.readAsDataURL(photoFile);
    } catch {
      setError("Failed to process image");
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = generatedImageUrl;
    link.download = `${name.replace(/\s+/g, "_")}_poster.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (!generatedImageUrl) return;

    const shareText = `I'm a contestant in the Mr & Miss Face of Tharaka-Nithi County 2026! Category: ${category}. Join me at www.faceoftharakanithi.app`;

    if (navigator.share) {
      try {
        const response = await fetch(generatedImageUrl);
        const blob = await response.blob();
        const file = new File([blob], `${name}_poster.png`, { type: "image/png" });

        await navigator.share({
          title: "Mr & Miss Face of Tharaka-Nithi County 2026",
          text: shareText,
          files: [file],
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          copyShareLink();
        }
      }
    } else {
      copyShareLink();
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(generatedImageUrl);
    alert("Image link copied to clipboard!");
  };

  const reset = () => {
    setSuccess(false);
    setName(defaultName);
    setCategory(defaultCategory);
    setPhotoFile(null);
    setPhotoPreview("");
    setGeneratedImageUrl("");
    setGeneratedFilename("");
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg shadow-2xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#d4af37] mb-2">Create Your Poster</h1>
        <p className="text-slate-300">Upload your photo and generate your official contestant poster</p>
      </div>

      {!success ? (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-[#d4af37] focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as "Adult" | "Teen" | "Little Stars")}
              className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-[#d4af37] focus:outline-none transition"
            >
              <option value="Adult">Adult (18+ years)</option>
              <option value="Teen">Teen (13-17 years)</option>
              <option value="Little Stars">Little Stars (5-12 years)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">Your Photo</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-8 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-[#d4af37] transition text-center"
            >
              {photoPreview ? (
                <div className="space-y-4">
                  <img src={photoPreview} alt="Preview" className="h-48 w-48 object-cover rounded-lg mx-auto" />
                  <p className="text-slate-300 text-sm">Click to change photo</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-slate-300">Click to upload or drag and drop</p>
                  <p className="text-slate-400 text-sm">PNG, JPG, GIF up to 5MB</p>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-900/30 border border-red-700 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-200">{error}</p>
            </div>
          )}

          <button
            onClick={handleGeneratePoster}
            disabled={isLoading || !photoFile || !name}
            className="w-full py-3 bg-gradient-to-r from-[#d4af37] to-yellow-500 text-slate-900 font-bold rounded-lg hover:shadow-lg hover:shadow-[#d4af37]/50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Poster"
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-3 p-4 bg-green-900/30 border border-green-700 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <p className="text-green-200">Your poster has been generated successfully!</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-200">Your Poster</p>
            <img src={generatedImageUrl} alt="Generated Poster" className="w-full rounded-lg shadow-lg border border-slate-600" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleDownload}
              className="py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download
            </button>
            <button
              onClick={handleShare}
              className="py-3 bg-gradient-to-r from-[#d4af37] to-yellow-500 text-slate-900 font-semibold rounded-lg hover:shadow-lg hover:shadow-[#d4af37]/50 transition flex items-center justify-center gap-2"
            >
              <Share2 className="w-5 h-5" />
              Share
            </button>
          </div>

          <button onClick={reset} className="w-full py-2 text-slate-300 hover:text-white transition flex items-center justify-center gap-2">
            <RotateCcw className="w-4 h-4" />
            Create Another Poster
          </button>
        </div>
      )}
    </div>
  );
}
