import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Download, LogOut } from "lucide-react";
import { useLocation } from "wouter";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<"adults" | "teens" | "little_stars">("adults");

  // Redirect if not admin
  if (user?.role !== "admin") {
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

  // Fetch registrations
  const { data: stats } = trpc.admin.getStats.useQuery();
  const { data: registrations, isLoading } = trpc.admin.getRegistrationsByCategory.useQuery(selectedCategory);

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const exportToCSV = () => {
    if (!registrations) return;

    const headers = ["Full Name", "Date of Birth", "Age", "Phone", "Email", "Location", "Registration Date"];
    const rows = registrations.map((reg) => [
      reg.fullName,
      reg.dateOfBirth,
      reg.age,
      reg.phoneNumber,
      reg.email,
      reg.countySubLocation,
      new Date(reg.registrationDate).toLocaleDateString(),
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `registrations-${selectedCategory}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

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

          {/* Registrations Table */}
          <Card className="bg-[#2a0a1a] border-[#d4af37] border-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-[#d4af37]">Registrations by Category</CardTitle>
              <Button
                onClick={exportToCSV}
                disabled={!registrations || registrations.length === 0}
                className="bg-[#d4af37] text-black hover:bg-[#e5c158]"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </CardHeader>

            <CardContent>
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
                  ) : registrations && registrations.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-[#d4af37]">
                            <TableHead className="text-[#d4af37]">Full Name</TableHead>
                            <TableHead className="text-[#d4af37]">Age</TableHead>
                            <TableHead className="text-[#d4af37]">Phone</TableHead>
                            <TableHead className="text-[#d4af37]">Email</TableHead>
                            <TableHead className="text-[#d4af37]">Location</TableHead>
                            <TableHead className="text-[#d4af37]">Registration Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {registrations.map((registration) => (
                            <TableRow key={registration.id} className="border-[#4a1a2a] hover:bg-[#4a1a2a]">
                              <TableCell className="text-white font-medium">{registration.fullName}</TableCell>
                              <TableCell className="text-white">{registration.age}</TableCell>
                              <TableCell className="text-white">{registration.phoneNumber}</TableCell>
                              <TableCell className="text-white">{registration.email}</TableCell>
                              <TableCell className="text-white">{registration.countySubLocation}</TableCell>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
