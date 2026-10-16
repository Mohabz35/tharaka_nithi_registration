import { Button } from "@/components/ui/button";
import { ChevronLeft, FileText } from "lucide-react";
import { useLocation } from "wouter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { SUPPORT_EMAIL, EVENT_NAME, EVENT_DATE, EVENT_VENUE, ORGANIZER_NAME } from "@shared/const";
import SiteHeader from "@/components/SiteHeader";

export default function Terms() {
  const [, setLocation] = useLocation();

  usePageMeta({
    title: "Terms & Conditions | Tharaka Nithi Models",
    description: `Terms and conditions for entering and participating in ${EVENT_NAME}.`,
    path: "/terms",
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
        <FileText className="w-10 h-10 text-[#d4af37] mb-4" />
        <h1 className="font-serif text-4xl font-bold text-[#d4af37] mb-2">Terms &amp; Conditions</h1>
        <p className="text-gray-500 text-sm mb-8">Last updated: October 2026</p>

        <div className="space-y-6 text-gray-300 font-light leading-relaxed">
          <section>
            <h2 className="font-serif text-xl text-white mb-2">1. Organiser</h2>
            <p>
              {EVENT_NAME} ({EVENT_DATE}, {EVENT_VENUE}) is organised by {ORGANIZER_NAME} (“the Organiser”, “we”).
              These terms govern registration, participation and use of faceoftharakanithi.app. Contact:{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#d4af37] hover:underline">{SUPPORT_EMAIL}</a>.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-white mb-2">2. Eligibility</h2>
            <p>
              Entrants must be residents of Tharaka-Nithi County (or meet the published eligibility rules for their
              category), provide truthful information, and meet the age requirements of their category. Teens and
              Little Stars require verified parental/guardian consent. Providing false information — including false
              age, documents or photos — results in disqualification.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-white mb-2">3. Registration and fees</h2>
            <p>
              Registration is complete only when the required fee is paid and the application is confirmed by the
              Organiser. Fees are non-transferable except at the Organiser’s discretion. Registration may close once
              capacity is reached or the published deadline passes.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-white mb-2">4. Conduct and compliance</h2>
            <p>
              Entrants must behave professionally at all event-related activities. Harassment, hate speech, drug use,
              or behaviour that brings the event into disrepute may lead to removal. Entrants must comply with all
              applicable Kenyan laws, including the Children Act (for minors) and the Data Protection Act 2019.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-white mb-2">5. Media, publicity and IP</h2>
            <p>
              By registering you consent to photography, video and audio recording at events, and to the Organiser
              publishing images, clips and profile information on this website, social media and event materials.
              You retain ownership of your original content but grant the Organiser a non-exclusive licence to use
              submitted materials for event promotion. Contestant entries must not infringe third-party rights.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-white mb-2">6. Judging and winners</h2>
            <p>
              Judging decisions made by the appointed panel are final. Public voting (where enabled) is advisory and
              may be audited; suspected fraud (automated voting, purchased votes, etc.) may void affected votes or
              disqualify the entrant. Winner titles and prizes are as published; prizes are subject to verification
              of eligibility.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-white mb-2">7. Bookings and third-party links</h2>
            <p>
              Model portfolio pages may offer a booking enquiry form. Enquiries are forwarded to the Organiser for
              introduction; any resulting engagement is a contract solely between the model and the client. The
              Organiser is not a party to, and does not guarantee, such engagements.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-white mb-2">8. Limitation of liability</h2>
            <p>
              To the maximum extent permitted by law, the Organiser is not liable for indirect or consequential loss
              arising from participation, voting platform downtime, or third-party payment/network failures. Nothing
              in these terms excludes liability that cannot be excluded by law.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-white mb-2">9. Changes and termination</h2>
            <p>
              We may vary event details, rules or these terms with reasonable notice (including via this website).
              We may cancel, suspend or reschedule the event due to circumstances beyond our reasonable control;
              where fees have been paid, we will communicate any applicable refund policy.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-white mb-2">10. Governing law</h2>
            <p>These terms are governed by the laws of the Republic of Kenya, and disputes are subject to Kenyan courts.</p>
          </section>
        </div>

        <div className="mt-10 pt-8 border-t border-[#d4af37]/20 flex flex-wrap gap-4">
          <Button onClick={() => setLocation("/privacy")} variant="outline" className="border-[#d4af37]/50 text-[#d4af37] uppercase tracking-widest text-xs">
            Read Privacy Policy
          </Button>
          <Button onClick={() => setLocation("/")} className="bg-[#d4af37] text-black uppercase tracking-widest text-xs">
            Back to Home
          </Button>
        </div>
      </main>
    </div>
  );
}
