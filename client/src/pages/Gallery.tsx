import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Search, Filter, Loader2, MessageCircle, Heart } from "lucide-react";
import { useLocation } from "wouter";
import { CATEGORY_LABELS } from "@shared/const";

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
            {(Object.keys(CATEGORY_LABELS) as Array<keyof typeof CATEGORY_LABELS>).map((cat) => (
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
                {CATEGORY_LABELS[cat]}
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
                    className="bg-[#2a0a1a] border-[#d4af37] border-2 overflow-hidden hover:shadow-lg hover:shadow-[#d4af37] transition-all duration-300 transform hover:scale-105"
                  >
                    {/* Photo */}
                    <div className="relative h-64 bg-[#1a0a1a] overflow-hidden">
                      {model.photoUrl ? (
                        <img
                          src={model.photoUrl}
                          alt={model.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <p className="text-gray-400">No photo available</p>
                        </div>
                      )}

                      {/* Category Badge */}
                      <div
                        className={`absolute top-2 right-2 px-3 py-1 rounded-full text-white text-xs font-bold ${
                          categoryColors[model.category as keyof typeof categoryColors]
                        }`}
                      >
                        {CATEGORY_LABELS[model.category as keyof typeof CATEGORY_LABELS]}
                      </div>
                    </div>

                    {/* Profile Info */}
                    <CardContent className="pt-4">
                      <h3 className="text-lg font-bold text-[#d4af37] mb-1">{model.fullName}</h3>
                      <p className="text-white text-sm mb-2">Age: {model.age}</p>

                      {model.talents && (
                        <div className="mb-3">
                          <p className="text-gray-300 text-xs font-semibold mb-1">Talents:</p>
                          <p className="text-white text-sm line-clamp-2">{model.talents}</p>
                        </div>
                      )}

                      {model.posterUrl && (
                        <Button
                          onClick={() => window.open(model.posterUrl || "", "_blank")}
                          className="w-full bg-[#d4af37] text-black hover:bg-[#e5c158] text-xs font-bold py-1 mb-3"
                        >
                          View Poster
                        </Button>
                      )}

                      {/* Social Sharing Buttons */}
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => {
                            const text = `Check out ${model.fullName} in the Models Call Out event! 🌟`;
                            const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
                            window.open(url, "_blank");
                          }}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-2 rounded flex items-center justify-center gap-1 transition-colors"
                          title="Share on WhatsApp"
                        >
                          <MessageCircle className="w-3 h-3" />
                          Share
                        </button>
                        <button
                          onClick={() => {
                            const text = `Check out ${model.fullName} in the Models Call Out event! 🌟`;
                            window.open("https://www.instagram.com/", "_blank");
                          }}
                          className="flex-1 bg-pink-600 hover:bg-pink-700 text-white text-xs py-2 rounded flex items-center justify-center gap-1 transition-colors"
                          title="Share on Instagram"
                        >
                          <Heart className="w-3 h-3" />
                          Like
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
