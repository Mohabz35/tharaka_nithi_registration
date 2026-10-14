import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Loader2, ChevronLeft, GraduationCap, CalendarDays, MapPin, Users, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const categoryLabels: Record<string, string> = {
  adults: "Adults (18–35)",
  teens: "Teens (13–17)",
  little_stars: "Little Stars (5–12)",
};

const experienceLabels: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

function formatDate(date: string | Date | null | undefined): string | null {
  if (!date) return null;
  try {
    return new Date(date).toLocaleDateString("en-KE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return null;
  }
}

interface ProgramForm {
  fullName: string;
  email: string;
  phoneNumber: string;
  category: string;
  experienceLevel: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  notes: string;
}

const emptyForm: ProgramForm = {
  fullName: "",
  email: "",
  phoneNumber: "",
  category: "adults",
  experienceLevel: "beginner",
  emergencyContactName: "",
  emergencyContactPhone: "",
  notes: "",
};

export default function Training() {
  const [, setLocation] = useLocation();
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);
  const [form, setForm] = useState<ProgramForm>(emptyForm);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ProgramForm, string>>>({});

  const utils = trpc.useUtils();
  const { data: programs, isLoading } = trpc.training.getActivePrograms.useQuery();

  const registerMutation = trpc.training.register.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setForm(emptyForm);
      utils.training.getActivePrograms.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Registration failed. Please try again.");
    },
  });

  const selectedProgram = programs?.find(p => p.id === selectedProgramId) || null;

  const validate = (): boolean => {
    const errs: Partial<Record<keyof ProgramForm, string>> = {};
    if (!form.fullName.trim()) errs.fullName = "Full name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Invalid email address";
    if (!form.phoneNumber.trim()) errs.phoneNumber = "Phone number is required";
    else if (form.phoneNumber.replace(/\D/g, "").length < 9) errs.phoneNumber = "Phone number is too short";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgramId) return;
    if (!validate()) return;
    registerMutation.mutate({
      programId: selectedProgramId,
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phoneNumber: form.phoneNumber.trim(),
      category: form.category as "adults" | "teens" | "little_stars",
      experienceLevel: form.experienceLevel as "beginner" | "intermediate" | "advanced",
      emergencyContactName: form.emergencyContactName.trim() || undefined,
      emergencyContactPhone: form.emergencyContactPhone.trim() || undefined,
      notes: form.notes.trim() || undefined,
    });
  };

  const openRegistration = (programId: number) => {
    setSubmitted(false);
    setErrors({});
    setSelectedProgramId(programId);
  };

  return (
    <div className="min-h-screen bg-[#0a0508] text-white font-sans selection:bg-[#d4af37] selection:text-black">
      <div className="w-full h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />

      <header className="bg-[#050204] border-b border-[#d4af37]/20 pt-10 pb-8 px-4 sm:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setLocation("/")}
              className="flex items-center gap-2 text-[#d4af37]/70 hover:text-[#d4af37] text-xs uppercase tracking-widest transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Home
            </button>

            <div className="text-center">
              <p className="text-[#d4af37] text-xs uppercase tracking-[0.3em] mb-1">Grow Your Craft</p>
              <h1 className="font-serif text-3xl sm:text-5xl font-bold text-white uppercase tracking-wider">
                Training & Bootcamp
              </h1>
              <div className="flex items-center justify-center gap-3 mt-3">
                <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#d4af37]" />
                <GraduationCap className="w-4 h-4 text-[#d4af37]" />
                <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#d4af37]" />
              </div>
            </div>

            <div className="w-28" />
          </div>

          <p className="text-center text-gray-300 font-light max-w-2xl mx-auto">
            Register for our upcoming modeling training programs and bootcamps. Learn runway, posing,
            grooming, confidence and portfolio building from industry professionals.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-10 h-10 text-[#d4af37] animate-spin" />
            <p className="text-[#d4af37]/70 uppercase tracking-widest text-sm">Loading programs...</p>
          </div>
        )}

        {!isLoading && (!programs || programs.length === 0) && (
          <div className="text-center py-24">
            <GraduationCap className="w-16 h-16 text-[#d4af37]/40 mx-auto mb-6" />
            <h2 className="font-serif text-3xl text-white mb-3">No Programs Announced Yet</h2>
            <p className="text-gray-400 font-light max-w-md mx-auto">
              New training programs and bootcamps will be announced soon. Check back soon or follow us on social media.
            </p>
          </div>
        )}

        {!isLoading && programs && programs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {programs.map(program => {
              const startDate = formatDate(program.startDate);
              const endDate = formatDate(program.endDate);
              const hasCapacity = !!program.capacity && program.capacity > 0;
              const isFull = hasCapacity && program.registeredCount >= program.capacity!;
              const fillPercent = hasCapacity
                ? Math.min(100, Math.round((program.registeredCount / program.capacity!) * 100))
                : 0;

              return (
                <div
                  key={program.id}
                  className="bg-[#140a10] border border-[#d4af37]/25 overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-2 hover:border-[#d4af37] hover:shadow-[0_0_30px_rgba(212,175,55,0.25)]"
                >
                  {program.imageUrl ? (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={program.imageUrl}
                        alt={program.title}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-[#2a0a1a] to-[#1a0c14] flex items-center justify-center">
                      <GraduationCap className="w-12 h-12 text-[#d4af37]/40" />
                    </div>
                  )}

                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="font-serif text-2xl font-bold text-white mb-3">{program.title}</h3>

                    {program.description && (
                      <p className="text-gray-400 font-light text-sm leading-relaxed mb-4 flex-1">
                        {program.description}
                      </p>
                    )}

                    <div className="space-y-2 mb-4">
                      {startDate && (
                        <p className="text-[#d4af37]/90 text-xs uppercase tracking-widest flex items-center gap-2">
                          <CalendarDays className="w-3.5 h-3.5" />
                          {startDate}{endDate ? ` - ${endDate}` : ""}
                        </p>
                      )}
                      {program.location && (
                        <p className="text-gray-300 text-sm font-light flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-[#d4af37]/60" />
                          {program.location}
                        </p>
                      )}
                      <p className="text-white text-sm font-semibold flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-[#d4af37]/60" />
                        {hasCapacity
                          ? `${program.registeredCount} / ${program.capacity} registered`
                          : `${program.registeredCount} registered`}
                      </p>
                    </div>

                    {hasCapacity && (
                      <div className="w-full h-1.5 bg-[#0a0508] border border-[#d4af37]/20 mb-4">
                        <div
                          className={`h-full ${isFull ? "bg-red-500" : "bg-[#d4af37]"}`}
                          style={{ width: `${fillPercent}%` }}
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-5">
                      <p className="font-serif text-2xl text-[#d4af37]">
                        {program.feeKes > 0 ? `KES ${program.feeKes.toLocaleString()}` : "FREE"}
                      </p>
                      {isFull && (
                        <span className="bg-red-500/20 border border-red-500/50 text-red-400 px-3 py-1 text-[10px] uppercase tracking-widest">
                          Fully Booked
                        </span>
                      )}
                    </div>

                    <Button
                      onClick={() => openRegistration(program.id)}
                      disabled={isFull}
                      className={`w-full font-bold uppercase tracking-widest rounded-none py-6 ${
                        isFull
                          ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                          : "bg-[#d4af37] text-black hover:bg-white"
                      }`}
                    >
                      {isFull ? "Fully Booked" : "Register Now"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Registration Dialog */}
      <Dialog open={selectedProgramId !== null} onOpenChange={(open) => { if (!open) setSelectedProgramId(null); }}>
        <DialogContent className="bg-[#140a10] border-[#d4af37]/40 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          {submitted ? (
            <div className="py-10 text-center">
              <CheckCircle2 className="w-16 h-16 text-[#d4af37] mx-auto mb-6" />
              <DialogTitle className="font-serif text-2xl text-[#d4af37] mb-3">Registration Received!</DialogTitle>
              <DialogDescription className="text-gray-300 font-light mb-8">
                Thank you for registering{selectedProgram ? ` for ${selectedProgram.title}` : ""}. We have sent you a
                confirmation email. Our team will contact you with next steps.
              </DialogDescription>
              <Button
                onClick={() => setSelectedProgramId(null)}
                className="bg-[#d4af37] text-black uppercase tracking-widest rounded-none"
              >
                Close
              </Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl text-[#d4af37]">
                  Register: {selectedProgram?.title}
                </DialogTitle>
                <DialogDescription className="text-gray-400 font-light">
                  Fill in your details to secure your spot.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="training-name" className="text-[#d4af37] uppercase tracking-widest text-xs">
                    Full Name *
                  </Label>
                  <Input
                    id="training-name"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    className="bg-[#0a0508] border-[#d4af37]/30 text-white mt-1"
                    placeholder="Your full name"
                  />
                  {errors.fullName && <p className="text-red-400 text-xs mt-1">{errors.fullName}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="training-email" className="text-[#d4af37] uppercase tracking-widest text-xs">
                      Email *
                    </Label>
                    <Input
                      id="training-email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="bg-[#0a0508] border-[#d4af37]/30 text-white mt-1"
                      placeholder="you@example.com"
                    />
                    {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <Label htmlFor="training-phone" className="text-[#d4af37] uppercase tracking-widest text-xs">
                      Phone *
                    </Label>
                    <Input
                      id="training-phone"
                      value={form.phoneNumber}
                      onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                      className="bg-[#0a0508] border-[#d4af37]/30 text-white mt-1"
                      placeholder="07XXXXXXXX"
                    />
                    {errors.phoneNumber && <p className="text-red-400 text-xs mt-1">{errors.phoneNumber}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[#d4af37] uppercase tracking-widest text-xs">Category</Label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full bg-[#0a0508] border border-[#d4af37]/30 text-white px-3 py-2 mt-1 text-sm focus:border-[#d4af37] focus:outline-none"
                    >
                      {Object.entries(categoryLabels).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-[#d4af37] uppercase tracking-widest text-xs">Experience Level</Label>
                    <select
                      value={form.experienceLevel}
                      onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })}
                      className="w-full bg-[#0a0508] border border-[#d4af37]/30 text-white px-3 py-2 mt-1 text-sm focus:border-[#d4af37] focus:outline-none"
                    >
                      {Object.entries(experienceLabels).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="emergency-name" className="text-[#d4af37] uppercase tracking-widest text-xs">
                      Emergency Contact Name
                    </Label>
                    <Input
                      id="emergency-name"
                      value={form.emergencyContactName}
                      onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })}
                      className="bg-[#0a0508] border-[#d4af37]/30 text-white mt-1"
                      placeholder="Contact person"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergency-phone" className="text-[#d4af37] uppercase tracking-widest text-xs">
                      Emergency Contact Phone
                    </Label>
                    <Input
                      id="emergency-phone"
                      value={form.emergencyContactPhone}
                      onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })}
                      className="bg-[#0a0508] border-[#d4af37]/30 text-white mt-1"
                      placeholder="07XXXXXXXX"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="training-notes" className="text-[#d4af37] uppercase tracking-widest text-xs">
                    Notes
                  </Label>
                  <Textarea
                    id="training-notes"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="bg-[#0a0508] border-[#d4af37]/30 text-white mt-1"
                    placeholder="Anything we should know (optional)"
                    rows={3}
                  />
                </div>

                {selectedProgram && selectedProgram.feeKes > 0 && (
                  <p className="text-gray-400 text-xs font-light bg-[#0a0508] border border-[#d4af37]/20 p-3">
                    Program fee: <span className="text-[#d4af37] font-semibold">KES {selectedProgram.feeKes.toLocaleString()}</span>.
                    You will receive payment instructions after registration.
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={registerMutation.isPending}
                  className="w-full bg-[#d4af37] text-black hover:bg-white font-bold uppercase tracking-widest rounded-none py-6"
                >
                  {registerMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Registration"
                  )}
                </Button>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
