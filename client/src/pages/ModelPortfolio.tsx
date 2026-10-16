import { useState } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  Loader2, ChevronLeft, User, MapPin, Sparkles, Ruler, Film, Link2, MessageCircle,
  Instagram, Facebook, CalendarCheck, Send, ExternalLink,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { usePageMeta, SITE_URL } from "@/hooks/usePageMeta";
import SiteHeader from "@/components/SiteHeader";

const categoryLabels: Record<string, string> = {
  adults: "Adults (18–35)",
  teens: "Teens (13–17)",
  little_stars: "Little Stars (5–12)",
};

const measurementLabels: Record<string, string> = {
  height: "Height",
  chest: "Chest / Bust",
  waist: "Waist",
  hips: "Hips",
  shoe: "Shoe",
  eyes: "Eye Colour",
  hair: "Hair",
};

const socialLabels: Record<string, { label: string; href: (v: string) => string }> = {
  instagram: { label: "Instagram", href: (v) => (v.startsWith("http") ? v : `https://instagram.com/${v.replace(/^@/, "")}`) },
  tiktok: { label: "TikTok", href: (v) => (v.startsWith("http") ? v : `https://tiktok.com/@${v.replace(/^@/, "")}`) },
  twitter: { label: "Twitter / X", href: (v) => (v.startsWith("http") ? v : `https://x.com/${v.replace(/^@/, "")}`) },
  facebook: { label: "Facebook", href: (v) => (v.startsWith("http") ? v : `https://facebook.com/${v.replace(/^@/, "")}`) },
};

function youtubeEmbed(url: string): string | null {
  const match =
    url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/) || null;
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

function vimeoEmbed(url: string): string | null {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/) || null;
  return match ? `https://player.vimeo.com/video/${match[1]}` : null;
}

