import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Heart, Users, Mic, Calendar } from "lucide-react";

export default function EventSections() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"sponsors" | "partners" | "artists" | "bootcamp">("sponsors");

  const sections = {
    sponsors: {
      title: "Become a Sponsor",
      icon: Heart,
      description: "Support the Mr & Miss Face of Tharaka-Nithi County 2026 event and gain brand visibility.",
      content: (
        <div className="space-y-4">
          <p className="text-white">
            We're looking for sponsors to help make this event spectacular! Your sponsorship will:
          </p>
          <ul className="text-white space-y-2 list-disc list-inside">
            <li>Gain prominent brand visibility at the event</li>
            <li>Be featured on all event marketing materials</li>
            <li>Reach thousands of attendees and online viewers</li>
            <li>Support talented models and artists in Tharaka-Nithi County</li>
          </ul>
          <Button
            onClick={() => alert("Contact us at support@royaliconevents.co.ke for sponsorship opportunities")}
            className="bg-[#d4af37] text-black hover:bg-[#e5c158] font-bold mt-4"
          >
            Become a Sponsor
          </Button>
        </div>
      ),
    },
    partners: {
      title: "Partner With Us",
      icon: Users,
      description: "Join us as a partner and be part of this exciting event.",
      content: (
        <div className="space-y-4">
          <p className="text-white">
            We welcome partnerships with organizations, businesses, and media outlets.
          </p>
          <ul className="text-white space-y-2 list-disc list-inside">
            <li>Media partnerships for event coverage</li>
            <li>Business collaborations and cross-promotions</li>
            <li>Community organization partnerships</li>
            <li>Exclusive partnership packages available</li>
          </ul>
          <Button
            onClick={() => alert("Contact us at support@royaliconevents.co.ke")}
            className="bg-[#d4af37] text-black hover:bg-[#e5c158] font-bold mt-4"
          >
            Partner With Us
          </Button>
        </div>
      ),
    },
    artists: {
      title: "Register as an Artist",
      icon: Mic,
      description: "Showcase your talent at our event.",
      content: (
        <div className="space-y-4">
          <p className="text-white">
            We're looking for talented artists to perform at the event. Artists can register to:
          </p>
          <ul className="text-white space-y-2 list-disc list-inside">
            <li>Perform live at the Models Call Out event</li>
            <li>Showcase your music, dance, or other talents</li>
            <li>Gain exposure to a large audience</li>
            <li>Network with other artists and industry professionals</li>
          </ul>
          <Button
            onClick={() => { window.location.href = "/#artists-section"; }}
            className="bg-[#d4af37] text-black hover:bg-[#e5c158] font-bold mt-4"
          >
            Register as Artist
          </Button>
        </div>
      ),
    },
    bootcamp: {
      title: "Event Day Showcase",
      icon: Calendar,
      description: "Register to showcase your talents during the bootcamp period.",
      content: (
        <div className="space-y-4">
          <p className="text-white">
            The bootcamp period is your chance to showcase your talents before the main event. Register to:
          </p>
          <ul className="text-white space-y-2 list-disc list-inside">
            <li>Participate in talent workshops and training sessions</li>
            <li>Get feedback from industry professionals</li>
            <li>Network with other participants</li>
            <li>Prepare for the main event showcase</li>
          </ul>
          <Button
            onClick={() => { window.location.href = "/#artists-section"; }}
            className="bg-[#d4af37] text-black hover:bg-[#e5c158] font-bold mt-4"
          >
            Register for Bootcamp
          </Button>
        </div>
      ),
    },
  };

  const currentSection = sections[activeTab];
  const Icon = currentSection.icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#2a0a1a] to-[#1a0a1a] py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-[#d4af37] mb-4">Event Opportunities</h1>
          <p className="text-white text-lg">
            Multiple ways to be part of the Mr & Miss Face of Tharaka-Nithi County 2026
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {(["sponsors", "partners", "artists", "bootcamp"] as const).map((tab) => {
            const TabIcon = sections[tab].icon;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all ${
                  activeTab === tab
                    ? "bg-[#d4af37] text-black shadow-lg shadow-[#d4af37]"
                    : "bg-[#2a0a1a] text-[#d4af37] border-2 border-[#d4af37] hover:bg-[#3a1a2a]"
                }`}
              >
                <TabIcon className="w-5 h-5" />
                {sections[tab].title}
              </button>
            );
          })}
        </div>

        {/* Content Card */}
        <Card className="bg-[#2a0a1a] border-[#d4af37] border-2">
          <CardHeader className="border-b-2 border-[#d4af37]">
            <div className="flex items-center gap-3">
              <Icon className="w-8 h-8 text-[#d4af37]" />
              <div>
                <CardTitle className="text-[#d4af37] text-2xl">{currentSection.title}</CardTitle>
                <p className="text-gray-400 text-sm mt-1">{currentSection.description}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">{currentSection.content}</CardContent>
        </Card>

        {/* Back Button */}
        <div className="text-center mt-8">
          <Button
            onClick={() => setLocation("/")}
            variant="outline"
            className="border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-black"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
