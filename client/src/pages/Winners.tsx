import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Loader2, ChevronLeft, Crown, Share2, MessageCircle, Link2, Trophy } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { usePageMeta } from "@/hooks/usePageMeta";
import SiteHeader from "@/components/SiteHeader";

const SITE_URL = "https://www.faceoftharakanithi.app";

const categoryLabels: Record<string, string> = {
  overall: "Overall Champions",
  adults: "Adults (18–35)",
  teens: "Teens (13–17)",
  little_stars: "Little Stars (5–12)",
};

const categoryOrder = ["overall", "adults", "teens", "little_stars"];

function placementRank(placement?: string | null): number {
  if (!placement) return 50;
  const lower = placement.toLowerCase();
  if (lower.includes("winner") || lower.includes("1st") || lower.includes("first")) return 0;
  if (lower.includes("2nd") || lower.includes("second") || lower.includes("runner")) return 1;
  return 10;
}

function WinnerShareButtons({ winnerId, name }: { winnerId: number; name: string }) {
  const shareUrl = `${SITE_URL}/share/winner/${winnerId}`;

  return (
    <div className="flex items-center justify-center gap-2 mt-3">
      <button
        onClick={(e) => {
          e.stopPropagation();
          window.open(
            `https://wa.me/?text=${encodeURIComponent(`Congratulations to ${name}! See the winners of Mr & Miss Face of Tharaka-Nithi: ${shareUrl}`)}`,
            "_blank",
            "noopener,noreferrer"
          );
        }}
        className="flex items-center gap-1 border border-[#d4af37]/40 text-[#d4af37]/80 hover:bg-[#d4af37] hover:text-black px-3 py-1.5 text-[10px] uppercase tracking-widest transition-colors"
        title="Share on WhatsApp"
      >
        <MessageCircle className="w-3 h-3" />
        WhatsApp
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          navigator.clipboard.writeText(shareUrl);
          toast.success("Share link copied!", { style: { background: "#d4af37", color: "#000" } });
        }}
        className="flex items-center gap-1 border border-[#d4af37]/40 text-[#d4af37]/80 hover:bg-[#d4af37] hover:text-black px-3 py-1.5 text-[10px] uppercase tracking-widest transition-colors"
        title="Copy share link"
      >
        <Link2 className="w-3 h-3" />
        Copy Link
      </button>
    </div>
  );
}

