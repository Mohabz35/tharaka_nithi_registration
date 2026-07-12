import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RegistrationForm from "@/components/RegistrationForm";
import SuccessModal from "@/components/SuccessModal";
import CountdownTimer from "@/components/CountdownTimer";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function RegisterModel() {
  const [, setLocation] = useLocation();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<"adults" | "teens" | "little_stars">("adults");
  const [registrationData, setRegistrationData] = useState<{ participantName: string; registrationId: string } | null>(null);

  const handleRegistrationSuccess = (data: { participantName: string; registrationId: string }) => {
    setRegistrationData(data);
    setShowSuccessModal(true);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#2a0a1a] to-[#1a0a1a] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Button
          onClick={() => setLocation("/")}
          variant="outline"
          className="border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-black mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-[#d4af37] mb-3">Register as a Model</h1>
          <p className="text-white text-lg">
            Mr &amp; Miss Face of Tharaka-Nithi County 2026
          </p>
          <p className="text-gray-300 mt-2">Registration is completely FREE. Choose your category and complete the form.</p>
        </div>

        <div className="mb-10 max-w-2xl mx-auto">
          <CountdownTimer />
        </div>

        <Card className="bg-[#2a0a1a] border-[#d4af37] border-2">
          <CardContent className="pt-6">
            <Tabs
              defaultValue="adults"
              value={selectedCategory}
              onValueChange={(value) => setSelectedCategory(value as "adults" | "teens" | "little_stars")}
            >
              <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 bg-[#4a1a2a] h-auto gap-1 p-1">
                <TabsTrigger
                  value="adults"
                  className="data-[state=active]:bg-[#d4af37] data-[state=active]:text-black text-white"
                >
                  Adults (18–35)
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
                <RegistrationForm category="adults" onSuccess={handleRegistrationSuccess} />
              </TabsContent>

              <TabsContent value="teens" className="mt-6">
                <RegistrationForm category="teens" onSuccess={handleRegistrationSuccess} />
              </TabsContent>

              <TabsContent value="little_stars" className="mt-6">
                <RegistrationForm category="little_stars" onSuccess={handleRegistrationSuccess} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

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
    </main>
  );
}
