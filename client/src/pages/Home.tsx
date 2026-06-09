import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RegistrationForm from "@/components/RegistrationForm";
import SuccessModal from "@/components/SuccessModal";
import CountdownTimer from "@/components/CountdownTimer";
import FeaturedModelsCarousel from "@/components/FeaturedModelsCarousel";
import { Crown, ChevronDown, Image } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<"adults" | "teens" | "little_stars">("adults");
  const [registrationData, setRegistrationData] = useState<{participantName: string, registrationId: string} | null>(null);

  const handleRegistrationSuccess = (data: { participantName: string; registrationId: string }) => {
    setRegistrationData(data);
    setShowSuccessModal(true);
  };

  return (
    <div className="min-h-screen bg-black" style={{ backgroundImage: "url('/manus-storage/royals-icon-logo_9a1f7c92.jpg')", backgroundSize: 'cover', backgroundAttachment: 'fixed', backgroundPosition: 'center', backgroundBlendMode: 'overlay', backgroundColor: 'rgba(74, 26, 42, 0.92)' }}>
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
                No registration fees required. Only M-PESA payment at submission for participation.
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

      {/* Success Modal */}
      {registrationData && (
        <SuccessModal
          isOpen={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false);
            setRegistrationData(null);
          }}
          category={selectedCategory}
          participantName={registrationData.participantName}
          registrationId={registrationData.registrationId}
        />
      )}

      {/* Sponsor & Partner Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[#2a0a1a] to-[#4a1a2a]">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-[#d4af37] mb-12">Collaborate With Us</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-[#1a0a1a] border-[#d4af37] border-2">
              <CardHeader>
                <CardTitle className="text-[#d4af37] text-2xl">Sponsor Event</CardTitle>
              </CardHeader>
              <CardContent className="text-white space-y-4 text-left">
                <p>Support the biggest modeling event in Tharaka-Nithi County. Gain premium brand exposure and connect with our vibrant audience.</p>
                <Button className="bg-[#d4af37] text-black hover:bg-[#e5c158] font-bold w-full">Become a Sponsor</Button>
              </CardContent>
            </Card>

            <Card className="bg-[#1a0a1a] border-[#d4af37] border-2">
              <CardHeader>
                <CardTitle className="text-[#d4af37] text-2xl">Partner With Us</CardTitle>
              </CardHeader>
              <CardContent className="text-white space-y-4 text-left">
                <p>We are open to partnerships with media houses, fashion brands, and local businesses to make this event a success.</p>
                <Button className="border-2 border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-black font-bold w-full">Join as a Partner</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Artists & Showcasing Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-black bg-opacity-60">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-[#d4af37] mb-12">More Opportunities</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-[#2a0a1a] border-0">
              <CardHeader>
                <CardTitle className="text-[#d4af37] text-2xl">Register as Artist</CardTitle>
              </CardHeader>
              <CardContent className="text-white space-y-4">
                <p>Are you a makeup artist, photographer, or performer? Register to showcase your skills during the main event.</p>
                <Button className="bg-[#d4af37] text-black hover:bg-[#e5c158] font-bold">Register Now</Button>
              </CardContent>
            </Card>

            <Card className="bg-[#2a0a1a] border-0">
              <CardHeader>
                <CardTitle className="text-[#d4af37] text-2xl">Showcasing</CardTitle>
              </CardHeader>
              <CardContent className="text-white space-y-4">
                <p>Designers and brands can book a slot to showcase their latest collections on our grand runway.</p>
                <Button className="border-2 border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-black font-bold">Book a Slot</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Know More & Support Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#1a0a1a] border-t border-b border-[#d4af37]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-[#d4af37] mb-6">Know More & Support</h2>
          <p className="text-white mb-8">
            Need a physical form for the bootcamp? Download the printable registration form below.
            For any queries, our support panel is always ready to assist you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              className="bg-[#d4af37] text-black hover:bg-[#e5c158] font-bold px-8 py-6 rounded-lg text-lg"
              onClick={() => {
                const link = document.createElement("a");
                link.href = "/printable_form.pdf";
                link.download = "Printable_Registration_Form.pdf";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
            >
              Download Printable Form
            </Button>
            <Button className="border-2 border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-black font-bold px-8 py-6 rounded-lg text-lg">
              Contact Support Panel
            </Button>
          </div>
        </div>
      </section>

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
