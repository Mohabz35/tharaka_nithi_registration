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
    <Card className="bg-[#140a10] border-[#3a1c28] border-none shadow-2xl rounded-none">
      <CardHeader className="text-center pb-8 border-b border-[#3a1c28] mb-8 relative">
        {/* Decorative classic line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 text-[#d4af37]/40 text-sm tracking-[0.3em]">
          ✦ ——————— ✦ ——————— ✦
        </div>
        <CardTitle className="text-[#d4af37] text-3xl font-serif mt-6 uppercase tracking-widest">
          Partner With Us
        </CardTitle>
        <div className="w-16 h-1 bg-[#d4af37] mx-auto mt-4 mb-6"></div>
        <div className="text-gray-400 text-sm max-w-xl mx-auto space-y-4 font-light leading-relaxed">
          <p>
            Join us in redefining beauty, talent, and leadership in Tharaka Nithi. By partnering with Mr & Miss Face of Tharaka Nithi, you position your brand at the forefront of youth empowerment and cultural celebration.
          </p>
          <p className="text-[#d4af37] italic">
            Enjoy premium brand exposure, direct community engagement, and the prestige of associating with the county's premier event.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 max-w-2xl mx-auto">
        <div className="flex gap-3 mb-4">
          <Button
            type="button"
            onClick={() => setFormData({ ...formData, sponsorType: "sponsor" })}
            className={`flex-1 font-semibold uppercase tracking-wider rounded-none py-6 transition-all duration-300 ${
              formData.sponsorType === "sponsor"
                ? "bg-[#d4af37] text-black"
                : "bg-transparent text-gray-500 border border-[#3a1c28] hover:border-[#d4af37] hover:text-[#d4af37]"
            }`}
          >
            🏆 Event Sponsor
          </Button>
          <Button
            type="button"
            onClick={() => setFormData({ ...formData, sponsorType: "partner" })}
            className={`flex-1 font-semibold uppercase tracking-wider rounded-none py-6 transition-all duration-300 ${
              formData.sponsorType === "partner"
                ? "bg-[#d4af37] text-black"
                : "bg-transparent text-gray-500 border border-[#3a1c28] hover:border-[#d4af37] hover:text-[#d4af37]"
            }`}
          >
            🤝 Event Partner
          </Button>
        </div>

        <div className="text-center text-[#d4af37]/30 text-xs tracking-[0.2em] my-6">
          ✦ ——————— ✦
        </div>

        <div>
          <label className="text-gray-400 block mb-2 text-sm uppercase tracking-wider">Contact Person *</label>
          <Input name="fullName" value={formData.fullName} onChange={handleChange}
            placeholder="Full name" className="bg-[#0a0508] text-white border-[#3a1c28] focus-visible:border-[#d4af37] rounded-none py-6" />
        </div>
        <div>
          <label className="text-gray-400 block mb-2 text-sm uppercase tracking-wider">Organization / Brand Name</label>
          <Input name="organizationName" value={formData.organizationName} onChange={handleChange}
            placeholder="Company or brand name" className="bg-[#0a0508] text-white border-[#3a1c28] focus-visible:border-[#d4af37] rounded-none py-6" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-gray-400 block mb-2 text-sm uppercase tracking-wider">Email *</label>
            <Input name="email" type="email" value={formData.email} onChange={handleChange}
              placeholder="email@example.com" className="bg-[#0a0508] text-white border-[#3a1c28] focus-visible:border-[#d4af37] rounded-none py-6" />
          </div>
          <div>
            <label className="text-gray-400 block mb-2 text-sm uppercase tracking-wider">Phone Number *</label>
            <Input name="phoneNumber" value={formData.phoneNumber} onChange={handleChange}
              placeholder="+254..." className="bg-[#0a0508] text-white border-[#3a1c28] focus-visible:border-[#d4af37] rounded-none py-6" />
          </div>
        </div>
        <div>
          <label className="text-gray-400 block mb-2 text-sm uppercase tracking-wider">How would you like to partner? (Optional)</label>
          <Textarea name="message" value={formData.message} onChange={handleChange}
            placeholder="Tell us about your organization and partnership ideas..."
            className="bg-[#0a0508] text-white border-[#3a1c28] focus-visible:border-[#d4af37] rounded-none min-h-[120px]" />
        </div>
        <Button 
          onClick={handleSubmit} 
          disabled={mutation.isPending}
          className="w-full bg-[#d4af37] text-black hover:bg-white hover:text-black font-semibold uppercase tracking-widest text-sm rounded-none py-7 mt-8 transition-colors duration-300"
        >
          {mutation.isPending ? "Submitting..." : "Submit Partnership Request"}
        </Button>
      </CardContent>
    </Card>
  );
}