export default function ModelPortfolio({ params }: { params: { slug: string } }) {
  const [, setLocation] = useLocation();
  const { data: model, isLoading, error } = trpc.modelProfile.getPortfolio.useQuery(
    { slug: params.slug },
    { enabled: !!params.slug, retry: false }
  );

  const [showBooking, setShowBooking] = useState(false);
  const [booking, setBooking] = useState({
    clientName: "", clientEmail: "", clientPhone: "", eventType: "", eventDate: "", budget: "", message: "",
  });

  const bookModel = trpc.modelProfile.bookModel.useMutation({
    onSuccess: () => {
      toast.success("Enquiry sent! The team will contact you shortly.", { style: { background: "#d4af37", color: "#000" } });
      setShowBooking(false);
      setBooking({ clientName: "", clientEmail: "", clientPhone: "", eventType: "", eventDate: "", budget: "", message: "" });
    },
    onError: (err) => toast.error(err.message || "Failed to send enquiry"),
  });

  usePageMeta({
    title: model ? `${model.fullName} - Model Portfolio | Tharaka Nithi Models` : "Model Portfolio | Tharaka Nithi Models",
    description: model?.bio || (model ? `${model.fullName} — model portfolio, ${categoryLabels[model.category] || model.category}, Tharaka-Nithi County.` : undefined),
    image: model?.photoUrl || model?.posterUrl || undefined,
    path: model ? `/models/${model.slug}` : undefined,
    type: "profile",
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0508] flex flex-col items-center justify-center text-white gap-4">
        <Loader2 className="w-10 h-10 text-[#d4af37] animate-spin" />
        <p className="text-[#d4af37]/70 uppercase tracking-widest text-sm">Loading portfolio...</p>
      </div>
    );
  }

  if (error || !model) {
    return (
      <div className="min-h-screen bg-[#0a0508] flex flex-col items-center justify-center text-white gap-4 px-4">
        <User className="w-16 h-16 text-[#d4af37]/40" />
        <p className="text-[#d4af37] uppercase tracking-widest text-center">Model not found</p>
        <Button onClick={() => setLocation("/gallery")} className="bg-[#d4af37] text-black uppercase tracking-widest rounded-none">
          Browse Gallery
        </Button>
      </div>
    );
  }

  const shareUrl = `${SITE_URL}/share/model/${model.slug}`;
  const shareText = `Check out ${model.fullName}'s portfolio on Face of Tharaka-Nithi: ${shareUrl}`;
  const talents = (model.talents || "").split(",").map((t) => t.trim()).filter(Boolean);
  const measurements = Object.entries(model.measurements || {}).filter(([, v]) => v);
  const socials = Object.entries(model.socials || {}).filter(([, v]) => v);
  const embedSrc = model.showreelUrl ? youtubeEmbed(model.showreelUrl) || vimeoEmbed(model.showreelUrl) : null;

  const submitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    bookModel.mutate({ registrationId: model.id, ...booking });
  };

  return (
    <div className="min-h-screen bg-[#0a0508] text-white font-sans selection:bg-[#d4af37] selection:text-black">
      <SiteHeader />
      <div className="w-full h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />

      <header className="bg-[#050204] border-b border-[#d4af37]/20 py-5 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setLocation("/gallery")}
            className="flex items-center gap-2 text-[#d4af37]/70 hover:text-[#d4af37] text-xs uppercase tracking-widest transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Gallery
          </button>
          <p className="text-[#d4af37] text-xs uppercase tracking-[0.3em]">Model Portfolio</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-12">
        <div className="grid md:grid-cols-2 gap-10 items-start">
          <div className="relative border border-[#d4af37]/40 shadow-[0_0_40px_rgba(212,175,55,0.2)] overflow-hidden">
            {model.photoUrl || model.posterUrl ? (
              <img
                src={(model.photoUrl || model.posterUrl)!}
                alt={model.fullName}
                loading="lazy"
                className="w-full object-cover aspect-[3/4]"
              />
            ) : (
              <div className="aspect-[3/4] flex items-center justify-center bg-gradient-to-br from-[#2a0a1a] to-[#1a0c14]">
                <User className="w-24 h-24 text-[#d4af37]/40" />
              </div>
            )}
            {model.availableForBookings && (
              <span className="absolute top-4 left-4 bg-[#d4af37] text-black px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest">
                Available for bookings
              </span>
            )}
          </div>

          <div>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-[#d4af37] mb-2 uppercase tracking-wide">
              {model.fullName}
            </h1>
            <p className="text-[#d4af37]/70 text-xs uppercase tracking-widest mb-1">
              {categoryLabels[model.category] || model.category}
            </p>
            <div className="flex flex-wrap gap-4 text-gray-400 text-sm mb-6">
              {model.countySubLocation && (
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-[#d4af37]/60" />{model.countySubLocation}</span>
              )}
              <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-[#d4af37]/60" />Age {model.age}</span>
            </div>

            {model.bio && (
              <div className="bg-[#140a10] border border-[#d4af37]/30 p-5 mb-6">
                <p className="text-[#d4af37] text-xs uppercase tracking-widest mb-2">About</p>
                <p className="text-gray-300 font-light leading-relaxed whitespace-pre-line">{model.bio}</p>
              </div>
            )}

            {talents.length > 0 && (
              <div className="mb-6">
                <p className="text-[#d4af37] text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Talents
                </p>
                <div className="flex flex-wrap gap-2">
                  {talents.map((t) => (
                    <span key={t} className="border border-[#d4af37]/40 text-[#d4af37]/90 px-3 py-1 text-xs tracking-wider">{t}</span>
                  ))}
                </div>
              </div>
            )}

            {measurements.length > 0 && (
              <div className="mb-6">
                <p className="text-[#d4af37] text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Ruler className="w-4 h-4" /> Measurements
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {measurements.map(([key, value]) => (
                    <div key={key} className="bg-[#140a10] border border-[#d4af37]/20 px-3 py-2">
                      <p className="text-[#d4af37]/60 text-[10px] uppercase tracking-widest">{measurementLabels[key] || key}</p>
                      <p className="text-white text-sm font-light">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {model.showreelUrl && (
              <div className="mb-6">
                <p className="text-[#d4af37] text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Film className="w-4 h-4" /> Showreel
                </p>
                {embedSrc ? (
                  <div className="relative w-full aspect-video border border-[#d4af37]/30 overflow-hidden">
                    <iframe
                      src={embedSrc}
                      title={`${model.fullName} showreel`}
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <a
                    href={model.showreelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[#d4af37] hover:underline break-all"
                  >
                    <ExternalLink className="w-4 h-4" /> Watch showreel
                  </a>
                )}
              </div>
            )}

            {socials.length > 0 && (
              <div className="mb-6">
                <p className="text-[#d4af37] text-xs uppercase tracking-widest mb-2">Follow</p>
                <div className="flex flex-wrap gap-3">
                  {socials.map(([key, value]) => {
                    const meta = socialLabels[key];
                    if (!meta) return null;
                    return (
                      <a
                        key={key}
                        href={meta.href(value)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 border border-[#d4af37]/40 text-[#d4af37] hover:bg-[#d4af37] hover:text-black px-4 py-2 text-xs uppercase tracking-widest transition-colors"
                      >
                        {key === "instagram" ? <Instagram className="w-4 h-4" /> : key === "facebook" ? <Facebook className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                        {meta.label}
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {model.availableForBookings && (
              <div className="border-t border-[#d4af37]/20 pt-6 mb-6">
                <Button
                  onClick={() => setShowBooking((s) => !s)}
                  className="w-full sm:w-auto bg-[#d4af37] text-black uppercase tracking-widest rounded-none font-bold flex items-center gap-2"
                >
                  <CalendarCheck className="w-4 h-4" />
                  {showBooking ? "Hide booking form" : "Book this model"}
                </Button>

                {showBooking && (
                  <form onSubmit={submitBooking} className="mt-6 bg-[#140a10] border border-[#d4af37]/30 p-5 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <input
                        required
                        placeholder="Your name *"
                        value={booking.clientName}
                        onChange={(e) => setBooking({ ...booking, clientName: e.target.value })}
                        className="bg-[#0a0508] border border-[#d4af37]/30 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#d4af37]"
                      />
                      <input
                        required
                        type="email"
                        placeholder="Your email *"
                        value={booking.clientEmail}
                        onChange={(e) => setBooking({ ...booking, clientEmail: e.target.value })}
                        className="bg-[#0a0508] border border-[#d4af37]/30 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#d4af37]"
                      />
                      <input
                        placeholder="Phone (WhatsApp)"
                        value={booking.clientPhone}
                        onChange={(e) => setBooking({ ...booking, clientPhone: e.target.value })}
                        className="bg-[#0a0508] border border-[#d4af37]/30 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#d4af37]"
                      />
                      <input
                        placeholder="Event type (runway, shoot, campaign...)"
                        value={booking.eventType}
                        onChange={(e) => setBooking({ ...booking, eventType: e.target.value })}
                        className="bg-[#0a0508] border border-[#d4af37]/30 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#d4af37]"
                      />
                      <input
                        placeholder="Event date"
                        value={booking.eventDate}
                        onChange={(e) => setBooking({ ...booking, eventDate: e.target.value })}
                        className="bg-[#0a0508] border border-[#d4af37]/30 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#d4af37]"
                      />
                      <input
                        placeholder="Budget (KES)"
                        value={booking.budget}
                        onChange={(e) => setBooking({ ...booking, budget: e.target.value })}
                        className="bg-[#0a0508] border border-[#d4af37]/30 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#d4af37]"
                      />
                    </div>
                    <textarea
                      required
                      rows={4}
                      placeholder="Tell us about the booking *"
                      value={booking.message}
                      onChange={(e) => setBooking({ ...booking, message: e.target.value })}
                      className="w-full bg-[#0a0508] border border-[#d4af37]/30 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#d4af37]"
                    />
                    <Button
                      type="submit"
                      disabled={bookModel.isPending}
                      className="bg-[#d4af37] text-black uppercase tracking-widest rounded-none font-bold flex items-center gap-2"
                    >
                      {bookModel.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Send enquiry
                    </Button>
                  </form>
                )}
              </div>
            )}

            <div className="border-t border-[#d4af37]/20 pt-6">
              <p className="text-[#d4af37] text-xs uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Share this portfolio
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
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    toast.success("Portfolio link copied!", { style: { background: "#d4af37", color: "#000" } });
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
      </main>
    </div>
  );
}
