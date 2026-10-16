import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Loader2, ChevronLeft, Crown, MessageCircle, Link2, Facebook, Instagram } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { usePageMeta } from "@/hooks/usePageMeta";
import { SOCIAL_LINKS } from "@shared/const";
import SiteHeader from "@/components/SiteHeader";

const SITE_URL = "https://www.faceoftharakanithi.app";

const categoryLabels: Record<string, string> = {
  overall: "Overall",
  adults: "Adults (18–35)",
  teens: "Teens (13–17)",
  little_stars: "Little Stars (5–12)",
};

export default function WinnerDetail({ params }: { params: { id: string } }) {
  const [, setLocation] = useLocation();
  const winnerId = parseInt(params.id, 10);

  const { data: winner, isLoading, error } = trpc.winner.getById.useQuery(
    { id: winnerId },
    { enabled: !Number.isNaN(winnerId) }
  );

  usePageMeta({
    title: winner ? `${winner.fullName} — ${winner.title} | Tharaka Nithi Models` : "Winner | Tharaka Nithi Models",
    description: winner?.description || undefined,
    image: winner?.photoUrl || undefined,
    path: winner ? `/winners/${winner.id}` : undefined,
    type: "profile",
  });

  if (Number.isNaN(winnerId)) {
    return (
      <div className="min-h-screen bg-[#0a0508] flex flex-col items-center justify-center text-white gap-4">
        <p className="text-[#d4af37] uppercase tracking-widest">Invalid winner link</p>
        <Button onClick={() => setLocation("/winners")} className="bg-[#d4af37] text-black uppercase tracking-widest rounded-none">
          View All Winners
        </Button>
      </div>
    );
  }

  const shareUrl = `${SITE_URL}/share/winner/${winnerId}`;
  const shareText = winner
    ? `Congratulations to ${winner.fullName} - ${winner.placement ? winner.placement + ", " : ""}${winner.title}! See the champions of Mr & Miss Face of Tharaka-Nithi: ${shareUrl}`
    : shareUrl;

  return (
    <div className="min-h-screen bg-[#0a0508] text-white font-sans selection:bg-[#d4af37] selection:text-black">
      <SiteHeader />
      <div className="w-full h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />

      <header className="bg-[#050204] border-b border-[#d4af37]/20 py-5 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setLocation("/winners")}
            className="flex items-center gap-2 text-[#d4af37]/70 hover:text-[#d4af37] text-xs uppercase tracking-widest transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            All Winners
          </button>
          <p className="text-[#d4af37] text-xs uppercase tracking-[0.3em]">Champions</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-12">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-10 h-10 text-[#d4af37] animate-spin" />
            <p className="text-[#d4af37]/70 uppercase tracking-widest text-sm">Loading...</p>
          </div>
        )}

        {!isLoading && (error || !winner) && (
          <div className="text-center py-24">
            <Crown className="w-16 h-16 text-[#d4af37]/40 mx-auto mb-6" />
            <h2 className="font-serif text-3xl text-white mb-3">Winner Not Found</h2>
            <p className="text-gray-400 font-light mb-8">This winner profile does not exist or is not yet published.</p>
            <Button onClick={() => setLocation("/winners")} className="bg-[#d4af37] text-black uppercase tracking-widest rounded-none">
              View All Winners
            </Button>
          </div>
        )}

        {!isLoading && winner && (
          <div className="grid md:grid-cols-2 gap-10 items-start">
            <div className="relative border border-[#d4af37]/40 shadow-[0_0_40px_rgba(212,175,55,0.2)] overflow-hidden">
              {winner.photoUrl ? (
                <img src={winner.photoUrl} alt={winner.fullName} className="w-full object-cover" />
              ) : (
                <div className="aspect-[3/4] flex items-center justify-center bg-gradient-to-br from-[#2a0a1a] to-[#1a0c14]">
                  <Crown className="w-24 h-24 text-[#d4af37]/40" />
                </div>
              )}
            </div>

            <div>
              {winner.placement && (
                <p className="inline-block bg-[#d4af37] text-black px-4 py-1 text-[11px] font-bold uppercase tracking-widest mb-4">
                  {winner.placement}
                </p>
              )}
              <h1 className="font-serif text-4xl sm:text-5xl font-bold text-[#d4af37] mb-2 uppercase tracking-wide">
                {winner.fullName}
              </h1>
              <p className="font-serif text-xl text-white italic mb-1">{winner.title}</p>
              <p className="text-[#d4af37]/70 text-xs uppercase tracking-widest mb-6">
                {categoryLabels[winner.category] || winner.category}
              </p>

              {winner.prize && (
                <div className="bg-[#140a10] border border-[#d4af37]/30 p-5 mb-6">
                  <p className="text-[#d4af37] text-xs uppercase tracking-widest mb-1">Prize</p>
                  <p className="text-white font-light">{winner.prize}</p>
                </div>
              )}

              {winner.description && (
                <p className="text-gray-300 font-light leading-relaxed mb-8">{winner.description}</p>
              )}

              <div className="border-t border-[#d4af37]/20 pt-6">
                <p className="text-[#d4af37] text-xs uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Share this champion
                </p>
                <div className="flex flex-wrap gap-3">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-[#25D366]/10 border border-[#25D366]/50 text-[#25D366] hover:bg-[#25D366] hover:text-black px-5 py-2.5 text-xs uppercase tracking-widest transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </a>
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-[#1877F2]/10 border border-[#1877F2]/50 text-[#1877F2] hover:bg-[#1877F2] hover:text-white px-5 py-2.5 text-xs uppercase tracking-widest transition-colors"
                  >
                    <Facebook className="w-4 h-4" />
                    Facebook
                  </a>
                  <a
                    href={SOCIAL_LINKS.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-[#E4405F]/10 border border-[#E4405F]/50 text-[#E4405F] hover:bg-[#E4405F] hover:text-white px-5 py-2.5 text-xs uppercase tracking-widest transition-colors"
                  >
                    <Instagram className="w-4 h-4" />
                    Instagram
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(shareUrl);
                      toast.success("Share link copied!", { style: { background: "#d4af37", color: "#000" } });
                    }}
                    className="flex items-center gap-2 border border-[#d4af37]/50 text-[#d4af37] hover:bg-[#d4af37] hover:text-black px-5 py-2.5 text-xs uppercase tracking-widest transition-colors"
                  >
                    <Link2 className="w-4 h-4" />
                    Copy Link
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
