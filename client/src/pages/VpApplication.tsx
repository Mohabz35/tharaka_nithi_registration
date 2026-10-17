import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, Crown, Loader2, Send } from "lucide-react";
import { useLocation } from "wouter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import SiteHeader from "@/components/SiteHeader";

export default function VpApplication() {
  const [, setLocation] = useLocation();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [statement, setStatement] = useState("");
  const [submitted, setSubmitted] = useState(false);

  usePageMeta({
    title: "Vice President Application | Face of Tharaka-Nithi",
    description: "Apply for the vacant Executive Council Vice President seat on the Face of Tharaka-Nithi organising committee.",
    path: "/vice-president",
    type: "website",
  });

  const applyMutation = trpc.council.applyForVicePresident.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Application received. The council will review it shortly.");
    },
    onError: err => toast.error(err.message || "Failed to submit application"),
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
          <p className="text-[#d4af37] text-xs uppercase tracking-[0.3em]">Executive Council</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-8 py-12">
        <Crown className="w-10 h-10 text-[#d4af37] mb-4" />
        <h1 className="font-serif text-4xl font-bold text-[#d4af37] mb-2">Vice President Application</h1>
        <p className="text-gray-400 font-light leading-relaxed mb-8">
          The Executive Council of Royals Icon Events has an opening for a Vice President to support the Mr &amp; Miss
          Face of Tharaka-Nithi County 2026 season. If you have leadership experience in events, modelling or community
          organising, introduce yourself below. Applications are reviewed by the President and Admin team.
        </p>

        {submitted ? (
          <Card className="bg-[#2a0a1a] border-[#d4af37] border-2">
            <CardContent className="py-10 text-center">
              <Crown className="w-8 h-8 text-[#d4af37] mx-auto mb-4" />
              <h2 className="font-serif text-2xl text-white mb-2">Application received</h2>
              <p className="text-gray-400 text-sm mb-6">
                Thank you, {fullName || "applicant"}. The council will review your application and contact you at{" "}
                <span className="text-[#d4af37]">{email}</span> if shortlisted.
              </p>
              <Button onClick={() => setLocation("/")} className="bg-[#d4af37] text-black hover:bg-[#e5c158]">
                Back to Home
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-[#2a0a1a] border-[#d4af37] border-2">
            <CardHeader>
              <CardTitle className="text-[#d4af37]">Apply now</CardTitle>
              <CardDescription className="text-gray-400">
                All fields are required. One application per person.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-gray-300 text-sm">Full name</label>
                  <Input
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="bg-[#4a1a2a] border-[#d4af37] text-white"
                    placeholder="Your full name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-gray-300 text-sm">Email</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="bg-[#4a1a2a] border-[#d4af37] text-white"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              <div className="space-y-2 max-w-xs">
                <label className="text-gray-300 text-sm">Phone number</label>
                <Input
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  className="bg-[#4a1a2a] border-[#d4af37] text-white"
                  placeholder="07xx xxx xxx"
                />
              </div>
              <div className="space-y-2">
                <label className="text-gray-300 text-sm">Why do you want to serve as Vice President?</label>
                <Textarea
                  value={statement}
                  onChange={e => setStatement(e.target.value)}
                  className="bg-[#4a1a2a] border-[#d4af37] text-white min-h-[160px]"
                  placeholder="Tell the council about your experience, skills and what you would bring to the role..."
                />
              </div>
              <Button
                onClick={() =>
                  applyMutation.mutate({ fullName, email, phoneNumber, statement })
                }
                disabled={applyMutation.isPending || !fullName || !email || !phoneNumber || statement.length < 20}
                className="bg-[#d4af37] text-black hover:bg-[#e5c158]"
              >
                {applyMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Submit application
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      <footer className="border-t border-[#d4af37]/20 py-6 px-4 text-center text-gray-600 text-xs">
        Royals Icon Events · Face of Tharaka-Nithi County
      </footer>
    </div>
  );
}
