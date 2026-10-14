import { useState } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Loader2, ChevronLeft, CalendarDays, MapPin, Images, X, ChevronLeft as PrevIcon, ChevronRight as NextIcon, Link2, MessageCircle } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const SITE_URL = "https://www.faceoftharakanithi.app";

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

export default function EventDetail({ params }: { params: { slug: string } }) {
  const [, setLocation] = useLocation();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { data: event, isLoading, error } = trpc.events.getBySlug.useQuery(
    { slug: params.slug },
    { enabled: !!params.slug }
  );

  const shareUrl = `${SITE_URL}/share/event/${params.slug}`;

  const closeLightbox = () => setLightboxIndex(null);
  const showPrev = () => {
    if (lightboxIndex === null || !event) return;
    setLightboxIndex((lightboxIndex - 1 + event.photos.length) % event.photos.length);
  };
  const showNext = () => {
    if (lightboxIndex === null || !event) return;
    setLightboxIndex((lightboxIndex + 1) % event.photos.length);
  };

  return (
    <div className="min-h-screen bg-[#0a0508] text-white font-sans selection:bg-[#d4af37] selection:text-black">
      <div className="w-full h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />

      <header className="bg-[#050204] border-b border-[#d4af37]/20 py-5 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setLocation("/events")}
            className="flex items-center gap-2 text-[#d4af37]/70 hover:text-[#d4af37] text-xs uppercase tracking-widest transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            All Events
          </button>
          <p className="text-[#d4af37] text-xs uppercase tracking-[0.3em]">Events Gallery</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-12">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-10 h-10 text-[#d4af37] animate-spin" />
            <p className="text-[#d4af37]/70 uppercase tracking-widest text-sm">Loading event...</p>
          </div>
        )}

        {!isLoading && (error || !event) && (
          <div className="text-center py-24">
            <Images className="w-16 h-16 text-[#d4af37]/40 mx-auto mb-6" />
            <h2 className="font-serif text-3xl text-white mb-3">Event Not Found</h2>
            <p className="text-gray-400 font-light mb-8">This event gallery does not exist or is not yet published.</p>
            <Button onClick={() => setLocation("/events")} className="bg-[#d4af37] text-black uppercase tracking-widest rounded-none">
              View All Events
            </Button>
          </div>
        )}

        {!isLoading && event && (
          <>
            <div className="mb-10">
              <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#d4af37] uppercase tracking-wide mb-4">
                {event.title}
              </h1>
              <div className="flex flex-wrap items-center gap-6 mb-6">
                {formatDate(event.eventDate) && (
                  <p className="text-white/80 text-sm uppercase tracking-widest flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-[#d4af37]" />
                    {formatDate(event.eventDate)}
                  </p>
                )}
                {event.location && (
                  <p className="text-white/80 text-sm uppercase tracking-widest flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#d4af37]" />
                    {event.location}
                  </p>
                )}
                <p className="text-[#d4af37] text-sm uppercase tracking-widest flex items-center gap-2">
                  <Images className="w-4 h-4" />
                  {event.photos.length} {event.photos.length === 1 ? "Photo" : "Photos"}
                </p>
              </div>

              {event.description && (
                <p className="text-gray-300 font-light leading-relaxed max-w-3xl">{event.description}</p>
              )}

              <div className="flex flex-wrap gap-3 mt-6">
                <button
                  onClick={() => {
                    window.open(
                      `https://wa.me/?text=${encodeURIComponent(`Relive the moments from ${event.title}! ${shareUrl}`)}`,
                      "_blank",
                      "noopener,noreferrer"
                    );
                  }}
                  className="flex items-center gap-2 border border-[#d4af37]/50 text-[#d4af37] hover:bg-[#d4af37] hover:text-black px-5 py-2.5 text-xs uppercase tracking-widest transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Share on WhatsApp
                </button>
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

            {event.photos.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-[#d4af37]/30">
                <Images className="w-12 h-12 text-[#d4af37]/40 mx-auto mb-4" />
                <p className="text-gray-400 font-light">Photos for this event are coming soon.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {event.photos.map((photo, idx) => (
                  <button
                    key={photo.id}
                    onClick={() => setLightboxIndex(idx)}
                    className="group relative aspect-square overflow-hidden border border-[#d4af37]/20 hover:border-[#d4af37] transition-colors"
                  >
                    <img
                      src={photo.photoUrl}
                      alt={photo.caption || `${event.title} photo ${idx + 1}`}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {photo.caption && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-[#d4af37] text-[10px] uppercase tracking-widest truncate">{photo.caption}</p>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Lightbox */}
      {lightboxIndex !== null && event && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-5 right-5 text-[#d4af37] hover:text-white transition-colors z-10"
            aria-label="Close"
          >
            <X className="w-8 h-8" />
          </button>

          {event.photos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); showPrev(); }}
                className="absolute left-4 sm:left-8 text-[#d4af37] hover:text-white transition-colors z-10"
                aria-label="Previous photo"
              >
                <PrevIcon className="w-10 h-10" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); showNext(); }}
                className="absolute right-4 sm:right-8 text-[#d4af37] hover:text-white transition-colors z-10"
                aria-label="Next photo"
              >
                <NextIcon className="w-10 h-10" />
              </button>
            </>
          )}

          <div className="max-w-5xl max-h-[85vh] w-full px-4" onClick={(e) => e.stopPropagation()}>
            <img
              src={event.photos[lightboxIndex].photoUrl}
              alt={event.photos[lightboxIndex].caption || `${event.title} photo ${lightboxIndex + 1}`}
              className="w-full max-h-[80vh] object-contain mx-auto"
            />
            <div className="text-center mt-4">
              {event.photos[lightboxIndex].caption && (
                <p className="text-[#d4af37] text-sm uppercase tracking-widest mb-2">
                  {event.photos[lightboxIndex].caption}
                </p>
              )}
              <p className="text-white/60 text-xs uppercase tracking-widest">
                {lightboxIndex + 1} / {event.photos.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
