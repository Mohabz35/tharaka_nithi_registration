import { Button } from "@/components/ui/button";
import { ChevronLeft, Shield } from "lucide-react";
import { useLocation } from "wouter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { SUPPORT_EMAIL } from "@shared/const";
import SiteHeader from "@/components/SiteHeader";

export default function Privacy() {
  const [, setLocation] = useLocation();

  usePageMeta({
    title: "Privacy Policy | Tharaka Nithi Models",
    description: "How we collect, use and protect your personal data when you register or use faceoftharakanithi.app.",
    path: "/privacy",
    type: "article",
  });

  return (
    <div className="min-h-screen bg-[#0a0508] text-white font-sans selection:bg-[#d4af37] selection:text-black">
      <SiteHeader />
      <div className="w-full h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />

      <header className="bg-[#050204] border-b border-[#d4af37]/20 py-5 px-4 sm:px-8">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 text-[#d4af37]/70 hover:text-[#d4af37] text-xs uppercase tracking-widest transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Home
          </button>
          <p className="text-[#d4af37] text-xs uppercase tracking-[0.3em]">Legal</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-8 py-12">
        <Shield className="w-10 h-10 text-[#d4af37] mb-4" />
        <h1 className="font-serif text-4xl font-bold text-[#d4af37] mb-2">Privacy Policy</h1>
        <p className="text-gray-500 text-sm mb-8">Last updated: October 2026</p>

        <div className="space-y-6 text-gray-300 font-light leading-relaxed">
          <section>
            <h2 className="font-serif text-xl text-white mb-2">1. Who we are</h2>
            <p>
              This website (faceoftharakanithi.app) is operated by Royals Icon Events as the official platform for
              Mr &amp; Miss Face of Tharaka-Nithi County. Questions about this policy can be sent to{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#d4af37] hover:underline">{SUPPORT_EMAIL}</a>.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-white mb-2">2. Data we collect</h2>
            <p>
              When you register as a contestant we collect your name, age/date of birth, contact details, location
              within Tharaka-Nithi County, category, talents, photos and videos you submit, social media handles, and
              payment information processed by our payment partners. We also collect booking enquiry details (name,
              email, phone, event details) when members of the public enquire about booking a model.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-white mb-2">3. How we use your data</h2>
            <p>
              We use your data to administer the competition (registration, voting, judging), publish contestant
              galleries and winner announcements, generate certificates, send transactional emails (confirmations,
              receipts, booking enquiries), improve the platform, and comply with legal obligations. We honour the
              photo/video and data-processing consents you gave at registration.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-white mb-2">4. Public profiles</h2>
            <p>
              Contestant name, age range, category, location (sub-county), talents, photo and any portfolio details
              you choose to add (bio, showreel, measurements, social links, availability) are published on the public
              gallery and model portfolio pages so agencies, fans and the public can view them. You control optional
              portfolio fields from the My Profile page.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-white mb-2">5. Sharing and disclosure</h2>
            <p>
              We do not sell your personal data. We share data only with service providers needed to run the event
              (payment processors, email delivery, image hosting), event partners involved in judging and production,
              and authorities where required by law.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-white mb-2">6. Data retention and security</h2>
            <p>
              We keep registration data for as long as needed to run the competition and its archives. Access to
              administrative data is restricted to authorised staff. While we take reasonable technical measures,
              no internet transmission is completely secure.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-white mb-2">7. Your rights</h2>
            <p>
              Under the Kenya Data Protection Act 2019 you may request access to, correction of, or deletion of your
              personal data, and may withdraw consent where processing is based on consent. Contact{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#d4af37] hover:underline">{SUPPORT_EMAIL}</a>{" "}
              with any such requests.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-white mb-2">8. Cookies</h2>
            <p>
              We use essential cookies to keep you signed in and to remember session state. We do not use third-party
              advertising cookies on this platform.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-white mb-2">9. Changes to this policy</h2>
            <p>We may update this policy from time to time. The “last updated” date reflects the latest revision.</p>
          </section>
        </div>

        <div className="mt-10 pt-8 border-t border-[#d4af37]/20 flex flex-wrap gap-4">
          <Button onClick={() => setLocation("/terms")} variant="outline" className="border-[#d4af37]/50 text-[#d4af37] uppercase tracking-widest text-xs">
            Read Terms &amp; Conditions
          </Button>
          <Button onClick={() => setLocation("/")} className="bg-[#d4af37] text-black uppercase tracking-widest text-xs">
            Back to Home
          </Button>
        </div>
      </main>
    </div>
  );
}