export default function Winners() {
  usePageMeta({
    title: "Winners | Mr & Miss Face of Tharaka-Nithi County 2026",
    description: "Meet the champions of Mr & Miss Face of Tharaka-Nithi County 2026 — overall winners and category champions.",
    path: "/winners",
  });
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);

  const { data: winners, isLoading, error } = trpc.winner.getPublished.useQuery();

  const grouped = useMemo(() => {
    if (!winners) return [];
    const sorted = [...winners].sort((a, b) => placementRank(a.placement) - placementRank(b.placement));
    const groups = new Map<string, typeof sorted>();
    for (const w of sorted) {
      const key = categoryOrder.includes(w.category) ? w.category : "overall";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(w);
    }
    return categoryOrder
      .filter(c => groups.has(c))
      .map(c => ({ category: c, items: groups.get(c)! }));
  }, [winners]);

  const visibleGroups = selectedCategory
    ? grouped.filter(g => g.category === selectedCategory)
    : grouped;

  return (
    <div className="min-h-screen bg-[#0a0508] text-white font-sans selection:bg-[#d4af37] selection:text-black">
      <SiteHeader />
      <div className="w-full h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />

      <header className="bg-[#050204] border-b border-[#d4af37]/20 pt-10 pb-8 px-4 sm:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setLocation("/")}
              className="flex items-center gap-2 text-[#d4af37]/70 hover:text-[#d4af37] text-xs uppercase tracking-widest transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Home
            </button>

            <div className="text-center">
              <p className="text-[#d4af37] text-xs uppercase tracking-[0.3em] mb-1">The Champions</p>
              <h1 className="font-serif text-3xl sm:text-5xl font-bold text-white uppercase tracking-wider">
                Our Winners
              </h1>
              <div className="flex items-center justify-center gap-3 mt-3">
                <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#d4af37]" />
                <Crown className="w-4 h-4 text-[#d4af37]" />
                <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#d4af37]" />
              </div>
            </div>

            <div className="w-28" />
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {[
              { key: undefined as string | undefined, label: "All Winners" },
              ...grouped.map(g => ({ key: g.category as string | undefined, label: categoryLabels[g.category] || g.category })),
            ].map(({ key, label }) => (
              <button
                key={String(key)}
                onClick={() => setSelectedCategory(key)}
                className={`px-6 py-2 text-xs uppercase tracking-widest font-semibold transition-all duration-200 ${
                  selectedCategory === key
                    ? "bg-[#d4af37] text-black"
                    : "border border-[#d4af37]/40 text-[#d4af37]/70 hover:border-[#d4af37] hover:text-[#d4af37]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-10 h-10 text-[#d4af37] animate-spin" />
            <p className="text-[#d4af37]/70 uppercase tracking-widest text-sm">Loading champions...</p>
          </div>
        )}

        {!isLoading && error && (
          <div className="text-center py-24">
            <p className="text-red-400 mb-4">Failed to load winners. Please try again later.</p>
            <Button onClick={() => setLocation("/")} className="bg-[#d4af37] text-black uppercase tracking-widest rounded-none">
              Back to Home
            </Button>
          </div>
        )}

        {!isLoading && !error && winners && winners.length === 0 && (
          <div className="text-center py-24">
            <Trophy className="w-16 h-16 text-[#d4af37]/40 mx-auto mb-6" />
            <h2 className="font-serif text-3xl text-white mb-3">Winners Coming Soon</h2>
            <p className="text-gray-400 font-light max-w-md mx-auto">
              The results are being finalised. Check back soon to celebrate our champions!
            </p>
          </div>
        )}

        {!isLoading && !error && winners && winners.length > 0 && (
          <div className="space-y-16">
            {visibleGroups.map(group => (
              <section key={group.category}>
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#d4af37]/50" />
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#d4af37] uppercase tracking-wider text-center">
                    {categoryLabels[group.category] || group.category}
                  </h2>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#d4af37]/50" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {group.items.map((winner, idx) => {
                    const isChampion = group.category === "overall" && placementRank(winner.placement) === 0;
                    return (
                      <div
                        key={winner.id}
                        onClick={() => setLocation(`/winners/${winner.id}`)}
                        className={`group cursor-pointer bg-[#140a10] border transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(212,175,55,0.35)] ${
                          isChampion ? "border-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.25)]" : "border-[#d4af37]/25"
                        }`}
                      >
                        <div className="relative aspect-[3/4] overflow-hidden">
                          {winner.photoUrl ? (
                            <img
                              src={winner.photoUrl}
                              alt={winner.fullName}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#2a0a1a] to-[#1a0c14]">
                              <Crown className="w-16 h-16 text-[#d4af37]/40" />
                            </div>
                          )}
                          {isChampion && (
                            <div className="absolute top-3 left-3 bg-[#d4af37] text-black px-3 py-1 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                              <Crown className="w-3 h-3" />
                              Champion
                            </div>
                          )}
                          {winner.placement && !isChampion && (
                            <div className="absolute top-3 left-3 bg-black/80 border border-[#d4af37]/60 text-[#d4af37] px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                              {winner.placement}
                            </div>
                          )}
                        </div>
                        <div className="p-5 text-center">
                          <h3 className="font-serif text-xl font-bold text-white mb-1">{winner.fullName}</h3>
                          <p className="text-[#d4af37] text-xs uppercase tracking-widest mb-2">{winner.title}</p>
                          {winner.prize && (
                            <p className="text-gray-400 text-sm font-light">{winner.prize}</p>
                          )}
                          <div className="flex items-center justify-center gap-1 text-[#d4af37]/60 mt-2">
                            <Share2 className="w-3 h-3" />
                            <span className="text-[10px] uppercase tracking-widest">Share</span>
                          </div>
                          <WinnerShareButtons winnerId={winner.id} name={winner.fullName} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
