import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface Props {
  onSuccess?: () => void;
}

const ART_TYPES = ["Music", "Dance", "Poetry", "Comedy", "Spoken Word", "Drama", "DJ", "MC/Emcee", "Other"];

export default function ArtistRegistrationForm({ onSuccess }: Props) {
  const [formData, setFormData] = useState({
    fullName: "",
    stageName: "",
    email: "",
    phoneNumber: "",
    artType: "",
    socialMediaHandles: "",
    message: "",
  });

  const mutation = trpc.artist.register.useMutation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!formData.fullName || !formData.email || !formData.phoneNumber || !formData.artType) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      await mutation.mutateAsync(formData);
      toast.success("Artist registration submitted! We'll be in touch soon.");
      onSuccess?.();
    } catch (error) {
      toast.error("Submission failed. Please try again.");
      console.error(error);
    }
  };

  return (
    <Card className="bg-[#2a0a1a] border-[#d4af37] border-2">
      <CardHeader>
        <CardTitle className="text-[#d4af37] text-xl">🎤 Register as an Artist</CardTitle>
        <p className="text-gray-400 text-sm">
          Perform and showcase your art at the Mr & Miss Face of Tharaka-Nithi County 2026
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-white block mb-1">Full Name *</label>
            <Input name="fullName" value={formData.fullName} onChange={handleChange}
              placeholder="Your full name" className="bg-[#4a1a2a] text-white border-[#d4af37]" />
          </div>
          <div>
            <label className="text-white block mb-1">Stage Name</label>
            <Input name="stageName" value={formData.stageName} onChange={handleChange}
              placeholder="Your stage/artist name" className="bg-[#4a1a2a] text-white border-[#d4af37]" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-white block mb-1">Email *</label>
            <Input name="email" type="email" value={formData.email} onChange={handleChange}
              placeholder="email@example.com" className="bg-[#4a1a2a] text-white border-[#d4af37]" />
          </div>
          <div>
            <label className="text-white block mb-1">Phone Number *</label>
            <Input name="phoneNumber" value={formData.phoneNumber} onChange={handleChange}
              placeholder="+254..." className="bg-[#4a1a2a] text-white border-[#d4af37]" />
          </div>
        </div>
        <div>
          <label className="text-white block mb-2">Art Type *</label>
          <div className="flex flex-wrap gap-2">
            {ART_TYPES.map(type => (
              <Button key={type} type="button"
                onClick={() => setFormData({ ...formData, artType: type })}
                className={`px-3 py-1 text-sm rounded-full font-medium transition-all ${
                  formData.artType === type
                    ? "bg-[#d4af37] text-black"
                    : "bg-[#4a1a2a] text-[#d4af37] border border-[#d4af37] hover:bg-[#5a2a3a]"
                }`}
              >
                {type}
              </Button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-white block mb-1">Social Media Links</label>
          <Input name="socialMediaHandles" value={formData.socialMediaHandles} onChange={handleChange}
            placeholder="Instagram, TikTok, YouTube links..." className="bg-[#4a1a2a] text-white border-[#d4af37]" />
        </div>
        <div>
          <label className="text-white block mb-1">Tell Us About Yourself</label>
          <Textarea name="message" value={formData.message} onChange={handleChange as any}
            placeholder="Brief description of your art and performance style..." className="bg-[#4a1a2a] text-white border-[#d4af37] min-h-24" />
        </div>

        <Button onClick={handleSubmit} disabled={mutation.isPending}
          className="w-full bg-[#d4af37] text-black hover:bg-[#e5c158] font-bold py-3">
          {mutation.isPending ? "Submitting..." : "Register as Artist"}
        </Button>
      </CardContent>
    </Card>
  );
}
