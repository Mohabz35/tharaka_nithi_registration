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

const SHOWCASE_TYPES = ["Fashion Brand", "Jewelry", "Beauty & Cosmetics", "Food & Drinks", "Photography", "Art & Crafts", "Tech", "Other"];

export default function ShowcaseRegistrationForm({ onSuccess }: Props) {
  const [formData, setFormData] = useState({
    fullName: "",
    businessName: "",
    email: "",
    phoneNumber: "",
    showcaseType: "",
    description: "",
  });

  const mutation = trpc.showcase.register.useMutation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!formData.fullName || !formData.email || !formData.phoneNumber || !formData.showcaseType) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      await mutation.mutateAsync(formData);
      toast.success("Showcase registration submitted! We'll be in touch soon.");
      onSuccess?.();
    } catch (error) {
      toast.error("Submission failed. Please try again.");
      console.error(error);
    }
  };

  return (
    <Card className="bg-[#2a0a1a] border-[#d4af37] border-2">
      <CardHeader>
        <CardTitle className="text-[#d4af37] text-xl">🎪 Showcase Your Brand</CardTitle>
        <p className="text-gray-400 text-sm">
          Display your products or services at the Mr & Miss Face of Tharaka-Nithi County 2026 event
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
            <label className="text-white block mb-1">Business / Brand Name</label>
            <Input name="businessName" value={formData.businessName} onChange={handleChange}
              placeholder="Your business or brand" className="bg-[#4a1a2a] text-white border-[#d4af37]" />
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
          <label className="text-white block mb-2">Showcase Category *</label>
          <div className="flex flex-wrap gap-2">
            {SHOWCASE_TYPES.map(type => (
              <Button key={type} type="button"
                onClick={() => setFormData({ ...formData, showcaseType: type })}
                className={`px-3 py-1 text-sm rounded-full font-medium transition-all ${
                  formData.showcaseType === type
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
          <label className="text-white block mb-1">Description</label>
          <Textarea name="description" value={formData.description} onChange={handleChange as any}
            placeholder="Describe what you'd like to showcase..." className="bg-[#4a1a2a] text-white border-[#d4af37] min-h-24" />
        </div>

        <Button onClick={handleSubmit} disabled={mutation.isPending}
          className="w-full bg-[#d4af37] text-black hover:bg-[#e5c158] font-bold py-3">
          {mutation.isPending ? "Submitting..." : "Register to Showcase"}
        </Button>
      </CardContent>
    </Card>
  );
}
