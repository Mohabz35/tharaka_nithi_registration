import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Search } from "lucide-react";

interface SearchFilterProps {
  onSearch: (query: string, filters: FilterOptions) => void;
  onReset: () => void;
  isLoading?: boolean;
}

export interface FilterOptions {
  category?: "adults" | "teens" | "little_stars";
  paymentStatus?: "pending" | "completed";
  ageMin?: number;
  ageMax?: number;
  county?: string;
}

export function AdminSearchFilter({ onSearch, onReset, isLoading }: SearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({});
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSearch = () => {
    onSearch(searchQuery, filters);
  };

  const handleReset = () => {
    setSearchQuery("");
    setFilters({});
    onReset();
  };

  const hasActiveFilters = searchQuery || Object.values(filters).some(v => v !== undefined && v !== "");

  return (
    <Card className="bg-[#2a0a1a] border-[#d4af37] border-2 mb-6">
      <CardHeader>
        <CardTitle className="text-[#d4af37] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search & Filter Models
          </div>
          {hasActiveFilters && (
            <span className="text-sm font-normal text-white bg-[#d4af37] text-black px-3 py-1 rounded-full">
              {Object.values(filters).filter(v => v !== undefined && v !== "").length + (searchQuery ? 1 : 0)} active
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search Box */}
        <div className="flex gap-2">
          <Input
            placeholder="Search by name, email, phone, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[#4a1a2a] border-[#d4af37] text-white placeholder:text-gray-400"
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button
            onClick={handleSearch}
            disabled={isLoading}
            className="bg-[#d4af37] text-black hover:bg-[#e5c158] whitespace-nowrap"
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[#d4af37] hover:text-[#e5c158] text-sm font-medium flex items-center gap-2"
        >
          {isExpanded ? "Hide Filters" : "Show Filters"}
          <span className="text-xs">({Object.keys(filters).filter(k => filters[k as keyof FilterOptions] !== undefined).length})</span>
        </button>

        {/* Expandable Filters */}
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-[#d4af37]">
            {/* Category Filter */}
            <div>
              <label className="text-[#d4af37] text-sm font-medium block mb-2">Category</label>
              <Select
                value={filters.category || ""}
                onValueChange={(value) => {
                  if (value === "") {
                    const { category, ...rest } = filters;
                    setFilters(rest);
                  } else {
                    setFilters({ ...filters, category: value as "adults" | "teens" | "little_stars" });
                  }
                }}
              >
                <SelectTrigger className="bg-[#4a1a2a] border-[#d4af37] text-white">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="bg-[#4a1a2a] border-[#d4af37]">
                  <SelectItem value="">All Categories</SelectItem>
                  <SelectItem value="adults">Adults (18–26)</SelectItem>
                  <SelectItem value="teens">Teens (13–17)</SelectItem>
                  <SelectItem value="little_stars">Little Stars (5–12)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payment Status Filter */}
            <div>
              <label className="text-[#d4af37] text-sm font-medium block mb-2">Payment Status</label>
              <Select
                value={filters.paymentStatus || ""}
                onValueChange={(value) => {
                  if (value === "") {
                    const { paymentStatus, ...rest } = filters;
                    setFilters(rest);
                  } else {
                    setFilters({ ...filters, paymentStatus: value as "pending" | "completed" });
                  }
                }}
              >
                <SelectTrigger className="bg-[#4a1a2a] border-[#d4af37] text-white">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent className="bg-[#4a1a2a] border-[#d4af37]">
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Age Range */}
            <div>
              <label className="text-[#d4af37] text-sm font-medium block mb-2">Age Range</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.ageMin || ""}
                  onChange={(e) => {
                    const value = e.target.value ? parseInt(e.target.value) : undefined;
                    setFilters({ ...filters, ageMin: value });
                  }}
                  className="bg-[#4a1a2a] border-[#d4af37] text-white placeholder:text-gray-400 w-1/2"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.ageMax || ""}
                  onChange={(e) => {
                    const value = e.target.value ? parseInt(e.target.value) : undefined;
                    setFilters({ ...filters, ageMax: value });
                  }}
                  className="bg-[#4a1a2a] border-[#d4af37] text-white placeholder:text-gray-400 w-1/2"
                />
              </div>
            </div>

            {/* County Filter */}
            <div className="md:col-span-2 lg:col-span-1">
              <label className="text-[#d4af37] text-sm font-medium block mb-2">County/Location</label>
              <Input
                placeholder="Search location..."
                value={filters.county || ""}
                onChange={(e) => {
                  if (e.target.value === "") {
                    const { county, ...rest } = filters;
                    setFilters(rest);
                  } else {
                    setFilters({ ...filters, county: e.target.value });
                  }
                }}
                className="bg-[#4a1a2a] border-[#d4af37] text-white placeholder:text-gray-400"
              />
            </div>

            {/* Action Buttons */}
            <div className="md:col-span-2 lg:col-span-1 flex gap-2 items-end">
              <Button
                onClick={handleSearch}
                disabled={isLoading}
                className="bg-[#d4af37] text-black hover:bg-[#e5c158] flex-1"
              >
                Apply Filters
              </Button>
              {hasActiveFilters && (
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-black"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
