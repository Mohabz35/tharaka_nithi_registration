import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Edit, Trash2, Save, X, Loader2, Crown, Upload, Eye, EyeOff, Link2, Award,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface Winner {
  id: number;
  fullName: string;
  title: string;
  category: string;
  placement: string | null;
  prize: string | null;
  description: string | null;
  photoUrl: string | null;
  isPublished: boolean;
}

const emptyForm = {
  fullName: "",
  title: "",
  category: "overall",
  placement: "",
  prize: "",
  description: "",
  photoUrl: "",
  photoKey: "",
};

const categoryLabels: Record<string, string> = {
  overall: "Overall",
  adults: "Adults (18–35)",
  teens: "Teens (13–17)",
  little_stars: "Little Stars (5–12)",
};

export default function AdminWinnersManager() {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [uploading, setUploading] = useState(false);

  const { data: winners, isLoading } = trpc.winner.getAll.useQuery();
  const utils = trpc.useContext();

  const invalidate = () => {
    utils.winner.getAll.invalidate();
    utils.winner.getPublished.invalidate();
  };

  const createWinner = trpc.winner.create.useMutation({
    onSuccess: () => {
      toast.success("Winner added successfully");
      invalidate();
      resetForm();
    },
    onError: (e) => toast.error(e.message || "Failed to add winner"),
  });

  const updateWinner = trpc.winner.update.useMutation({
    onSuccess: () => {
      toast.success("Winner updated successfully");
      invalidate();
      resetForm();
    },
    onError: (e) => toast.error(e.message || "Failed to update winner"),
  });

  const deleteWinner = trpc.winner.delete.useMutation({
    onSuccess: () => {
      toast.success("Winner deleted");
      invalidate();
    },
    onError: () => toast.error("Failed to delete winner"),
  });

  const togglePublish = trpc.winner.togglePublish.useMutation({
    onSuccess: (res) => {
      toast.success(res.isPublished ? "Winner published" : "Winner unpublished");
      invalidate();
    },
    onError: () => toast.error("Failed to update publish status"),
  });

  const emailCertificate = trpc.admin.emailWinnerCertificate.useMutation({
    onSuccess: (res) => {
      toast.success(`Achievement certificate emailed to ${res.email}`);
    },
    onError: (e) => toast.error(e.message || "Failed to email certificate"),
  });

  const resetForm = () => {
    setFormData({ ...emptyForm });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (winner: Winner) => {
    setEditingId(winner.id);
    setFormData({
      fullName: winner.fullName,
      title: winner.title,
      category: winner.category,
      placement: winner.placement || "",
      prize: winner.prize || "",
      description: winner.description || "",
      photoUrl: winner.photoUrl || "",
      photoKey: "",
    });
    setIsAdding(false);
  };

  const handlePhotoUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Photo must be under 10MB");
      return;
    }
    setUploading(true);
    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": file.type, "x-file-name": `winner-${file.name}` },
        body: file,
      });
      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      setFormData(prev => ({ ...prev, photoUrl: data.url, photoKey: data.key }));
      toast.success("Photo uploaded");
    } catch {
      toast.error("Photo upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!formData.fullName.trim() || !formData.title.trim()) {
      toast.error("Name and title are required");
      return;
    }
    const payload = {
      fullName: formData.fullName.trim(),
      title: formData.title.trim(),
      category: formData.category as "adults" | "teens" | "little_stars" | "overall",
      placement: formData.placement.trim() || undefined,
      prize: formData.prize.trim() || undefined,
      description: formData.description.trim() || undefined,
      photoUrl: formData.photoUrl || undefined,
      photoKey: formData.photoKey || undefined,
    };

    if (editingId) {
      updateWinner.mutate({ id: editingId, ...payload });
    } else {
      createWinner.mutate({ ...payload, isPublished: true });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl text-[#d4af37] uppercase tracking-wider">Winners</h2>
          <p className="text-gray-400 text-sm font-light">Publish competition winners with shareable links</p>
        </div>
        <Button
          onClick={() => { resetForm(); setIsAdding(true); }}
          className="bg-[#d4af37] text-black hover:bg-white uppercase tracking-widest rounded-none"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Winner
        </Button>
      </div>

      {(isAdding || editingId !== null) && (
        <div className="bg-[#140a10] border border-[#d4af37]/40 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[#d4af37] uppercase tracking-widest text-sm">
              {editingId ? "Edit Winner" : "New Winner"}
            </h3>
            <button onClick={resetForm} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-[#d4af37] text-xs uppercase tracking-widest">Full Name *</Label>
              <Input
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="bg-[#0a0508] border-[#d4af37]/30 text-white mt-1"
                placeholder="Winner's name"
              />
            </div>
            <div>
              <Label className="text-[#d4af37] text-xs uppercase tracking-widest">Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="bg-[#0a0508] border-[#d4af37]/30 text-white mt-1"
                placeholder='e.g. "Miss Face of Tharaka-Nithi 2026"'
              />
            </div>
            <div>
              <Label className="text-[#d4af37] text-xs uppercase tracking-widest">Category</Label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-[#0a0508] border border-[#d4af37]/30 text-white px-3 py-2 mt-1 text-sm focus:border-[#d4af37] focus:outline-none"
              >
                {Object.entries(categoryLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-[#d4af37] text-xs uppercase tracking-widest">Placement</Label>
              <Input
                value={formData.placement}
                onChange={(e) => setFormData({ ...formData, placement: e.target.value })}
                className="bg-[#0a0508] border-[#d4af37]/30 text-white mt-1"
                placeholder='e.g. "Winner", "1st Runner Up"'
              />
            </div>
            <div>
              <Label className="text-[#d4af37] text-xs uppercase tracking-widest">Prize</Label>
              <Input
                value={formData.prize}
                onChange={(e) => setFormData({ ...formData, prize: e.target.value })}
                className="bg-[#0a0508] border-[#d4af37]/30 text-white mt-1"
                placeholder="e.g. Crown + KES 100,000"
              />
            </div>
            <div>
              <Label className="text-[#d4af37] text-xs uppercase tracking-widest">Photo</Label>
              <div className="flex items-center gap-3 mt-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePhotoUpload(file);
                  }}
                  className="bg-[#0a0508] border-[#d4af37]/30 text-white text-xs"
                />
                {uploading && <Loader2 className="w-4 h-4 text-[#d4af37] animate-spin" />}
              </div>
              {formData.photoUrl && (
                <img src={formData.photoUrl} alt="Preview" className="w-20 h-20 object-cover mt-2 border border-[#d4af37]/40" />
              )}
            </div>
          </div>

          <div>
            <Label className="text-[#d4af37] text-xs uppercase tracking-widest">Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-[#0a0508] border-[#d4af37]/30 text-white mt-1"
              rows={3}
              placeholder="Short write-up shown on the winner profile and shared on social media"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={createWinner.isPending || updateWinner.isPending || uploading}
            className="bg-[#d4af37] text-black hover:bg-white uppercase tracking-widest rounded-none"
          >
            {createWinner.isPending || updateWinner.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {editingId ? "Update Winner" : "Add Winner"}
          </Button>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-[#d4af37] animate-spin" />
        </div>
      )}

      {!isLoading && (!winners || winners.length === 0) && (
        <div className="text-center py-12 border border-dashed border-[#d4af37]/30">
          <Crown className="w-12 h-12 text-[#d4af37]/40 mx-auto mb-4" />
          <p className="text-gray-400">No winners yet. Add the first winner to get started.</p>
        </div>
      )}

      {!isLoading && winners && winners.length > 0 && (
        <div className="space-y-3">
          {winners.map((winner) => (
            <div key={winner.id} className="bg-[#140a10] border border-[#d4af37]/20 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              {winner.photoUrl ? (
                <img src={winner.photoUrl} alt={winner.fullName} className="w-16 h-16 object-cover border border-[#d4af37]/40 shrink-0" />
              ) : (
                <div className="w-16 h-16 bg-[#2a0a1a] border border-[#d4af37]/20 flex items-center justify-center shrink-0">
                  <Crown className="w-6 h-6 text-[#d4af37]/50" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white font-semibold">{winner.fullName}</p>
                  {winner.placement && (
                    <span className="bg-[#d4af37]/20 border border-[#d4af37]/50 text-[#d4af37] px-2 py-0.5 text-[10px] uppercase tracking-widest">
                      {winner.placement}
                    </span>
                  )}
                  <span className="text-gray-500 text-[10px] uppercase tracking-widest">
                    {categoryLabels[winner.category] || winner.category}
                  </span>
                </div>
                <p className="text-[#d4af37]/80 text-sm">{winner.title}</p>
                {winner.prize && <p className="text-gray-500 text-xs">{winner.prize}</p>}
                <p className="text-gray-600 text-[11px] mt-1 flex items-center gap-1">
                  <Link2 className="w-3 h-3" />
                  {window.location.origin}/share/winner/{winner.id}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => togglePublish.mutate(winner.id)}
                  title={winner.isPublished ? "Published" : "Unpublished"}
                  className={`flex items-center gap-1 px-3 py-2 text-[10px] uppercase tracking-widest border transition-colors ${
                    winner.isPublished
                      ? "border-green-500/50 text-green-400 hover:bg-green-500/10"
                      : "border-gray-600 text-gray-400 hover:bg-gray-700/30"
                  }`}
                >
                  {winner.isPublished ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  {winner.isPublished ? "Live" : "Hidden"}
                </button>
                <button
                  onClick={() => handleEdit(winner)}
                  className="p-2 text-[#d4af37] hover:bg-[#d4af37]/10 border border-[#d4af37]/30"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (emailCertificate.isPending) return;
                    emailCertificate.mutate({ winnerId: winner.id });
                  }}
                  className="p-2 text-[#d4af37] hover:bg-[#d4af37]/10 border border-[#d4af37]/30 disabled:opacity-50"
                  title="Email achievement certificate to the contestant's registered email"
                  disabled={emailCertificate.isPending && emailCertificate.variables?.winnerId === winner.id}
                >
                  {emailCertificate.isPending && emailCertificate.variables?.winnerId === winner.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Award className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => deleteWinner.mutate(winner.id)}
                  className="p-2 text-red-400 hover:bg-red-500/10 border border-red-500/30"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
