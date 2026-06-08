import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RegistrationForm from "@/components/RegistrationForm";
import PaymentModal from "@/components/PaymentModal";
import { Crown, ChevronDown } from "lucide-react";

export default function Home() {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<"adults" | "teens" | "little_stars">("adults");
  const [registrationComplete, setRegistrationComplete] = useState(false);

  const handleRegistrationSuccess = () => {
    setRegistrationComplete(true);
    setShowPaymentModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#4a1a2a] via-[#5a2a3a] to-[#3a1a2a]">
      {/* Hero Section */}
      <section className="relative py-16 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Crown Icon */}
          <div className="flex justify-center mb-6">
            <Crown className="w-16 h-16 text-[#d4af37]" fill="#d4af37" />
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
              <span>September 15, 2026</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-[#d4af37] font-bold">📍</span>
              <span>Chuka Grounds</span>
            </div>
          </div>

          <p className="text-[#d4af37] italic text-lg mb-8">
            Fashion | Talent | Celebration
          </p>

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
                <CardTitle className="text-[#d4af37]">✓ No Height Restrictions</CardTitle>
              </CardHeader>
              <CardContent className="text-white">
                Beauty and talent come in all heights. Participate regardless of your stature.
              </CardContent>
            </Card>

            <Card className="bg-[#2a0a1a] border-[#d4af37] border-2">
              <CardHeader>
                <CardTitle className="text-[#d4af37]">✓ Tattoos & Scars Welcome</CardTitle>
              </CardHeader>
              <CardContent className="text-white">
                Your unique story is celebrated. No disqualifications for visible marks.
              </CardContent>
            </Card>

            <Card className="bg-[#2a0a1a] border-[#d4af37] border-2">
              <CardHeader>
                <CardTitle className="text-[#d4af37]">✓ Simple Documentation</CardTitle>
              </CardHeader>
              <CardContent className="text-white">
                Only National ID (adults) or Birth Certificate (minors) needed to register.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

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
