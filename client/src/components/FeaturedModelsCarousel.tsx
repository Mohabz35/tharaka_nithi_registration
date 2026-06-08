import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

export default function FeaturedModelsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  
  const { data: registrations, isLoading } = trpc.gallery.getPublicRegistrations.useQuery({
    category: undefined,
    search: undefined,
  });

  const models = (registrations as any)?.filter((r: any) => r.photoUrl)?.slice(0, 6) || [];

  useEffect(() => {
    if (!autoPlay || models.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.max(models.length, 1));
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, [autoPlay, models.length]);

  if (isLoading || models.length === 0) {
    return null;
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + models.length) % models.length);
    setAutoPlay(false);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % models.length);
    setAutoPlay(false);
  };

  const visibleModels = [
    models[currentIndex],
    models[(currentIndex + 1) % models.length],
    models[(currentIndex + 2) % models.length],
  ];

  return (
    <div className="relative w-full bg-gradient-to-b from-[#2a0a1a] to-[#1a0a1a] py-12 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#d4af37] rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#d4af37] rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4">
        {/* Title */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-[#d4af37] mb-2">Featured Models</h2>
          <p className="text-white text-lg">Meet our amazing participants</p>
        </div>

        {/* Carousel */}
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {visibleModels.map((model, idx) => (
              <div
                key={`${model.id}-${idx}`}
                className={`transform transition-all duration-500 ${
                  idx === 1 ? "md:scale-110 md:z-20" : "md:scale-95 opacity-75"
                }`}
              >
                <div className="bg-[#4a1a2a] rounded-lg overflow-hidden border-2 border-[#d4af37] shadow-2xl hover:shadow-[#d4af37]/50 transition-shadow">
                  {/* Model Photo */}
                  <div className="relative h-64 md:h-80 overflow-hidden bg-[#2a0a1a]">
                    {model.photoUrl ? (
                      <img
                        src={model.photoUrl}
                        alt={model.fullName}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#d4af37] to-[#4a1a2a]">
                        <span className="text-[#2a0a1a] text-4xl">👤</span>
                      </div>
                    )}
                    {/* Gold overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#2a0a1a] via-transparent to-transparent opacity-60"></div>
                  </div>

                  {/* Model Info */}
                  <div className="p-4">
                    <h3 className="text-[#d4af37] font-bold text-lg truncate">
                      {model.fullName}
                    </h3>
                    <p className="text-gray-300 text-sm">
                      {model.category === "adults"
                        ? "Adults (18-26)"
                        : model.category === "teens"
                        ? "Teens (13-17)"
                        : "Little Stars (5-12)"}
                    </p>
                    {model.talents && (
                      <p className="text-gray-400 text-xs mt-2 line-clamp-2">
                        {model.talents}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={goToPrevious}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 md:-translate-x-12 z-30 bg-[#d4af37] hover:bg-[#e5c158] text-black p-2 rounded-full transition-all"
            aria-label="Previous"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={goToNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 md:translate-x-12 z-30 bg-[#d4af37] hover:bg-[#e5c158] text-black p-2 rounded-full transition-all"
            aria-label="Next"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Indicators */}
        <div className="flex justify-center gap-2 mt-8">
          {models.map((_: any, idx: number) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentIndex(idx);
                setAutoPlay(false);
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentIndex
                  ? "bg-[#d4af37] w-8"
                  : "bg-gray-600 hover:bg-gray-400"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Auto-play toggle */}
        <div className="text-center mt-6">
          <button
            onClick={() => setAutoPlay(!autoPlay)}
            className="text-[#d4af37] hover:text-[#e5c158] text-sm transition-colors"
          >
            {autoPlay ? "⏸ Pause" : "▶ Play"} Auto-play
          </button>
        </div>
      </div>
    </div>
  );
}
