import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function FeaturedModelsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  const { data: registrations, isLoading } = trpc.gallery.getPublicRegistrations.useQuery({
    category: undefined,
    search: undefined,
  });

  const models = (registrations as any)?.filter((r: any) => r.photoUrl)?.slice(0, 12) || [];

  useEffect(() => {
    if (!autoPlay || models.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.max(models.length, 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [autoPlay, models.length]);

  if (isLoading || models.length === 0) return null;

  const visibleCount = Math.min(models.length, 3);
  const goToPrevious = () => { setCurrentIndex((prev) => (prev - 1 + models.length) % models.length); setAutoPlay(false); };
  const goToNext = () => { setCurrentIndex((prev) => (prev + 1) % models.length); setAutoPlay(false); };
  const visibleModels = Array.from({ length: visibleCount }, (_, i) => models[(currentIndex + i) % models.length]);

  const ROYAL_EVENTS_URL = "https://www.royaliconevents.co.ke";

  const categoryLabel = (cat: string) =>
    cat === "adults" ? "ADULTS" : cat === "teens" ? "TEENS" : "LITTLE STARS";

  return (
    <section className="relative w-full bg-[#0a0508] py-20 overflow-hidden">
      {/* Decorative top ornament */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />

      {/* Background glow blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#d4af37]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#d4af37]/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8">
        {/* Section heading — editorial style */}
        <div className="text-center mb-14">
          <p className="text-[#d4af37] uppercase tracking-[0.3em] text-xs mb-3 font-semibold">Season 1 · 2026</p>
          <h2 className="font-serif text-5xl sm:text-6xl font-bold text-white mb-3 uppercase tracking-wider">
            Meet the Contestants
          </h2>
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="h-px w-24 bg-gradient-to-r from-transparent to-[#d4af37]" />
            <span className="text-[#d4af37] text-xl">✦</span>
            <div className="h-px w-24 bg-gradient-to-l from-transparent to-[#d4af37]" />
          </div>
          <p className="text-gray-500 font-light mt-4 text-sm uppercase tracking-widest">
            Phase 2 Voting · Now Open
          </p>
        </div>

        {/* Carousel */}
        <div className="relative px-8 sm:px-16">
          <div className={`grid gap-6 transition-all duration-500 ${
            visibleCount === 1 ? "grid-cols-1 max-w-sm mx-auto" :
            visibleCount === 2 ? "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto" :
            "grid-cols-1 md:grid-cols-3"
          }`}>
            {visibleModels.map((model, idx) => {
              const isCenter = idx === 1 && visibleCount === 3;
              const contestantNum = models.indexOf(model) + 1;
              return (
                <div
                  key={`${model.id}-${idx}`}
                  className={`transform transition-all duration-500 ${
                    isCenter ? "md:scale-[1.06] md:z-20" : "md:scale-95 opacity-80"
                  }`}
                >
                  {/* Card */}
                  <div className={`relative group bg-[#140a10] overflow-hidden shadow-2xl transition-shadow duration-300 ${
                    isCenter ? "border-2 border-[#d4af37] shadow-[0_0_40px_rgba(212,175,55,0.2)]" : "border border-[#d4af37]/30"
                  }`}>
                    {/* Contestant number badge */}
                    <div className="absolute top-3 left-3 z-30 bg-[#d4af37] text-black text-xs font-black px-3 py-1 uppercase tracking-widest">
                      #{String(contestantNum).padStart(2, "0")}
                    </div>

                    {/* Category badge */}
                    <div className="absolute top-3 right-3 z-30 bg-black/70 text-[#d4af37] text-xs font-semibold px-3 py-1 border border-[#d4af37]/50 uppercase tracking-wider">
                      {categoryLabel(model.category)}
                    </div>

                    {/* Photo */}
                    <div className="relative h-80 md:h-96 overflow-hidden bg-[#0a0508]">
                      <img
                        src={model.photoUrl}
                        alt={model.fullName}
                        loading="lazy"
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
                      />
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#140a10] via-[#140a10]/20 to-transparent" />

                      {/* Hover overlay with vote CTA */}
                      <div className="absolute inset-0 bg-[#d4af37]/90 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <p className="text-black font-serif text-2xl font-bold mb-2 text-center px-4">{model.fullName}</p>
                        <p className="text-black/70 text-xs uppercase tracking-widest mb-6">{categoryLabel(model.category)}</p>
                        <a
                          href={ROYAL_EVENTS_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-black text-[#d4af37] px-8 py-3 text-xs uppercase tracking-widest font-bold hover:bg-[#1a0c14] transition-colors"
                        >
                          Vote Now →
                        </a>
                      </div>
                  </div>

                    {/* Info bar */}
                    <div className="p-5 border-t border-[#d4af37]/20">
                      <h3 className="font-serif text-xl text-[#d4af37] font-bold truncate mb-1">
                        {model.fullName}
                      </h3>
                      {model.talents && (
                        <p className="text-gray-500 text-xs font-light italic line-clamp-2">
                          {model.talents}
                        </p>
                      )}
                      <a
                        href={ROYAL_EVENTS_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 block text-center border border-[#d4af37]/50 text-[#d4af37] hover:bg-[#d4af37] hover:text-black py-2 text-xs uppercase tracking-widest font-semibold transition-all duration-300"
                      >
                        Support & Vote
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Nav arrows */}
          <button
            onClick={goToPrevious}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-30 w-10 h-10 flex items-center justify-center border border-[#d4af37]/60 text-[#d4af37] hover:bg-[#d4af37] hover:text-black transition-all duration-300"
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-30 w-10 h-10 flex items-center justify-center border border-[#d4af37]/60 text-[#d4af37] hover:bg-[#d4af37] hover:text-black transition-all duration-300"
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Dots indicator */}
        <div className="flex justify-center gap-2 mt-10">
          {models.map((_: any, idx: number) => (
            <button
              key={idx}
              onClick={() => { setCurrentIndex(idx); setAutoPlay(false); }}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-[3px] rounded-none transition-all duration-300 ${
                idx === currentIndex ? "bg-[#d4af37] w-10" : "bg-white/20 hover:bg-white/40 w-4"
              }`}
            />
          ))}
        </div>

        {/* Footer CTA */}
        <div className="text-center mt-12">
          <a
            href="/gallery"
            className="inline-block border border-[#d4af37]/50 text-[#d4af37] hover:bg-[#d4af37] hover:text-black px-12 py-4 text-xs uppercase tracking-[0.2em] font-semibold transition-all duration-300"
          >
            View Full Gallery
          </a>
        </div>
      </div>
    </section>
  );
}
