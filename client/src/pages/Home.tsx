import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RegistrationForm from "@/components/RegistrationForm";
import PaymentModal from "@/components/PaymentModal";
import CountdownTimer from "@/components/CountdownTimer";
import FeaturedModelsCarousel from "@/components/FeaturedModelsCarousel";
import { Crown, ChevronDown, Image } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<"adults" | "teens" | "little_stars">("adults");
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [registrationData, setRegistrationData] = useState<{ registrationId: string; fullName: string } | null>(null);

  const handleRegistrationSuccess = (data: { registrationId: string; fullName: string }) => {
    setRegistrationData(data);
    setRegistrationComplete(true);
    setShowPaymentModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#4a1a2a] via-[#5a2a3a] to-[#3a1a2a]">
      {/* Hero Section */}
      <section className="relative py-16 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img src="/manus-storage/royals-icon-logo_9a1f7c92.jpg" alt="Royals Icon Events" className="w-32 h-32 drop-shadow-lg" />
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold text-[#d4af37] mb-4 drop-shadow-lg">
            MODELS CALL OUT
          </h1>

          <p className="text-xl sm:text-2xl text-white mb-2">
            Mr & Miss Face of Tharaka-Nithi County 2026
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-6 text-white text-lg mb-8">
            <div className="flex items-center justify-center gap-2">
              <span className="text-[#d4af37] font-bold">📅</span>
              <span>September 12, 2026</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-[#d4af37] font-bold">📍</span>
              <span>Chuka Grounds</span>
            </div>
          </div>

          <p className="text-[#d4af37] italic text-lg mb-8">
            Fashion | Talent | Celebration
          </p>

          <div className="mb-8 max-w-2xl mx-auto">
            <CountdownTimer />
          </div>

          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              onClick={() => {
                const element = document.getElementById("register-section");
                if (element) {
                  element.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className="bg-[#d4af37] text-black hover:bg-[#e5c158] font-bold text-lg px-8 py-6 rounded-lg"
            >
              Register Now
            </Button>
            <Button
              onClick={() => setLocation("/gallery")}
              className="border-2 border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-black font-bold text-lg px-8 py-6 rounded-lg"
            >
              <Image className="w-5 h-5 mr-2" />
              View Gallery
            </Button>
          </div>
        </div>
      </section>

      {/* Eligibility Rules Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-black bg-opacity-30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-[#d4af37] mb-8 text-center">
            Eligibility Guidelines
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-[#2a0a1a] border-[#d4af37] border-2">
              <CardHeader>
                <CardTitle className="text-[#d4af37]">✓ Registration is FREE</CardTitle>
              </CardHeader>
              <CardContent className="text-white">
                No registration fees required. Participation in Mr & Miss Face of Tharaka-Nithi County 2026 is completely free of charge.
              </CardContent>
            </Card>

            <Card className="bg-[#2a0a1a] border-[#d4af37] border-2">
              <CardHeader>
                <CardTitle className="text-[#d4af37]">✓ All Are Welcome</CardTitle>
              </CardHeader>
              <CardContent className="text-white">
                No height restrictions. Tattoos and scars do not disqualify applicants. Your uniqueness is celebrated.
              </CardContent>
            </Card>

            <Card className="bg-[#2a0a1a] border-[#d4af37] border-2">
              <CardHeader>
                <CardTitle className="text-[#d4af37]">✓ Simple Documentation</CardTitle>
              </CardHeader>
              <CardContent className="text-white">
                Only National ID (adults) or Birth Certificate (minors) needed at registration.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Talents Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-[#d4af37] mb-8 text-center">
            Showcase Your Talents
          </h2>
          <div className="bg-[#2a0a1a] border-2 border-[#d4af37] rounded-lg p-8">
            <p className="text-white text-lg mb-6">
              This is your opportunity to shine! We celebrate diverse talents including modeling, dancing, singing, acting, and more. 
              Submit your portfolio or talent video to stand out from the crowd.
            </p>
            <ul className="text-white space-y-3 ml-6">
              <li className="flex items-start gap-3">
                <span className="text-[#d4af37] font-bold">•</span>
                <span>Professional modeling portfolio or headshots</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#d4af37] font-bold">•</span>
                <span>Dance, singing, or performance videos</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#d4af37] font-bold">•</span>
                <span>Acting or creative talent demonstrations</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#d4af37] font-bold">•</span>
                <span>Social media presence and influence</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Featured Models Carousel */}
      <FeaturedModelsCarousel />

      {/* Registration Section */}
      <section id="register-section" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-[#d4af37] mb-8 text-center">
            Register Now
          </h2>

          <Card className="bg-[#2a0a1a] border-[#d4af37] border-2">
            <CardContent className="pt-6">
              <Tabs
                defaultValue="adults"
                value={selectedCategory}
                onValueChange={(value) => setSelectedCategory(value as "adults" | "teens" | "little_stars")}
              >
                <TabsList className="grid w-full grid-cols-3 bg-[#4a1a2a]">
                  <TabsTrigger
                    value="adults"
                    className="data-[state=active]:bg-[#d4af37] data-[state=active]:text-black text-white"
                  >
                    Adults (18–26)
                  </TabsTrigger>
                  <TabsTrigger
                    value="teens"
                    className="data-[state=active]:bg-[#d4af37] data-[state=active]:text-black text-white"
                  >
                    Teens (13–17)
                  </TabsTrigger>
                  <TabsTrigger
                    value="little_stars"
                    className="data-[state=active]:bg-[#d4af37] data-[state=active]:text-black text-white"
                  >
                    Little Stars (5–12)
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="adults" className="mt-6">
                  <RegistrationForm
                    category="adults"
                    onSuccess={handleRegistrationSuccess}
                  />
                </TabsContent>

                <TabsContent value="teens" className="mt-6">
                  <RegistrationForm
                    category="teens"
                    onSuccess={handleRegistrationSuccess}
                  />
                </TabsContent>

                <TabsContent value="little_stars" className="mt-6">
                  <RegistrationForm
                    category="little_stars"
                    onSuccess={handleRegistrationSuccess}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setRegistrationComplete(false);
        }}
        category={selectedCategory}
        participantName={registrationData?.fullName}
        registrationId={registrationData?.registrationId}
      />

      {/* Footer */}
      <footer className="bg-black bg-opacity-50 py-8 px-4 text-center text-white border-t border-[#d4af37]">
        <p className="text-lg mb-2">Organized by</p>
        <p className="text-2xl font-bold text-[#d4af37]">Royals Icon Events</p>
        <p className="text-sm mt-4 text-gray-400">
          Email: contact@royalsiconevents.co.ke | Website: www.royalsiconevents.co.ke
        </p>
        <div className="mt-6 pt-6 border-t border-[#d4af37] border-opacity-30">
          <a
            href="/admin"
            className="text-[#d4af37] hover:text-[#e5c158] text-sm underline"
          >
            Admin Dashboard
          </a>
        </div>
      </footer>
    </div>
  );
}
