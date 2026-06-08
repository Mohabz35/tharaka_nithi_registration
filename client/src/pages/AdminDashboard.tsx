import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminSearchFilter, type FilterOptions } from "@/components/AdminSearchFilter";
import { trpc } from "@/lib/trpc";
import { Download, LogOut, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { CATEGORY_LABELS } from "@shared/const";

export default function AdminDashboard() {
  const { user, logout, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<"adults" | "teens" | "little_stars">("adults");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<FilterOptions>({});

  // Check if user is admin - but don't return early yet
  const isAdmin = user?.role === "admin";

  // Determine if we're in search mode
  const isSearchMode = searchQuery !== "" || Object.values(activeFilters).some(v => v !== undefined);

  // Fetch registrations - always call all hooks, use enabled flag for auth
  const { data: stats, isLoading: isLoadingStats } = trpc.admin.getStats.useQuery(undefined, { enabled: isAdmin });
  const { data: allRegistrations, isLoading: isLoadingAll } = trpc.admin.getAllRegistrations.useQuery(undefined, { enabled: isAdmin });
  const { data: categoryRegistrations, isLoading: isLoadingCategory } = trpc.admin.getRegistrationsByCategory.useQuery(selectedCategory, { enabled: isAdmin });
  const { data: searchResults, isLoading: isSearching } = trpc.admin.searchAndFilter.useQuery(
    { query: searchQuery, filters: activeFilters },
    { enabled: isAdmin && isSearchMode }
  );

  const isLoading = loading || isLoadingStats || (isSearchMode ? isSearching : (isLoadingAll || isLoadingCategory));

  // Determine which registrations to display
  const displayRegistrations = useMemo(() => {
    if (isSearchMode) {
      return searchResults || [];
    }
    return categoryRegistrations || [];
  }, [isSearchMode, searchResults, categoryRegistrations]);

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const handleSearch = (query: string, filters: FilterOptions) => {
    setSearchQuery(query);
    setActiveFilters(filters);
  };

  const handleReset = () => {
    setSearchQuery("");
    setActiveFilters({});
  };

  const exportToCSV = () => {
    if (!displayRegistrations || displayRegistrations.length === 0) return;

    const headers = ["Full Name", "Date of Birth", "Age", "Category", "Phone", "Email", "Location", "Payment Status", "Registration Date"];
    const rows = displayRegistrations.map((reg) => [
      reg.fullName,
      reg.dateOfBirth,
      reg.age,
      CATEGORY_LABELS[reg.category as keyof typeof CATEGORY_LABELS],
      reg.phoneNumber,
      reg.email,
      reg.countySubLocation,
      reg.paymentStatus,
      new Date(reg.registrationDate).toLocaleDateString(),
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `registrations-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  // Show loading state while auth is resolving
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#4a1a2a] via-[#5a2a3a] to-[#3a1a2a] flex items-center justify-center">
        <Card className="bg-[#2a0a1a] border-[#d4af37] border-2 max-w-md">
          <CardContent className="pt-6 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#d4af37] mx-auto mb-4" />
            <p className="text-white">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show permission denied if not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#4a1a2a] via-[#5a2a3a] to-[#3a1a2a] flex items-center justify-center">
        <Card className="bg-[#2a0a1a] border-[#d4af37] border-2 max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-white mb-4">You do not have permission to access this page.</p>
            <Button
              onClick={() => setLocation("/")}
              className="bg-[#d4af37] text-black hover:bg-[#e5c158]"
            >
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#4a1a2a] via-[#5a2a3a] to-[#3a1a2a]">
      {/* Header */}
      <header className="bg-black bg-opacity-50 border-b border-[#d4af37] py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold text-[#d4af37]">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-white">Welcome, {user?.name}</span>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-black"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="bg-[#2a0a1a] border-[#d4af37] border-2">
                <CardHeader>
                  <CardTitle className="text-[#d4af37] text-sm">Total Registrations</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-white">{stats.total}</p>
                </CardContent>
              </Card>

              <Card className="bg-[#2a0a1a] border-[#d4af37] border-2">
                <CardHeader>
                  <CardTitle className="text-[#d4af37] text-sm">Adults (18–26)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-white">{stats.adults}</p>
                </CardContent>
              </Card>

              <Card className="bg-[#2a0a1a] border-[#d4af37] border-2">
                <CardHeader>
                  <CardTitle className="text-[#d4af37] text-sm">Teens (13–17)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-white">{stats.teens}</p>
                </CardContent>
              </Card>

              <Card className="bg-[#2a0a1a] border-[#d4af37] border-2">
                <CardHeader>
                  <CardTitle className="text-[#d4af37] text-sm">Little Stars (5–12)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-white">{stats.littleStars}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Search and Filter Component */}
          <AdminSearchFilter
            onSearch={handleSearch}
            onReset={handleReset}
            isLoading={isLoading}
          />

          {/* Registrations Table */}
          <Card className="bg-[#2a0a1a] border-[#d4af37] border-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-[#d4af37]">
                  {isSearchMode
                    ? `Search Results (${displayRegistrations?.length || 0})`
                    : `Registrations by Category (${displayRegistrations?.length || 0})`}
                </CardTitle>
              </div>
              <Button
                onClick={exportToCSV}
                disabled={!displayRegistrations || displayRegistrations.length === 0}
                className="bg-[#d4af37] text-black hover:bg-[#e5c158]"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </CardHeader>

            <CardContent>
              {isSearchMode ? (
                // Search Results View
                <>
                  {isLoading ? (
                    <p className="text-white text-center py-8">Searching...</p>
                  ) : displayRegistrations && displayRegistrations.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-[#d4af37]">
                            <TableHead className="text-[#d4af37]">Full Name</TableHead>
                            <TableHead className="text-[#d4af37]">Category</TableHead>
                            <TableHead className="text-[#d4af37]">Age</TableHead>
                            <TableHead className="text-[#d4af37]">Phone</TableHead>
                            <TableHead className="text-[#d4af37]">Email</TableHead>
                            <TableHead className="text-[#d4af37]">Location</TableHead>
                            <TableHead className="text-[#d4af37]">Payment</TableHead>
                            <TableHead className="text-[#d4af37]">Registration Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {displayRegistrations.map((registration) => (
                            <TableRow key={registration.id} className="border-[#4a1a2a] hover:bg-[#4a1a2a]">
                              <TableCell className="text-white font-medium">{registration.fullName}</TableCell>
                              <TableCell className="text-white">
                                {CATEGORY_LABELS[registration.category as keyof typeof CATEGORY_LABELS]}
                              </TableCell>
                              <TableCell className="text-white">{registration.age}</TableCell>
                              <TableCell className="text-white">{registration.phoneNumber}</TableCell>
                              <TableCell className="text-white text-sm">{registration.email}</TableCell>
                              <TableCell className="text-white">{registration.countySubLocation}</TableCell>
                              <TableCell className="text-white">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  registration.paymentStatus === "completed"
                                    ? "bg-green-900 text-green-200"
                                    : "bg-yellow-900 text-yellow-200"
                                }`}>
                                  {registration.paymentStatus}
                                </span>
                              </TableCell>
                              <TableCell className="text-white">
                                {new Date(registration.registrationDate).toLocaleDateString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-white text-center py-8">No registrations found matching your search criteria.</p>
                  )}
                </>
              ) : (
                // Category View
                <Tabs
                  value={selectedCategory}
                  onValueChange={(value) => setSelectedCategory(value as "adults" | "teens" | "little_stars")}
                >
                  <TabsList className="grid w-full grid-cols-3 bg-[#4a1a2a]">
                    <TabsTrigger
                      value="adults"
                      className="data-[state=active]:bg-[#d4af37] data-[state=active]:text-black text-white"
                    >
                      Adults (18–26)
                    </TabsTrigger>
                    <TabsTrigger
                      value="teens"
                      className="data-[state=active]:bg-[#d4af37] data-[state=active]:text-black text-white"
                    >
                      Teens (13–17)
                    </TabsTrigger>
                    <TabsTrigger
                      value="little_stars"
                      className="data-[state=active]:bg-[#d4af37] data-[state=active]:text-black text-white"
                    >
                      Little Stars (5–12)
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value={selectedCategory} className="mt-6">
                    {isLoading ? (
                      <p className="text-white text-center py-8">Loading registrations...</p>
                    ) : displayRegistrations && displayRegistrations.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-[#d4af37]">
                              <TableHead className="text-[#d4af37]">Full Name</TableHead>
                              <TableHead className="text-[#d4af37]">Age</TableHead>
                              <TableHead className="text-[#d4af37]">Phone</TableHead>
                              <TableHead className="text-[#d4af37]">Email</TableHead>
                              <TableHead className="text-[#d4af37]">Location</TableHead>
                              <TableHead className="text-[#d4af37]">Payment</TableHead>
                              <TableHead className="text-[#d4af37]">Registration Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {displayRegistrations.map((registration) => (
                              <TableRow key={registration.id} className="border-[#4a1a2a] hover:bg-[#4a1a2a]">
                                <TableCell className="text-white font-medium">{registration.fullName}</TableCell>
                                <TableCell className="text-white">{registration.age}</TableCell>
                                <TableCell className="text-white">{registration.phoneNumber}</TableCell>
                                <TableCell className="text-white text-sm">{registration.email}</TableCell>
                                <TableCell className="text-white">{registration.countySubLocation}</TableCell>
                                <TableCell className="text-white">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    registration.paymentStatus === "completed"
                                      ? "bg-green-900 text-green-200"
                                      : "bg-yellow-900 text-yellow-200"
                                  }`}>
                                    {registration.paymentStatus}
                                  </span>
                                </TableCell>
                                <TableCell className="text-white">
                                  {new Date(registration.registrationDate).toLocaleDateString()}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <p className="text-white text-center py-8">No registrations yet for this category.</p>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
