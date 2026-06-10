import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Search, Loader2, MessageCircle, Share2, Facebook, Instagram } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Gallery() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<"adults" | "teens" | "little_stars" | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "talents">("newest");

  // Fetch gallery data
  const { data: galleryData, isLoading } = trpc.gallery.getPublicRegistrations.useQuery({
    category: selectedCategory,
    search: searchQuery,
  });

  // Sort gallery data
  const sortedData = galleryData ? [...galleryData].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime();
    } else if (sortBy === "talents") {
      return (a.talents || "").localeCompare(b.talents || "");
    }
    return 0;
  }) : [];

  const categoryLabels = {
    adults: "Adults (18–26)",
    teens: "Teens (13–17)",
    little_stars: "Little Stars (5–12)",
  };

  const categoryColors = {
    adults: "bg-purple-600",
    teens: "bg-pink-600",
    little_stars: "bg-blue-600",
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#4a1a2a] via-[#5a2a3a] to-[#3a1a2a]">
      {/* Header */}
      <header className="bg-black bg-opacity-50 border-b border-[#d4af37] py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-[#d4af37]">Models Gallery</h1>
            <Button
              onClick={() => setLocation("/")}
              className="bg-[#d4af37] text-black hover:bg-[#e5c158]"
            >
              Back to Home
            </Button>
          </div>

          {/* Search Bar */}
          <div className="flex gap-2 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-[#d4af37]" />
              <Input
                placeholder="Search models by name or talents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#2a0a1a] border-[#d4af37] text-white placeholder-gray-400"
              />
            </div>
          </div>

          {/* Sort Options */}
          <div className="flex gap-2 mb-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "newest" | "talents")}
              className="bg-[#2a0a1a] border-2 border-[#d4af37] text-[#d4af37] px-4 py-2 rounded font-semibold hover:bg-[#3a1a2a] transition-colors"
            >
              <option value="newest">Sort by: Newest First</option>
              <option value="talents">Sort by: Talents</option>
            </select>
          </div>

          {/* Category Filters */}
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => setSelectedCategory(undefined)}
              variant={selectedCategory === undefined ? "default" : "outline"}
              className={`${
                selectedCategory === undefined
                  ? "bg-[#d4af37] text-black"
                  : "border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-black"
              }`}
            >
              All Categories
            </Button>
            {(Object.keys(categoryLabels) as Array<keyof typeof categoryLabels>).map((cat) => (
              <Button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                variant={selectedCategory === cat ? "default" : "outline"}
                className={`${
                  selectedCategory === cat
                    ? "bg-[#d4af37] text-black"
                    : "border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-black"
                }`}
              >
                {categoryLabels[cat]}
              </Button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#d4af37]" />
            </div>
          ) : galleryData && galleryData.length > 0 ? (
            <>
              <p className="text-white text-center mb-8 text-lg">
                Showing <span className="font-bold text-[#d4af37]">{galleryData.length}</span> registered models
              </p>

              {/* Gallery Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sortedData.map((model) => (
                  <Card
                    key={model.id}
                    className="bg-[#2a0a1a] border-[#d4af37] border-2 overflow-hidden hover:shadow-lg hover:shadow-[#d4af37]/50 transition-all duration-300 hover:scale-[1.02]"
                  >
                    {/* Photo */}
                    <div className="relative h-72 bg-[#1a0a1a] overflow-hidden">
                      {model.photoUrl ? (
                        <img
                          src={model.photoUrl}
                          alt={`${model.fullName} - ${model.category} contestant at Mr & Miss Face of Tharaka-Nithi 2026`}
                          className="w-full h-full object-cover object-top"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <p className="text-gray-400">No photo available</p>
                        </div>
                      )}

                      {/* Category Badge */}
                      <div
                        className={`absolute top-2 right-2 px-2 py-1 rounded-full text-white text-xs font-bold ${
                          categoryColors[model.category as keyof typeof categoryColors]
                        }`}
                      >
                        {categoryLabels[model.category as keyof typeof categoryLabels]}
                      </div>
                    </div>

                    {/* Profile Info */}
                    <CardContent className="pt-4 pb-4">
                      <h3 className="text-base font-bold text-[#d4af37] mb-1 truncate">{model.fullName}</h3>
                      <p className="text-gray-300 text-sm">Age: {model.age} &nbsp;|&nbsp; 📍 {(model as any).countySubLocation}</p>

                      {model.talents && (
                        <p className="text-white text-xs mt-2 line-clamp-2 italic">"{model.talents}"</p>
                      )}

                      {/* Social Sharing Buttons */}
                      <div className="grid grid-cols-4 gap-1 mt-3">
                        {/* WhatsApp */}
                        <button
                          title="Share on WhatsApp"
                          onClick={() => {
                            const text = `🌟 Support ${model.fullName} at Mr & Miss Face of Tharaka-Nithi County 2026! Register at https://www.faceoftharakanithi.app`;
                            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
                          }}
                          className="bg-green-700 hover:bg-green-600 text-white text-xs py-2 rounded flex items-center justify-center transition-colors"
                        >
                          <MessageCircle className="w-3 h-3" />
                        </button>
                        {/* Facebook */}
                        <button
                          title="Share on Facebook"
                          onClick={() => {
                            const url = encodeURIComponent("https://www.faceoftharakanithi.app");
                            const quote = encodeURIComponent(`🌟 Support ${model.fullName} at Mr & Miss Face of Tharaka-Nithi County 2026!`);
                            window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${quote}`, "_blank");
                          }}
                          className="bg-blue-700 hover:bg-blue-600 text-white text-xs py-2 rounded flex items-center justify-center transition-colors"
                        >
                          <Facebook className="w-3 h-3" />
                        </button>
                        {/* Twitter / X */}
                        <button
                          title="Share on Twitter/X"
                          onClick={() => {
                            const text = `🌟 Support ${model.fullName} at Mr & Miss Face of Tharaka-Nithi 2026! #FaceOfTharakaNithi`;
                            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
                          }}
                          className="bg-sky-700 hover:bg-sky-600 text-white text-xs py-2 rounded flex items-center justify-center transition-colors"
                        >
                          <Share2 className="w-3 h-3" />
                        </button>
                        {/* Instagram */}
                        <button
                          title="Share on Instagram"
                          onClick={() => {
                            const text = `🌟 Support ${model.fullName} at Mr & Miss Face of Tharaka-Nithi County 2026! Check out the gallery at https://www.faceoftharakanithi.app #FaceOfTharakaNithi #TharakaNithiModels2026`;
                            if (navigator.share) {
                              navigator.share({ title: "Face of Tharaka-Nithi 2026", text }).catch(() => {});
                            } else {
                              navigator.clipboard.writeText(text);
                              toast.success("Caption copied! Paste it on Instagram.");
                            }
                          }}
                          className="bg-gradient-to-br from-pink-600 to-purple-700 hover:from-pink-500 hover:to-purple-600 text-white text-xs py-2 rounded flex items-center justify-center transition-colors"
                        >
                          <Instagram className="w-3 h-3" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <p className="text-white text-lg mb-4">
                {searchQuery || selectedCategory ? "No models found matching your search." : "No models registered yet."}
              </p>
              <p className="text-gray-400">Check back soon as more models register for the event!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
