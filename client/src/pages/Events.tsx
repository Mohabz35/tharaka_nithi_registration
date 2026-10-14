import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Loader2, ChevronLeft, CalendarDays, MapPin, Images, Search, Share2 } from "lucide-react";
import { useLocation } from "wouter";

function formatDate(date: string | Date | null | undefined): string | null {
  if (!date) return null;
  try {
    return new Date(date).toLocaleDateString("en-KE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return null;
  }
}

export default function Events() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: events, isLoading } = trpc.events.getPublished.useQuery();

  const filtered = (events || []).filter(e => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.title.toLowerCase().includes(q) ||
      (e.description || "").toLowerCase().includes(q) ||
      (e.location || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#0a0508] text-white font-sans selection:bg-[#d4af37] selection:text-black">
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
              <p className="text-[#d4af37] text-xs uppercase tracking-[0.3em] mb-1">Relive The Moments</p>
              <h1 className="font-serif text-3xl sm:text-5xl font-bold text-white uppercase tracking-wider">
                Events Gallery
              </h1>
              <div className="flex items-center justify-center gap-3 mt-3">
                <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#d4af37]" />
                <Images className="w-4 h-4 text-[#d4af37]" />
                <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#d4af37]" />
              </div>
            </div>

            <div className="w-28" />
          </div>

          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#d4af37]/60" />
            <Input
              placeholder="Search events by name, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 bg-[#140a10] border-[#d4af37]/30 text-white placeholder:text-gray-600 rounded-none focus:border-[#d4af37] transition-colors"
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-10 h-10 text-[#d4af37] animate-spin" />
            <p className="text-[#d4af37]/70 uppercase tracking-widest text-sm">Loading events...</p>
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-24">
            <Images className="w-16 h-16 text-[#d4af37]/40 mx-auto mb-6" />
            <h2 className="font-serif text-3xl text-white mb-3">No Events Yet</h2>
            <p className="text-gray-400 font-light max-w-md mx-auto">
              {searchQuery ? "No events match your search." : "Event galleries will appear here once photos are published. Check back soon!"}
            </p>
          </div>
        )}

        {!isLoading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map(event => {
              const dateLabel = formatDate(event.eventDate);
              return (
                <div
                  key={event.id}
                  onClick={() => setLocation(`/events/${event.slug}`)}
                  className="group cursor-pointer bg-[#140a10] border border-[#d4af37]/25 transition-all duration-300 hover:-translate-y-2 hover:border-[#d4af37] hover:shadow-[0_0_30px_rgba(212,175,55,0.3)]"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {event.coverImageUrl ? (
                      <img
                        src={event.coverImageUrl}
                        alt={event.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#2a0a1a] to-[#1a0c14]">
                        <Images className="w-14 h-14 text-[#d4af37]/40" />
                      </div>
                    )}
                    <div className="absolute bottom-3 right-3 bg-black/80 border border-[#d4af37]/50 text-[#d4af37] px-3 py-1 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                      <Images className="w-3 h-3" />
                      {event.photoCount} {event.photoCount === 1 ? "Photo" : "Photos"}
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-serif text-xl font-bold text-white mb-2 group-hover:text-[#d4af37] transition-colors">
                      {event.title}
                    </h3>
                    <div className="space-y-1">
                      {dateLabel && (
                        <p className="text-[#d4af37]/80 text-xs uppercase tracking-widest flex items-center gap-2">
                          <CalendarDays className="w-3 h-3" />
                          {dateLabel}
                        </p>
                      )}
                      {event.location && (
                        <p className="text-gray-400 text-sm font-light flex items-center gap-2">
                          <MapPin className="w-3 h-3 text-[#d4af37]/60" />
                          {event.location}
                        </p>
                      )}
                    </div>
                    {event.description && (
                      <p className="text-gray-400 text-sm font-light mt-3 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                    <div className="flex items-center gap-1 text-[#d4af37]/60 mt-4">
                      <Share2 className="w-3 h-3" />
                      <span className="text-[10px] uppercase tracking-widest">Shareable link available</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 pb-12">
        <Button
          onClick={() => setLocation("/")}
          variant="outline"
          className="border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-black uppercase tracking-widest rounded-none"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </div>
    </div>
  );
}
