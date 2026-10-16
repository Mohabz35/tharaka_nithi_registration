import { useState } from "react";
import { useLocation } from "wouter";
import { Menu, X, Ticket } from "lucide-react";

const TICKETS_URL = "https://www.royaliconevents.co.ke/events/mr-and-miss-tharaka-nithi-2026";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Gallery", href: "/gallery" },
  { label: "Events", href: "/events" },
  { label: "Training", href: "/training" },
  { label: "Winners", href: "/winners" },
  { label: "Merchandise", href: "/merchandise" },
];

export default function SiteHeader() {
  const [location, setLocation] = useLocation();
  const [open, setOpen] = useState(false);

  const navigate = (href: string) => {
    setOpen(false);
    setLocation(href);
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#050204]/95 backdrop-blur-md border-b border-[#d4af37]/25">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-3 group shrink-0"
          >
            <img
              src="/optimized/logo-512.webp"
              alt="Face of Tharaka-Nithi"
              width={512}
              height={512}
              className="w-9 h-9 object-contain"
            />
            <span className="hidden sm:block font-serif text-sm font-bold text-[#d4af37] uppercase tracking-[0.2em] group-hover:text-white transition-colors">
              Face of Tharaka-Nithi
            </span>
          </button>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const active = location === link.href;
              return (
                <button
                  key={link.href}
                  onClick={() => navigate(link.href)}
                  className={`px-4 py-2 text-[11px] uppercase tracking-[0.18em] font-semibold transition-colors ${
                    active
                      ? "text-[#d4af37] border-b-2 border-[#d4af37]"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </div>

          {/* Tickets CTA + mobile toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.open(TICKETS_URL, "_blank", "noopener,noreferrer")}
              className="hidden sm:flex items-center gap-2 bg-[#d4af37] text-black px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] hover:bg-white transition-colors"
            >
              <Ticket className="w-3.5 h-3.5" />
              Get Tickets
            </button>
            <button
              onClick={() => setOpen(!open)}
              className="lg:hidden text-[#d4af37] p-2 -mr-2"
              aria-label="Toggle navigation"
            >
              {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden border-t border-[#d4af37]/20 bg-[#050204] px-4 py-4 space-y-1">
          {NAV_LINKS.map((link) => {
            const active = location === link.href;
            return (
              <button
                key={link.href}
                onClick={() => navigate(link.href)}
                className={`block w-full text-left px-4 py-3 text-xs uppercase tracking-[0.2em] font-semibold transition-colors ${
                  active
                    ? "text-[#d4af37] bg-[#d4af37]/10"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {link.label}
              </button>
            );
          })}
          <button
            onClick={() => {
              setOpen(false);
              window.open(TICKETS_URL, "_blank", "noopener,noreferrer");
            }}
            className="flex items-center justify-center gap-2 w-full bg-[#d4af37] text-black px-5 py-3 mt-3 text-[11px] font-bold uppercase tracking-[0.18em]"
          >
            <Ticket className="w-3.5 h-3.5" />
            Get Tickets
          </button>
        </div>
      )}
    </nav>
  );
}
