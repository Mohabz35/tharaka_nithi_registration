import { useState } from "react";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Search, Loader2, MessageCircle, Share2, Facebook, Instagram, ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Gallery() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<"adults" | "teens" | "little_stars" | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "talents">("newest");

  const { data: galleryData, isLoading } = trpc.gallery.getPublicRegistrations.useQuery({
    category: selectedCategory,
    search: searchQuery,
  });

  const sortedData = galleryData ? [...galleryData].sort((a, b) => {
    if (sortBy === "newest") return new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime();
    if (sortBy === "talents") return (a.talents || "").localeCompare(b.talents || "");
    return 0;
  }) : [];

  const categoryLabels: Record<string, string> = {
    adults: "Adults (18–35)",
    teens: "Teens (13–17)",
    little_stars: "Little Stars (5–12)",
  };

  const ROYAL_EVENTS_URL = "https://www.royaliconevents.co.ke";
  const SITE_URL = "https://www.faceoftharakanithi.app";

  return (
    <div className="min-h-screen bg-[#0a0508] text-white font-sans selection:bg-[#d4af37] selection:text-black">
      {/* Decorative top bar */}
      <div className="w-full h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />

      {/* Header */}
      <header className="bg-[#050204] border-b border-[#d4af37]/20 pt-10 pb-8 px-4 sm:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto">
          {/* Back + Title row */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setLocation("/")}
              className="flex items-center gap-2 text-[#d4af37]/70 hover:text-[#d4af37] text-xs uppercase tracking-widest transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Home
            </button>

            <div className="text-center">
              <p className="text-[#d4af37] text-xs uppercase tracking-[0.3em] mb-1">Season 1 · 2026</p>
              <h1 className="font-serif text-3xl sm:text-5xl font-bold text-white uppercase tracking-wider">
                Contestants Gallery
              </h1>
              <div className="flex items-center justify-center gap-3 mt-3">
                <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#d4af37]" />
                <span className="text-[#d4af37] text-sm">✦</span>
                <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#d4af37]" />
              </div>
            </div>

            <div className="w-28" />
          </div>

          {/* Search + Sort Row */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#d4af37]/60" />
              <Input
                placeholder="Search by name or talents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 bg-[#140a10] border-[#d4af37]/30 text-white placeholder:text-gray-600 rounded-none focus:border-[#d4af37] transition-colors"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "newest" | "talents")}
              className="bg-[#140a10] border border-[#d4af37]/30 text-[#d4af37] px-5 py-2 text-xs uppercase tracking-widest hover:border-[#d4af37] transition-colors focus:outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="talents">By Talents</option>
            </select>
          </div>

          {/* Category filter pills */}
          <div className="flex flex-wrap gap-3">
            {[
              { key: undefined, label: "All Contestants" },
              ...Object.entries(categoryLabels).map(([k, v]) => ({ key: k as any, label: v }))
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

      {/* Gallery Grid */}
      <main className="py-16 px-4 sm:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-[#d4af37]" />
              <p className="text-gray-600 text-xs uppercase tracking-widest">Loading contestants…</p>
            </div>
          ) : sortedData.length > 0 ? (
            <>
              <p className="text-gray-600 text-xs uppercase tracking-widest text-center mb-10">
                Showing <span className="text-[#d4af37] font-bold">{sortedData.length}</span> registered contestants
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {sortedData.map((model, globalIdx) => (
                  <div
                    key={model.id}
                    className="group relative bg-[#140a10] border border-[#d4af37]/20 hover:border-[#d4af37]/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(212,175,55,0.15)]"
                  >
                    {/* Contestant # badge */}
                    <div className="absolute top-0 left-0 z-20 bg-[#d4af37] text-black text-xs font-black px-3 py-[5px] uppercase tracking-widest">
                      #{String(globalIdx + 1).padStart(2, "0")}
                    </div>

                    {/* Category badge */}
                    <div className="absolute top-0 right-0 z-20 bg-black/80 text-[#d4af37] text-[10px] font-semibold px-2 py-1 border-b border-l border-[#d4af37]/30 uppercase tracking-wider">
                      {categoryLabels[model.category] || model.category}
                    </div>

                    {/* Photo */}
                    <div className="relative h-72 sm:h-80 overflow-hidden bg-[#0a0508]">
                      {model.photoUrl ? (
                        <img
                          src={model.photoUrl}
                          alt={`${model.fullName} - ${model.category} contestant`}
                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-gray-700 text-5xl">👤</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#140a10] via-[#140a10]/10 to-transparent" />

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-[#d4af37]/90 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4">
                        <p className="font-serif text-xl font-bold text-black text-center mb-1">{model.fullName}</p>
                        <p className="text-black/70 text-[10px] uppercase tracking-widest mb-6">
                          Age {model.age} · {categoryLabels[model.category]}
                        </p>
                        <a
                          href={ROYAL_EVENTS_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-black text-[#d4af37] px-6 py-2 text-[10px] uppercase tracking-widest font-bold hover:bg-[#1a0c14] transition-colors"
                        >
                          Vote Now →
                        </a>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4 border-t border-[#d4af37]/15">
                      <h3 className="font-serif text-lg text-[#d4af37] font-bold truncate mb-1">{model.fullName}</h3>
                      <p className="text-gray-500 text-xs font-light">
                        Age {model.age} · 📍 {(model as any).countySubLocation || "Tharaka Nithi"}
                      </p>
                      {model.talents && (
                        <p className="text-gray-600 text-xs font-light italic mt-2 line-clamp-2">"{model.talents}"</p>
                      )}

                      {/* Vote link */}
                      <a
                        href={ROYAL_EVENTS_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 block text-center border border-[#d4af37]/40 text-[#d4af37] hover:bg-[#d4af37] hover:text-black py-2 text-[10px] uppercase tracking-widest font-semibold transition-all duration-300"
                      >
                        Support & Vote
                      </a>

                      {/* Social sharing */}
                      <div className="grid grid-cols-4 gap-1 mt-2">
                        <button
                          title="Share on WhatsApp"
                          onClick={() => {
                            const text = `🌟 Support ${model.fullName} at Mr & Miss Face of Tharaka-Nithi 2026! Vote at ${ROYAL_EVENTS_URL}`;
                            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
                          }}
                          className="bg-green-900/60 hover:bg-green-700 text-white py-2 flex items-center justify-center transition-colors"
                        >
                          <MessageCircle className="w-3 h-3" />
                        </button>
                        <button
                          title="Share on Facebook"
                          onClick={() => {
                            const url = encodeURIComponent(SITE_URL);
                            const quote = encodeURIComponent(`🌟 Support ${model.fullName} at Mr & Miss Face of Tharaka-Nithi 2026!`);
                            window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${quote}`, "_blank");
                          }}
                          className="bg-blue-900/60 hover:bg-blue-700 text-white py-2 flex items-center justify-center transition-colors"
                        >
                          <Facebook className="w-3 h-3" />
                        </button>
                        <button
                          title="Share on X/Twitter"
                          onClick={() => {
                            const text = `🌟 Support ${model.fullName} at Mr & Miss Face of Tharaka-Nithi 2026! #FaceOfTharakaNithi`;
                            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
                          }}
                          className="bg-sky-900/60 hover:bg-sky-700 text-white py-2 flex items-center justify-center transition-colors"
                        >
                          <Share2 className="w-3 h-3" />
                        </button>
                        <button
                          title="Share on Instagram"
                          onClick={() => {
                            const text = `🌟 Support ${model.fullName} at Mr & Miss Face of Tharaka-Nithi 2026! Vote at ${ROYAL_EVENTS_URL} #FaceOfTharakaNithi`;
                            if (navigator.share) {
                              navigator.share({ title: "Face of Tharaka-Nithi 2026", text }).catch(() => {});
                            } else {
                              navigator.clipboard.writeText(text);
                              toast.success("Caption copied! Paste it on Instagram.");
                            }
                          }}
                          className="bg-gradient-to-br from-pink-900/60 to-purple-900/60 hover:from-pink-700 hover:to-purple-700 text-white py-2 flex items-center justify-center transition-colors"
                        >
                          <Instagram className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-32">
              <p className="font-serif text-3xl text-white mb-4">
                {searchQuery || selectedCategory ? "No Contestants Found" : "Gallery Coming Soon"}
              </p>
              <div className="flex items-center justify-center gap-4 mb-8">
                <div className="h-px w-16 bg-[#d4af37]/30" />
                <span className="text-[#d4af37]">✦</span>
                <div className="h-px w-16 bg-[#d4af37]/30" />
              </div>
              <p className="text-gray-600 text-sm font-light">
                Check back soon as more contestants register for the event.
              </p>
            </div>
          )}
        </div>
      </main>

      <div className="w-full h-px bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />
    </div>
  );
}
