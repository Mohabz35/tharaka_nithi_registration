import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info, HelpCircle, Users, Palette, Sparkles, PhoneCall } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function SponsorsPartners() {
  const { data: partnersData } = trpc.gallery.getPartners.useQuery();

  const defaultPartners = [
    { name: "Tharaka-Nithi County", logoUrl: "/manus-storage/royals-icon-logo_9a1f7c92.jpg" },
    { name: "Royals Icon Events", logoUrl: "/manus-storage/royals-icon-logo_9a1f7c92.jpg" },
  ];

  const partners = partnersData && partnersData.length > 0 ? partnersData : defaultPartners;

  return (
    <section className="py-16 px-4 bg-black/40">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-[#d4af37] mb-12 text-center flex items-center justify-center gap-3">
          <Users className="w-8 h-8" />
          Sponsors & Partners
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center">
          {partners.map((partner, i) => (
            <div key={i} className="group flex flex-col items-center gap-4">
              <div className="w-32 h-32 rounded-full border-2 border-[#d4af37] p-2 bg-[#2a0a1a] group-hover:scale-110 transition-transform duration-300">
                <img src={partner.logoUrl} alt={partner.name} className="w-full h-full object-contain rounded-full" />
              </div>
              <p className="text-white text-sm font-semibold opacity-70 group-hover:opacity-100">{partner.name}</p>
            </div>
          ))}
          <Card className="bg-[#4a1a2a]/30 border-dashed border-2 border-[#d4af37] flex items-center justify-center p-6 w-32 h-32 rounded-full cursor-pointer hover:bg-[#4a1a2a]/50 transition-colors">
            <p className="text-[#d4af37] text-xs font-bold text-center">Your Logo Here</p>
          </Card>
        </div>
      </div>
    </section>
  );
}

export function RegisterArtist() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    artistType: "",
    phoneNumber: "",
    email: "",
    portfolioUrl: "",
    description: "",
  });

  const registerMutation = trpc.artist.register.useMutation({
    onSuccess: () => {
      toast.success("Artist registration submitted successfully!");
      setIsOpen(false);
      setFormData({
        fullName: "",
        artistType: "",
        phoneNumber: "",
        email: "",
        portfolioUrl: "",
        description: "",
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to register as artist");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(formData);
  };

  return (
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-gradient-to-br from-[#4a1a2a] to-[#2a0a1a] border-2 border-[#d4af37] overflow-hidden">
          <div className="md:flex">
            <div className="md:w-1/2 p-8 flex flex-col justify-center">
              <h2 className="text-3xl font-bold text-[#d4af37] mb-4 flex items-center gap-2">
                <Palette className="w-8 h-8" />
                Are You an Artist?
              </h2>
              <p className="text-white mb-6">
                Register to showcase your art, crafts, or performances during the event. Whether you are a painter, musician, or entertainer, we have a spot for you!
              </p>
              {!isOpen ? (
                <Button
                  onClick={() => setIsOpen(true)}
                  className="bg-[#d4af37] text-black hover:bg-[#e5c158] font-bold w-fit"
                >
                  Register Now
                </Button>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    placeholder="Full Name"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                    className="bg-black/50 text-white border-[#d4af37]/30"
                  />
                  <Input
                    placeholder="Artist Type (e.g. Musician, Dancer)"
                    value={formData.artistType}
                    onChange={(e) => setFormData({ ...formData, artistType: e.target.value })}
                    required
                    className="bg-black/50 text-white border-[#d4af37]/30"
                  />
                  <Input
                    placeholder="Phone Number"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    required
                    className="bg-black/50 text-white border-[#d4af37]/30"
                  />
                  <Input
                    placeholder="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="bg-black/50 text-white border-[#d4af37]/30"
                  />
                  <Input
                    placeholder="Portfolio URL (Optional)"
                    value={formData.portfolioUrl}
                    onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                    className="bg-black/50 text-white border-[#d4af37]/30"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={registerMutation.isPending}
                      className="flex-1 bg-[#d4af37] text-black hover:bg-[#e5c158] font-bold"
                    >
                      {registerMutation.isPending ? "Submitting..." : "Submit"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsOpen(false)}
                      className="text-white hover:bg-white/10"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>
            <div className="md:w-1/2 bg-black/50 p-8 border-l border-[#d4af37]/30">
              <h3 className="text-xl font-bold text-[#d4af37] mb-4">Showcase Opportunities</h3>
              <ul className="space-y-3 text-white">
                <li className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#d4af37]" />
                  Live Performance Slot
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#d4af37]" />
                  Exhibition Booth
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#d4af37]" />
                  Media Coverage
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#d4af37]" />
                  Networking with Industry Leaders
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}

export function BootcampShowcase() {
  return (
    <section className="py-16 px-4 bg-black/40">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#d4af37] mb-4">Bootcamp Showcase</h2>
          <p className="text-white opacity-80 max-w-2xl mx-auto">
            Get a glimpse of the intense training and transformation participants undergo during our exclusive bootcamp period.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="relative group overflow-hidden rounded-lg aspect-video border-2 border-[#d4af37]/30">
              <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent z-10" />
              <div className="w-full h-full bg-[#4a1a2a] flex items-center justify-center">
                <Users className="w-12 h-12 text-[#d4af37]/30" />
              </div>
              <div className="absolute bottom-4 left-4 z-20">
                <p className="text-[#d4af37] font-bold">Bootcamp Day {i}</p>
                <p className="text-white text-xs">Training & Mentorship Session</p>
              </div>
              <Button size="sm" className="absolute top-4 right-4 z-20 bg-black/50 border border-[#d4af37] text-white opacity-0 group-hover:opacity-100 transition-opacity">
                Know More
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SupportPanel() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-[#2a0a1a] border-2 border-[#d4af37] rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8">
          <div className="w-24 h-24 bg-[#d4af37] rounded-full flex items-center justify-center flex-shrink-0">
            <HelpCircle className="w-12 h-12 text-black" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold text-[#d4af37] mb-2">Need Help or Information?</h2>
            <p className="text-white opacity-80 mb-4">
              Our support team is available 24/7 to assist you with registration, event details, or partnership inquiries.
            </p>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <Button variant="outline" className="border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-black font-bold">
                <Info className="w-4 h-4 mr-2" />
                Know More
              </Button>
              <Button className="bg-[#d4af37] text-black hover:bg-[#e5c158] font-bold">
                <PhoneCall className="w-4 h-4 mr-2" />
                Support Panel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
