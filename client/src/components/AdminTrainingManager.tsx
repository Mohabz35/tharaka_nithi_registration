import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Edit, Trash2, Save, X, Loader2, GraduationCap, Upload, Eye, EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface TrainingProgram {
  id: number;
  title: string;
  description: string | null;
  startDate: string | Date | null;
  endDate: string | Date | null;
  location: string | null;
  feeKes: number;
  capacity: number | null;
  imageUrl: string | null;
  isActive: boolean;
}

const emptyForm = {
  title: "",
  description: "",
  startDate: "",
  endDate: "",
  location: "",
  feeKes: 0,
  capacity: "",
  imageUrl: "",
  imageKey: "",
};

function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "TBA";
  try {
    return new Date(date).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "TBA";
  }
}

function toLocalDateInput(date: string | Date | null | undefined): string {
  if (!date) return "";
  try {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  } catch {
    return "";
  }
}

export default function AdminTrainingManager() {
  const [activeSection, setActiveSection] = useState<"programs" | "registrations">("programs");
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [uploading, setUploading] = useState(false);

  const { data: programs, isLoading } = trpc.training.getPrograms.useQuery();
  const { data: registrations, isLoading: isLoadingRegs } = trpc.training.getRegistrations.useQuery();
  const utils = trpc.useContext();

  const invalidate = () => {
    utils.training.getPrograms.invalidate();
    utils.training.getRegistrations.invalidate();
    utils.training.getActivePrograms.invalidate();
  };

  const createProgram = trpc.training.createProgram.useMutation({
    onSuccess: () => {
      toast.success("Program created");
      invalidate();
      resetForm();
    },
    onError: (e) => toast.error(e.message || "Failed to create program"),
  });

  const updateProgram = trpc.training.updateProgram.useMutation({
    onSuccess: () => {
      toast.success("Program updated");
      invalidate();
      resetForm();
    },
    onError: (e) => toast.error(e.message || "Failed to update program"),
  });

  const deleteProgram = trpc.training.deleteProgram.useMutation({
    onSuccess: () => {
      toast.success("Program deleted");
      invalidate();
    },
    onError: () => toast.error("Failed to delete program"),
  });

  const toggleActive = trpc.training.toggleProgramActive.useMutation({
    onSuccess: (res) => {
      toast.success(res.isActive ? "Program activated" : "Program deactivated");
      invalidate();
    },
  });

  const updatePayment = trpc.training.updatePaymentStatus.useMutation({
    onSuccess: () => {
      toast.success("Payment status updated");
      invalidate();
    },
    onError: () => toast.error("Failed to update payment status"),
  });

  const deleteRegistration = trpc.training.deleteRegistration.useMutation({
    onSuccess: () => {
      toast.success("Registration removed");
      invalidate();
    },
  });

  const resetForm = () => {
    setFormData({ ...emptyForm });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (program: TrainingProgram) => {
    setEditingId(program.id);
    setFormData({
      title: program.title,
      description: program.description || "",
      startDate: toLocalDateInput(program.startDate),
      endDate: toLocalDateInput(program.endDate),
      location: program.location || "",
      feeKes: program.feeKes,
      capacity: program.capacity != null ? String(program.capacity) : "",
      imageUrl: program.imageUrl || "",
      imageKey: "",
    });
    setIsAdding(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": file.type, "x-file-name": `training-${file.name}` },
        body: file,
      });
      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      setFormData(prev => ({ ...prev, imageUrl: data.url, imageKey: data.key }));
      toast.success("Image uploaded");
    } catch {
      toast.error("Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      toast.error("Program title is required");
      return;
    }
    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      startDate: formData.startDate || undefined,
      endDate: formData.endDate || undefined,
      location: formData.location.trim() || undefined,
      feeKes: Number(formData.feeKes) || 0,
      capacity: formData.capacity ? Number(formData.capacity) : undefined,
      imageUrl: formData.imageUrl || undefined,
      imageKey: formData.imageKey || undefined,
    };

    if (editingId) {
      updateProgram.mutate({ id: editingId, ...payload });
    } else {
      createProgram.mutate({ ...payload, isActive: true });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl text-[#d4af37] uppercase tracking-wider">Training & Bootcamp</h2>
          <p className="text-gray-400 text-sm font-light">Manage programs and registrants</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveSection("programs")}
            className={`px-4 py-2 text-xs uppercase tracking-widest border transition-colors ${
              activeSection === "programs"
                ? "bg-[#d4af37] text-black border-[#d4af37]"
                : "border-[#d4af37]/40 text-[#d4af37]/70 hover:border-[#d4af37]"
            }`}
          >
            Programs
          </button>
          <button
            onClick={() => setActiveSection("registrations")}
            className={`px-4 py-2 text-xs uppercase tracking-widest border transition-colors ${
              activeSection === "registrations"
                ? "bg-[#d4af37] text-black border-[#d4af37]"
                : "border-[#d4af37]/40 text-[#d4af37]/70 hover:border-[#d4af37]"
            }`}
          >
            Registrations ({registrations?.length || 0})
          </button>
          {activeSection === "programs" && (
            <Button
              onClick={() => { resetForm(); setIsAdding(true); }}
              className="bg-[#d4af37] text-black hover:bg-white uppercase tracking-widest rounded-none"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Program
            </Button>
          )}
        </div>
      </div>

      {activeSection === "programs" && (
        <>
          {(isAdding || editingId !== null) && (
            <div className="bg-[#140a10] border border-[#d4af37]/40 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[#d4af37] uppercase tracking-widest text-sm">
                  {editingId ? "Edit Program" : "New Program"}
                </h3>
                <button onClick={resetForm} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#d4af37] text-xs uppercase tracking-widest">Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="bg-[#0a0508] border-[#d4af37]/30 text-white mt-1"
                    placeholder="e.g. Weekend Runway Bootcamp"
                  />
                </div>
                <div>
                  <Label className="text-[#d4af37] text-xs uppercase tracking-widest">Location</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="bg-[#0a0508] border-[#d4af37]/30 text-white mt-1"
                    placeholder="e.g. Chuka Town Hall"
                  />
                </div>
                <div>
                  <Label className="text-[#d4af37] text-xs uppercase tracking-widest">Start Date</Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="bg-[#0a0508] border-[#d4af37]/30 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[#d4af37] text-xs uppercase tracking-widest">End Date</Label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="bg-[#0a0508] border-[#d4af37]/30 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[#d4af37] text-xs uppercase tracking-widest">Fee (KES)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.feeKes}
                    onChange={(e) => setFormData({ ...formData, feeKes: Number(e.target.value) })}
                    className="bg-[#0a0508] border-[#d4af37]/30 text-white mt-1"
                    placeholder="0 for free"
                  />
                </div>
                <div>
                  <Label className="text-[#d4af37] text-xs uppercase tracking-widest">Capacity (blank = unlimited)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="bg-[#0a0508] border-[#d4af37]/30 text-white mt-1"
                    placeholder="e.g. 50"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-[#d4af37] text-xs uppercase tracking-widest">Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-[#0a0508] border-[#d4af37]/30 text-white mt-1"
                    rows={3}
                    placeholder="What the program covers"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-[#d4af37] text-xs uppercase tracking-widest">Cover Image</Label>
                  <div className="flex items-center gap-3 mt-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                      className="bg-[#0a0508] border-[#d4af37]/30 text-white text-xs"
                    />
                    {uploading && <Loader2 className="w-4 h-4 text-[#d4af37] animate-spin" />}
                  </div>
                  {formData.imageUrl && (
                    <img src={formData.imageUrl} alt="Preview" className="w-40 h-24 object-cover mt-2 border border-[#d4af37]/40" />
                  )}
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={createProgram.isPending || updateProgram.isPending || uploading}
                className="bg-[#d4af37] text-black hover:bg-white uppercase tracking-widest rounded-none"
              >
                {createProgram.isPending || updateProgram.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {editingId ? "Update Program" : "Create Program"}
              </Button>
            </div>
          )}

          {isLoading && (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-[#d4af37] animate-spin" />
            </div>
          )}

          {!isLoading && (!programs || programs.length === 0) && (
            <div className="text-center py-12 border border-dashed border-[#d4af37]/30">
              <GraduationCap className="w-12 h-12 text-[#d4af37]/40 mx-auto mb-4" />
              <p className="text-gray-400">No training programs yet.</p>
            </div>
          )}

          {!isLoading && programs && programs.length > 0 && (
            <div className="space-y-3">
              {programs.map((program) => (
                <div key={program.id} className="bg-[#140a10] border border-[#d4af37]/20 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  {program.imageUrl ? (
                    <img src={program.imageUrl} alt={program.title} className="w-24 h-16 object-cover border border-[#d4af37]/40 shrink-0" />
                  ) : (
                    <div className="w-24 h-16 bg-[#2a0a1a] border border-[#d4af37]/20 flex items-center justify-center shrink-0">
                      <GraduationCap className="w-5 h-5 text-[#d4af37]/50" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold">{program.title}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>{formatDate(program.startDate)}{program.endDate ? ` - ${formatDate(program.endDate)}` : ""}</span>
                      {program.location && <span>{program.location}</span>}
                      <span className="text-[#d4af37]">
                        {program.feeKes > 0 ? `KES ${program.feeKes.toLocaleString()}` : "FREE"}
                      </span>
                      {program.capacity != null && (
                        <span>Capacity: {program.capacity}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleActive.mutate(program.id)}
                      className={`flex items-center gap-1 px-3 py-2 text-[10px] uppercase tracking-widest border transition-colors ${
                        program.isActive
                          ? "border-green-500/50 text-green-400 hover:bg-green-500/10"
                          : "border-gray-600 text-gray-400 hover:bg-gray-700/30"
                      }`}
                    >
                      {program.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {program.isActive ? "Active" : "Hidden"}
                    </button>
                    <button
                      onClick={() => handleEdit(program)}
                      className="p-2 text-[#d4af37] hover:bg-[#d4af37]/10 border border-[#d4af37]/30"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteProgram.mutate(program.id)}
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
        </>
      )}

      {activeSection === "registrations" && (
        <>
          {isLoadingRegs && (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-[#d4af37] animate-spin" />
            </div>
          )}

          {!isLoadingRegs && (!registrations || registrations.length === 0) && (
            <div className="text-center py-12 border border-dashed border-[#d4af37]/30">
              <GraduationCap className="w-12 h-12 text-[#d4af37]/40 mx-auto mb-4" />
              <p className="text-gray-400">No training registrations yet.</p>
            </div>
          )}

          {!isLoadingRegs && registrations && registrations.length > 0 && (
            <div className="overflow-x-auto border border-[#d4af37]/20">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#140a10] text-[#d4af37] text-xs uppercase tracking-widest">
                    <th className="text-left p-3">Name</th>
                    <th className="text-left p-3">Program</th>
                    <th className="text-left p-3">Contact</th>
                    <th className="text-left p-3">Level</th>
                    <th className="text-left p-3">Payment</th>
                    <th className="text-right p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map(({ registration, programTitle }) => (
                    <tr key={registration.id} className="border-t border-[#d4af37]/10 text-gray-300">
                      <td className="p-3">
                        <p className="text-white">{registration.fullName}</p>
                        <p className="text-gray-500 text-xs">{new Date(registration.createdAt).toLocaleDateString()}</p>
                      </td>
                      <td className="p-3 text-[#d4af37]/80">{programTitle}</td>
                      <td className="p-3">
                        <p>{registration.email}</p>
                        <p className="text-gray-500 text-xs">{registration.phoneNumber}</p>
                      </td>
                      <td className="p-3 capitalize">{registration.experienceLevel || "-"}</td>
                      <td className="p-3">
                        <button
                          onClick={() =>
                            updatePayment.mutate({
                              id: registration.id,
                              status: registration.paymentStatus === "completed" ? "pending" : "completed",
                            })
                          }
                          className={`px-3 py-1 text-[10px] uppercase tracking-widest border transition-colors ${
                            registration.paymentStatus === "completed"
                              ? "border-green-500/50 text-green-400 hover:bg-green-500/10"
                              : "border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
                          }`}
                        >
                          {registration.paymentStatus}
                        </button>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => deleteRegistration.mutate(registration.id)}
                          className="p-2 text-red-400 hover:bg-red-500/10 border border-red-500/30"
                          title="Remove registration"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
