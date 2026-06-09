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

export default function SponsorRegistrationForm({ onSuccess }: Props) {
  const [formData, setFormData] = useState({
    fullName: "",
    organizationName: "",
    email: "",
    phoneNumber: "",
    sponsorType: "sponsor" as "sponsor" | "partner",
    message: "",
  });

  const mutation = trpc.sponsor.register.useMutation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!formData.fullName || !formData.email || !formData.phoneNumber) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      await mutation.mutateAsync(formData);
      toast.success("Application submitted successfully! We'll be in touch soon.");
      onSuccess?.();
    } catch (error) {
      toast.error("Submission failed. Please try again.");
      console.error(error);
    }
  };

  return (
    <Card className="bg-[#2a0a1a] border-[#d4af37] border-2">
      <CardHeader>
        <CardTitle className="text-[#d4af37] text-xl">Sponsor / Partner Registration</CardTitle>
        <p className="text-gray-400 text-sm">
          Join us as a sponsor or partner for the Mr & Miss Face of Tharaka-Nithi County 2026
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3 mb-4">
          <Button
            type="button"
            onClick={() => setFormData({ ...formData, sponsorType: "sponsor" })}
            className={`flex-1 font-bold ${
              formData.sponsorType === "sponsor"
                ? "bg-[#d4af37] text-black"
                : "bg-[#4a1a2a] text-[#d4af37] border border-[#d4af37]"
            }`}
          >
            🏆 Event Sponsor
          </Button>
          <Button
            type="button"
            onClick={() => setFormData({ ...formData, sponsorType: "partner" })}
            className={`flex-1 font-bold ${
              formData.sponsorType === "partner"
                ? "bg-[#d4af37] text-black"
                : "bg-[#4a1a2a] text-[#d4af37] border border-[#d4af37]"
            }`}
          >
            🤝 Event Partner
          </Button>
        </div>

        <div>
          <label className="text-white block mb-1">Contact Person *</label>
          <Input name="fullName" value={formData.fullName} onChange={handleChange}
            placeholder="Full name" className="bg-[#4a1a2a] text-white border-[#d4af37]" />
        </div>
        <div>
          <label className="text-white block mb-1">Organization / Brand Name</label>
          <Input name="organizationName" value={formData.organizationName} onChange={handleChange}
            placeholder="Company or brand name" className="bg-[#4a1a2a] text-white border-[#d4af37]" />
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
          <label className="text-white block mb-1">Message / What You'd Like to Offer</label>
          <Textarea name="message" value={formData.message} onChange={handleChange as any}
            placeholder="Tell us how you'd like to be involved..." className="bg-[#4a1a2a] text-white border-[#d4af37] min-h-24" />
        </div>

        <Button onClick={handleSubmit} disabled={mutation.isPending}
          className="w-full bg-[#d4af37] text-black hover:bg-[#e5c158] font-bold py-3">
          {mutation.isPending ? "Submitting..." : "Submit Application"}
        </Button>
      </CardContent>
    </Card>
  );
}
