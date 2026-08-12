import { useState, Suspense, lazy } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RegistrationForm from "@/components/RegistrationForm";
import SuccessModal from "@/components/SuccessModal";
import CountdownTimer from "@/components/CountdownTimer";
import SocialMediaFooter from "@/components/SocialMediaFooter";
import { Image, Sparkles, Vote, Ticket, Star, Users, MapPin, Heart, ShoppingCart } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

// Lazy-load heavy below-the-fold components
const FeaturedModelsCarousel = lazy(() => import("@/components/FeaturedModelsCarousel"));
const SponsorRegistrationForm = lazy(() => import("@/components/SponsorRegistrationForm"));
const ArtistRegistrationForm = lazy(() => import("@/components/ArtistRegistrationForm"));
const ShowcaseRegistrationForm = lazy(() => import("@/components/ShowcaseRegistrationForm"));

const SectionLoader = () => <div className="h-32 animate-pulse bg-[#2a0a1a] rounded-lg" />;

export default function Home() {
  const [, setLocation] = useLocation();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<"adults" | "teens" | "little_stars">("adults");
  const [registrationData, setRegistrationData] = useState<{participantName: string, registrationId: string} | null>(null);

  const { data: settings } = trpc.siteSettings.getAll.useQuery();
  const announcementText = settings?.announcement_text;

  const handleRegistrationSuccess = (data: { participantName: string; registrationId: string }) => {
    setRegistrationData(data);
    setShowSuccessModal(true);
  };

  const VOTING_URL = "https://www.royaliconevents.co.ke/competitions/mr-and-miss-tharaka-nithi-2026";
  const TICKETS_URL = "https://www.royaliconevents.co.ke/events/mr-and-miss-tharaka-nithi-2026";

  const scrollToRegistration = () => {
    document.getElementById("register-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-black font-sans text-white selection:bg-[#d4af37] selection:text-black">
      {/* Dynamic Top Banner */}
      {announcementText && (
        <div className="bg-[#d4af37] text-black text-center py-6 px-4 font-bold text-lg sm:text-2xl md:text-3xl animate-pulse shadow-lg shadow-[#d4af37]/20 tracking-wide">
          {announcementText}
        </div>
      )}

      {/* Hero Section */}
      <section 
        className="relative pt-12 pb-24 px-4 sm:px-6 lg:px-8 text-center border-b border-[#3a1c28]"
        style={{ 
          backgroundImage: "url('/ri_logo_transparent.png')", 
          backgroundSize: 'cover', 
          backgroundAttachment: 'fixed', 
          backgroundPosition: 'center', 
          backgroundBlendMode: 'overlay', 
          backgroundColor: 'rgba(20, 5, 10, 0.95)' 
        }}
      >
        <div className="max-w-5xl mx-auto">
          {/* Logo & Banner */}
          <div className="flex flex-col items-center justify-center mb-10 space-y-8">
            <img 
              src="/ri_logo_white.png" 
              alt="Royals Icon Events" 
              className="w-48 md:w-64 drop-shadow-2xl mb-4" 
              fetchPriority="high" 
            />
            <img
              src="/mr_miss_tharaka_nithi_banner.png"
              alt="Mr and Miss Face of Tharaka-Nithi County 2026"
              className="w-full max-w-4xl mx-auto rounded-none shadow-2xl border border-[#d4af37]/30"
              fetchPriority="high"
            />
          </div>

          <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl font-bold text-[#d4af37] mb-6 drop-shadow-xl leading-tight uppercase tracking-wider">
            Mr & Miss Face of Tharaka-Nithi
          </h1>

          <p className="font-serif text-xl sm:text-3xl text-gray-200 mb-4 italic tracking-wide">
            "Redefining Modern Masculinity & Femininity"
          </p>

          <p className="text-md sm:text-lg text-gray-400 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
            The ultimate platform for models who embody leadership, talent, and community service. <br/>
            Featuring top talents from Chuka University, Tharaka Nithi University, and Chuka TC.
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap gap-6 justify-center items-center w-full max-w-md mx-auto sm:max-w-none mb-12">
            <Button
              onClick={scrollToRegistration}
              className="bg-[#d4af37] text-black hover:bg-white hover:text-black font-semibold uppercase tracking-widest text-sm px-10 py-7 rounded-none transition-all duration-300 w-full sm:w-auto"
            >
              Apply As Contestant
            </Button>
            <Button
              variant="outline" 
              className="border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-black transition-colors rounded-none px-8 py-6 tracking-wider uppercase text-sm"
              onClick={() => window.open(VOTING_URL, "_blank", "noopener,noreferrer")}
            >
              <Vote className="w-4 h-4 mr-3" />
              Vote Now
            </Button>
            <Button
              variant="outline" 
              className="border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-black transition-colors rounded-none px-8 py-6 tracking-wider uppercase text-sm"
              onClick={() => setLocation("/merchandise")}
            >
              <ShoppingCart className="w-4 h-4 mr-3" />
              Shop Merchandise
            </Button>
          </div>

          <div className="max-w-2xl mx-auto border-t border-[#d4af37]/20 pt-8">
            <p className="text-[#d4af37] text-sm uppercase tracking-[0.2em] mb-4">Time Remaining</p>
            <CountdownTimer />
          </div>
        </div>
      </section>

      {/* Phase 1 Results Announcement */}
      <section className="bg-gradient-to-r from-[#1a0c14] via-[#3a1c2a] to-[#1a0c14] border-b border-[#d4af37]/50 py-16 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-overlay"></div>
        <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center justify-center gap-6">
          <h2 className="text-[#d4af37] font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-wide flex items-center justify-center gap-3">
            <Star className="w-8 h-8 sm:w-10 sm:h-10 text-[#d4af37] animate-pulse" />
            Hurray! Phase 1 Results are out!
            <Star className="w-8 h-8 sm:w-10 sm:h-10 text-[#d4af37] animate-pulse" />
          </h2>
          <p className="text-white/90 text-lg sm:text-xl font-light max-w-3xl mx-auto">
            Congratulations to all our top performers who made it through the Introduction & Auditions phase. Visit the gallery to see our contestants and download the official results notice.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <Button
              onClick={() => setLocation("/gallery")}
              className="bg-[#d4af37] text-black hover:bg-white px-8 py-6 font-bold uppercase tracking-widest text-sm rounded-none shadow-[0_0_15px_rgba(212,175,55,0.4)] hover:shadow-[0_0_25px_rgba(212,175,55,0.8)] transition-all"
            >
              View Top Profiles
            </Button>
            <a
              href="/downloads/phase1_results.pdf"
              download
              className="flex items-center justify-center gap-2 border border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-black px-8 py-6 font-bold uppercase tracking-widest text-sm transition-all rounded-none"
            >
              <Ticket className="w-4 h-4" />
              Download Results Notice
            </a>
          </div>
        </div>
      </section>

      {/* The Crown Awaits (Two Columns) */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0a0508]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl sm:text-5xl font-bold text-white mb-4 uppercase tracking-wider">The Crown Awaits</h2>
            <div className="w-24 h-1 bg-[#d4af37] mx-auto"></div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-[#140a10] border border-[#d4af37]/30 p-10 flex flex-col justify-center items-center text-center transition-transform hover:-translate-y-2 duration-300">
              <Vote className="w-16 h-16 text-[#d4af37] mb-6" />
              <h3 className="font-serif text-3xl text-white mb-4">Support Your Favourite</h3>
              <p className="text-gray-400 mb-8 font-light">
                Phase 2 Voting has officially begun! Every vote counts towards crowning the next Face of Tharaka Nithi. Show your support and make history.
              </p>
              <Button
                onClick={() => window.open(VOTING_URL, "_blank", "noopener,noreferrer")}
                className="bg-[#d4af37] text-black hover:bg-white font-semibold uppercase tracking-widest px-8 py-6 rounded-none w-full max-w-xs"
              >
                Cast Your Vote
              </Button>
            </div>

            <div className="bg-[#140a10] border border-[#d4af37]/30 p-10 flex flex-col justify-center items-center text-center transition-transform hover:-translate-y-2 duration-300">
              <Ticket className="w-16 h-16 text-[#d4af37] mb-6" />
              <h3 className="font-serif text-3xl text-white mb-4">Grab Your Tickets</h3>
              <p className="text-gray-400 mb-8 font-light">
                Join us live on September 12, 2026, at Chuka Grounds for a night of fashion, talent, and celebration. Secure your spot at the grand finale.
              </p>
              <Button
                onClick={() => window.open(TICKETS_URL, "_blank", "noopener,noreferrer")}
                className="bg-transparent border border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-black font-semibold uppercase tracking-widest px-8 py-6 rounded-none w-full max-w-xs"
              >
                Buy Tickets
              </Button>
            </div>
          </div>

          {/* Merchandise Section */}
          <div className="mt-12">
            <div className="bg-[#140a10] border border-[#d4af37]/30 p-10 flex flex-col justify-center items-center text-center transition-transform hover:-translate-y-2 duration-300">
              <ShoppingCart className="w-16 h-16 text-[#d4af37] mb-6" />
              <h3 className="font-serif text-3xl text-white mb-4">Official Merchandise</h3>
              <p className="text-gray-400 mb-8 font-light">
                Get exclusive bootcamp access, event t-shirts, hoodies, and more. Support the event and look stylish while doing it!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                <Button
                  onClick={() => setLocation("/merchandise")}
                  className="bg-[#d4af37] text-black hover:bg-white font-semibold uppercase tracking-widest px-8 py-6 rounded-none flex-1"
                >
                  Shop Now
                </Button>
                <Button
                  onClick={() => setLocation("/my-orders")}
                  className="bg-transparent border border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-black font-semibold uppercase tracking-widest px-8 py-6 rounded-none flex-1"
                >
                  My Orders
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Us (New Section) */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#1a0c14] relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
          <img src="/royal_icon_events_logo_new.png" alt="bg watermark" className="w-96 h-96 object-cover" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="font-serif text-4xl sm:text-5xl font-bold text-[#d4af37] mb-8 uppercase tracking-widest">
            A New Legacy Begins
          </h2>
          <div className="w-16 h-[2px] bg-white mx-auto mb-10"></div>
          <p className="text-xl sm:text-2xl text-gray-300 font-serif italic mb-8 leading-relaxed">
            Welcome to the inaugural edition of Mr & Miss Face of Tharaka-Nithi County.
          </p>
          <p className="text-lg text-gray-400 font-light leading-relaxed mb-6">
            Deeply rooted in the rich cultural heritage of Tharaka Nithi, this premier pageant is more than just a competition; it is a movement. Royals Icon Events is on a mission to uncover, mentor, and elevate the hidden gems of our community. We believe in the power of the youth to drive change, inspire greatness, and redefine beauty standards through intellect and purpose.
          </p>
          <p className="text-lg text-[#d4af37] font-light leading-relaxed">
            This first edition marks the beginning of a legacy—a celebration of resilience, elegance, and the vibrant spirit of Tharaka Nithi.
          </p>
        </div>
      </section>

      {/* Our Pillars */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0a0508]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl sm:text-5xl font-bold text-white mb-4 uppercase tracking-wider">Our Core Pillars</h2>
            <div className="w-24 h-1 bg-[#d4af37] mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-8 text-center border-l-4 border-transparent hover:border-[#d4af37] hover:bg-[#140a10] transition-all duration-300">
              <Star className="w-12 h-12 text-[#d4af37] mx-auto mb-4" />
              <h4 className="font-serif text-2xl text-white mb-2">Talent</h4>
              <p className="text-gray-500 font-light">Showcasing extraordinary gifts and creative brilliance.</p>
            </div>
            <div className="p-8 text-center border-l-4 border-transparent hover:border-[#d4af37] hover:bg-[#140a10] transition-all duration-300">
              <Users className="w-12 h-12 text-[#d4af37] mx-auto mb-4" />
              <h4 className="font-serif text-2xl text-white mb-2">Leadership</h4>
              <p className="text-gray-500 font-light">Empowering the youth to take charge and inspire.</p>
            </div>
            <div className="p-8 text-center border-l-4 border-transparent hover:border-[#d4af37] hover:bg-[#140a10] transition-all duration-300">
              <MapPin className="w-12 h-12 text-[#d4af37] mx-auto mb-4" />
              <h4 className="font-serif text-2xl text-white mb-2">Culture</h4>
              <p className="text-gray-500 font-light">Celebrating the rich heritage of Tharaka Nithi County.</p>
            </div>
            <div className="p-8 text-center border-l-4 border-transparent hover:border-[#d4af37] hover:bg-[#140a10] transition-all duration-300">
              <Heart className="w-12 h-12 text-[#d4af37] mx-auto mb-4" />
              <h4 className="font-serif text-2xl text-white mb-2">Service</h4>
              <p className="text-gray-500 font-light">Giving back and creating a lasting community impact.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Models Carousel / Gallery */}
      <div className="bg-[#1a0c14] border-t border-b border-[#3a1c28]">
        <Suspense fallback={<SectionLoader />}>
          <FeaturedModelsCarousel />
        </Suspense>
      </div>

      {/* Registration Section */}
      <section id="register-section" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#0a0508]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-serif text-4xl sm:text-5xl font-bold text-[#d4af37] mb-4 uppercase tracking-wider">Become Part of Us</h2>
            <div className="w-24 h-1 bg-white mx-auto mb-6"></div>
            <p className="text-gray-400 font-light max-w-2xl mx-auto">
              Registration is completely free. No height restrictions. Tattoos and scars do not disqualify applicants. Your uniqueness is celebrated.
            </p>
          </div>

          <Card className="bg-[#140a10] border-[#3a1c28] border rounded-none shadow-2xl">
            <CardContent className="pt-8">
              <Tabs
                defaultValue="adults"
                value={selectedCategory}
                onValueChange={(value) => setSelectedCategory(value as "adults" | "teens" | "little_stars")}
                className="w-full"
              >
                <TabsList className="flex flex-col sm:flex-row w-full bg-transparent p-0 mb-8 border-b border-[#3a1c28]">
                  <TabsTrigger
                    value="adults"
                    className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-[#d4af37] data-[state=active]:text-[#d4af37] text-gray-500 rounded-none py-4 uppercase tracking-widest text-xs font-semibold transition-all duration-300 bg-transparent hover:text-white"
                  >
                    Adults (18–35)
                  </TabsTrigger>
                  <TabsTrigger
                    value="teens"
                    className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-[#d4af37] data-[state=active]:text-[#d4af37] text-gray-500 rounded-none py-4 uppercase tracking-widest text-xs font-semibold transition-all duration-300 bg-transparent hover:text-white"
                  >
                    Teens (13–17)
                  </TabsTrigger>
                  <TabsTrigger
                    value="little_stars"
                    className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-[#d4af37] data-[state=active]:text-[#d4af37] text-gray-500 rounded-none py-4 uppercase tracking-widest text-xs font-semibold transition-all duration-300 bg-transparent hover:text-white"
                  >
                    Little Stars (5–12)
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="adults" className="mt-8">
                  <RegistrationForm category="adults" onSuccess={handleRegistrationSuccess} />
                </TabsContent>

                <TabsContent value="teens" className="mt-8">
                    <p className="text-gray-400 mb-6">
                      Registration for teen contestants aiming for greatness.
                    </p>
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-forwards">
                      <RegistrationForm category="teens" onSuccess={handleRegistrationSuccess} />
                    </div>
                </TabsContent>

                <TabsContent value="little_stars" className="mt-8">
                    <p className="text-gray-400 mb-6">
                      Registration for our youngest, brightest upcoming stars.
                    </p>
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-forwards">
                      <RegistrationForm category="little_stars" onSuccess={handleRegistrationSuccess} />
                    </div>
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
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#140a10] border-t border-[#3a1c28]">
        <div className="max-w-5xl mx-auto">
          <Suspense fallback={<SectionLoader />}>
            <SponsorRegistrationForm />
          </Suspense>
        </div>
      </section>

      {/* Artists & Showcasing Section */}
      <section id="artists-section" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0a0508] border-t border-[#3a1c28]">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-16 uppercase tracking-wider">
            More <span className="text-[#d4af37]">Opportunities</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-12 text-left">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-forwards">
              <Suspense fallback={<SectionLoader />}>
                <ArtistRegistrationForm />
              </Suspense>
            </div>
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-forwards">
              <Suspense fallback={<SectionLoader />}>
                <ShowcaseRegistrationForm />
              </Suspense>
            </div>
          </div>
        </div>
      </section>

      {/* Official Documents Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#140a10] border-t border-b border-[#3a1c28]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-4 uppercase tracking-wider">Official Resources & Downloads</h2>
            <div className="w-16 h-1 bg-[#d4af37] mx-auto mb-6"></div>
            <p className="text-gray-400 font-light max-w-2xl mx-auto">
              Access everything you need to know about the Mr & Miss Face of Tharaka-Nithi County pageant. Download handbooks, legal documents, and terms.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-[#0a0508] border border-[#d4af37]/20 p-6 flex flex-col justify-between hover:border-[#d4af37] transition-colors duration-300">
              <div>
                <h4 className="font-serif text-[#d4af37] text-xl mb-2">Models Handbook</h4>
                <p className="text-gray-400 text-sm mb-4">Complete guide, rules, and expectations for all contestants.</p>
              </div>
              <Button variant="outline" className="w-full rounded-none border-[#3a1c28] text-white hover:bg-[#d4af37] hover:text-black">
                Download PDF
              </Button>
            </div>
            <div className="bg-[#0a0508] border border-[#d4af37]/20 p-6 flex flex-col justify-between hover:border-[#d4af37] transition-colors duration-300">
              <div>
                <h4 className="font-serif text-[#d4af37] text-xl mb-2">Partners Handbook</h4>
                <p className="text-gray-400 text-sm mb-4">Sponsorship packages, benefits, and partnership guidelines.</p>
              </div>
              <Button variant="outline" className="w-full rounded-none border-[#3a1c28] text-white hover:bg-[#d4af37] hover:text-black">
                Download PDF
              </Button>
            </div>
            <div className="bg-[#0a0508] border border-[#d4af37]/20 p-6 flex flex-col justify-between hover:border-[#d4af37] transition-colors duration-300">
              <div>
                <h4 className="font-serif text-[#d4af37] text-xl mb-2">Consent for Under 18</h4>
                <p className="text-gray-400 text-sm mb-4">Mandatory parental consent form for Teens & Little Stars.</p>
              </div>
              <Button variant="outline" className="w-full rounded-none border-[#3a1c28] text-white hover:bg-[#d4af37] hover:text-black">
                Download PDF
              </Button>
            </div>
            <div className="bg-[#0a0508] border border-[#d4af37]/20 p-6 flex flex-col justify-between hover:border-[#d4af37] transition-colors duration-300 md:col-span-2 lg:col-span-3 lg:w-1/2 lg:mx-auto">
              <div>
                <h4 className="font-serif text-[#d4af37] text-xl mb-2">Legal & Terms of Service</h4>
                <p className="text-gray-400 text-sm mb-4">Comprehensive terms, conditions, and legal agreements for participation.</p>
              </div>
              <Button variant="outline" className="w-full rounded-none border-[#3a1c28] text-white hover:bg-[#d4af37] hover:text-black">
                Download PDF
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Know More & Support (Pill Layout) */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#140a10] border-t border-[#3a1c28]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-serif text-3xl font-bold text-[#d4af37] mb-6 uppercase tracking-wider">Contact & Support</h2>
          <p className="text-gray-400 mb-10 font-light">
            Need a physical form for the bootcamp? Download the printable registration form below.<br/>
            For any queries, our support panel is always ready to assist you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-md mx-auto sm:max-w-none">
            <Button 
              className="bg-transparent border border-white text-white hover:bg-white hover:text-black font-semibold uppercase tracking-wider text-xs px-8 py-5 rounded-full transition-all duration-300 w-full sm:w-auto"
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
            <Button 
              className="bg-[#d4af37] text-black hover:bg-white hover:text-black transition-colors rounded-none px-8 py-6 tracking-wider uppercase text-sm"
              onClick={() => window.open(TICKETS_URL, "_blank", "noopener,noreferrer")}
            >
              Buy Tickets
            </Button>
            <Button 
              className="bg-transparent border border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-black transition-colors rounded-none px-8 py-6 tracking-wider uppercase text-sm"
              onClick={() => setLocation("/merchandise")}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Shop Merchandise
            </Button>
            <Button 
              className="bg-transparent border border-white text-white hover:bg-white hover:text-black font-semibold uppercase tracking-wider text-xs px-8 py-5 rounded-full transition-all duration-300 w-full sm:w-auto"
              onClick={() => setLocation("/poster-generator")}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Poster
            </Button>
            <Button 
              className="bg-transparent border border-white text-white hover:bg-white hover:text-black font-semibold uppercase tracking-wider text-xs px-8 py-5 rounded-full transition-all duration-300 w-full sm:w-auto"
              onClick={() => setLocation("/gallery")}
            >
              <Image className="w-4 h-4 mr-2" />
              View Full Gallery
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#050204] py-12 px-4 text-center text-white border-t border-[#d4af37]/30">
        <p className="text-sm text-gray-500 uppercase tracking-widest mb-3">Organized by</p>
        <p className="font-serif text-3xl text-[#d4af37] mb-6">Royals Icon Events</p>
        <p className="text-sm font-light text-gray-400 mb-8">
          <a href="mailto:support@royaliconevents.co.ke" className="hover:text-white transition-colors">support@royaliconevents.co.ke</a> | 
          <a href="https://www.royaliconevents.co.ke" className="hover:text-white transition-colors ml-2">www.royaliconevents.co.ke</a>
        </p>

        <SocialMediaFooter />

        <div className="mt-8 pt-8 border-t border-[#3a1c28] flex flex-wrap justify-center gap-6">
          <a
            href="/merchandise"
            className="text-gray-600 hover:text-[#d4af37] text-xs uppercase tracking-widest transition-colors"
          >
            Shop Merchandise
          </a>
          <a
            href="/my-orders"
            className="text-gray-600 hover:text-[#d4af37] text-xs uppercase tracking-widest transition-colors"
          >
            My Orders
          </a>
          <a
            href="/admin"
            className="text-gray-600 hover:text-[#d4af37] text-xs uppercase tracking-widest transition-colors"
          >
            Admin Dashboard
          </a>
        </div>
      </footer>
    </main>
  );
}
