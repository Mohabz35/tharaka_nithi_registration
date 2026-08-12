import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, Search, Edit, Save, Loader2, CheckCircle2, 
  Award, MapPin, Phone, Mail, Calendar, Hash 
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface Registration {
  id: number;
  registrationId: string;
  fullName: string;
  dateOfBirth: string;
  age: number;
  category: string;
  phoneNumber: string;
  email: string;
  countySubLocation: string;
  talents: string | null;
  paymentStatus: string;
  registrationDate: Date;
}

export default function ModelProfile() {
  const [searchEmail, setSearchEmail] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    countySubLocation: "",
    talents: "",
    category: "",
  });

  const lookupRegistration = trpc.modelProfile.getByEmail.useQuery(
    { email: searchEmail },
    { enabled: false }
  );

  const updateCategory = trpc.modelProfile.updateCategory.useMutation();
  const updateProfile = trpc.modelProfile.updateProfile.useMutation();
  const utils = trpc.useContext();

  const handleSearch = async () => {
    if (!searchEmail) {
      toast.error("Please enter your email address");
      return;
    }
    setIsSearching(true);
    try {
      const result = await lookupRegistration.refetch();
      if (result.data && result.data.length > 0) {
        setSelectedRegistration(result.data[0]);
        setEditData({
          fullName: result.data[0].fullName,
          phoneNumber: result.data[0].phoneNumber,
          email: result.data[0].email,
          countySubLocation: result.data[0].countySubLocation,
          talents: result.data[0].talents || "",
          category: result.data[0].category,
        });
        toast.success("Registration found!");
      } else {
        toast.error("No registration found with this email");
      }
    } catch (error) {
      toast.error("No registration found with this email");
    }
    setIsSearching(false);
  };

  const handleUpdateCategory = async (newCategory: string) => {
    if (!selectedRegistration) return;
    try {
      await updateCategory.mutateAsync({
        email: selectedRegistration.email,
        registrationId: selectedRegistration.id,
        category: newCategory as "adults" | "teens" | "little_stars",
      });
      setSelectedRegistration({ ...selectedRegistration, category: newCategory });
      toast.success("Category updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update category");
    }
  };

  const handleUpdateProfile = async () => {
    if (!selectedRegistration) return;
    try {
      await updateProfile.mutateAsync({
        registrationId: selectedRegistration.id,
        fullName: editData.fullName,
        phoneNumber: editData.phoneNumber,
        email: editData.email,
        countySubLocation: editData.countySubLocation,
        talents: editData.talents,
      });
      setSelectedRegistration({
        ...selectedRegistration,
        ...editData,
      });
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "adults": return "Adults (18-35)";
      case "teens": return "Teens (13-17)";
      case "little_stars": return "Little Stars (5-12)";
      default: return cat;
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "adults": return "bg-blue-900 text-blue-200";
      case "teens": return "bg-purple-900 text-purple-200";
      case "little_stars": return "bg-pink-900 text-pink-200";
      default: return "bg-gray-900 text-gray-200";
    }
  };

  return (
    <main className="min-h-screen bg-black font-sans text-white selection:bg-[#d4af37] selection:text-black">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#4a1a2a] to-[#2a0a1a] py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-[#d4af37] mb-4">
            Model Profile
          </h1>
          <p className="text-gray-300 text-lg">
            View your registration details and manage your profile
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Search Form */}
        {!selectedRegistration && (
          <Card className="bg-[#1a0a1a] border-[#d4af37]">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label className="text-white mb-2 block">Enter your email address</Label>
                  <Input
                    type="email"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="bg-[#2a0a1a] border-[#d4af37] text-white"
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="bg-[#d4af37] text-black hover:bg-[#e5c158]"
                  >
                    {isSearching ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Search className="w-4 h-4 mr-2" />
                    )}
                    Find My Registration
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profile Card */}
        {selectedRegistration && (
          <div className="space-y-6">
            {/* Registration ID Banner */}
            <Card className="bg-gradient-to-r from-[#d4af37] to-[#e5c158] border-0">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-black/20 p-3 rounded-full">
                      <Award className="w-8 h-8 text-black" />
                    </div>
                    <div>
                      <p className="text-black/60 text-sm uppercase tracking-wider">Your Registration ID</p>
                      <p className="text-black text-3xl font-bold tracking-wider">
                        {selectedRegistration.registrationId}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getCategoryColor(selectedRegistration.category)}>
                      {getCategoryLabel(selectedRegistration.category)}
                    </Badge>
                    <Badge className={selectedRegistration.paymentStatus === "completed" 
                      ? "bg-green-900 text-green-200" 
                      : "bg-yellow-900 text-yellow-200"
                    }>
                      {selectedRegistration.paymentStatus.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="details">
              <TabsList className="bg-[#1a0a1a] border border-[#d4af37]/30">
                <TabsTrigger value="details" className="data-[state=active]:bg-[#d4af37] data-[state=active]:text-black">
                  My Details
                </TabsTrigger>
                <TabsTrigger value="category" className="data-[state=active]:bg-[#d4af37] data-[state=active]:text-black">
                  Change Category
                </TabsTrigger>
              </TabsList>

              {/* Details Tab */}
              <TabsContent value="details" className="mt-4">
                <Card className="bg-[#1a0a1a] border-[#d4af37]/30">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-[#d4af37]">Registration Details</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(!isEditing)}
                        className="border-[#d4af37] text-[#d4af37]"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        {isEditing ? "Cancel" : "Edit"}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Full Name */}
                      <div className="space-y-2">
                        <Label className="text-gray-400 flex items-center gap-2">
                          <User className="w-4 h-4" /> Full Name
                        </Label>
                        {isEditing ? (
                          <Input
                            value={editData.fullName}
                            onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
                            className="bg-[#2a0a1a] border-[#d4af37] text-white"
                          />
                        ) : (
                          <p className="text-white text-lg">{selectedRegistration.fullName}</p>
                        )}
                      </div>

                      {/* Registration ID */}
                      <div className="space-y-2">
                        <Label className="text-gray-400 flex items-center gap-2">
                          <Hash className="w-4 h-4" /> Registration ID
                        </Label>
                        <p className="text-[#d4af37] text-lg font-bold">
                          {selectedRegistration.registrationId}
                        </p>
                      </div>

                      {/* Email */}
                      <div className="space-y-2">
                        <Label className="text-gray-400 flex items-center gap-2">
                          <Mail className="w-4 h-4" /> Email
                        </Label>
                        {isEditing ? (
                          <Input
                            type="email"
                            value={editData.email}
                            onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                            className="bg-[#2a0a1a] border-[#d4af37] text-white"
                          />
                        ) : (
                          <p className="text-white">{selectedRegistration.email}</p>
                        )}
                      </div>

                      {/* Phone */}
                      <div className="space-y-2">
                        <Label className="text-gray-400 flex items-center gap-2">
                          <Phone className="w-4 h-4" /> Phone
                        </Label>
                        {isEditing ? (
                          <Input
                            value={editData.phoneNumber}
                            onChange={(e) => setEditData({ ...editData, phoneNumber: e.target.value })}
                            className="bg-[#2a0a1a] border-[#d4af37] text-white"
                          />
                        ) : (
                          <p className="text-white">{selectedRegistration.phoneNumber}</p>
                        )}
                      </div>

                      {/* Age */}
                      <div className="space-y-2">
                        <Label className="text-gray-400 flex items-center gap-2">
                          <Calendar className="w-4 h-4" /> Age
                        </Label>
                        <p className="text-white">{selectedRegistration.age} years</p>
                      </div>

                      {/* Location */}
                      <div className="space-y-2">
                        <Label className="text-gray-400 flex items-center gap-2">
                          <MapPin className="w-4 h-4" /> Location
                        </Label>
                        {isEditing ? (
                          <Input
                            value={editData.countySubLocation}
                            onChange={(e) => setEditData({ ...editData, countySubLocation: e.target.value })}
                            className="bg-[#2a0a1a] border-[#d4af37] text-white"
                          />
                        ) : (
                          <p className="text-white">{selectedRegistration.countySubLocation}</p>
                        )}
                      </div>
                    </div>

                    {/* Talents */}
                    <div className="space-y-2">
                      <Label className="text-gray-400">Talents</Label>
                      {isEditing ? (
                        <Textarea
                          value={editData.talents}
                          onChange={(e) => setEditData({ ...editData, talents: e.target.value })}
                          className="bg-[#2a0a1a] border-[#d4af37] text-white"
                          rows={3}
                        />
                      ) : (
                        <p className="text-white">{selectedRegistration.talents || "Not specified"}</p>
                      )}
                    </div>

                    {isEditing && (
                      <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setIsEditing(false)} className="border-gray-500 text-gray-400">
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleUpdateProfile}
                          disabled={updateProfile.isPending}
                          className="bg-[#d4af37] text-black hover:bg-[#e5c158]"
                        >
                          {updateProfile.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                          Save Changes
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Category Tab */}
              <TabsContent value="category" className="mt-4">
                <Card className="bg-[#1a0a1a] border-[#d4af37]/30">
                  <CardHeader>
                    <CardTitle className="text-[#d4af37]">Change Your Category</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-400">
                      Current category: <Badge className={getCategoryColor(selectedRegistration.category)}>{getCategoryLabel(selectedRegistration.category)}</Badge>
                    </p>
                    <p className="text-gray-400 text-sm">
                      Select a new category below. This will update your registration.
                    </p>

                    <div className="grid gap-3">
                      {["adults", "teens", "little_stars"].map((cat) => (
                        <Button
                          key={cat}
                          variant="outline"
                          onClick={() => handleUpdateCategory(cat)}
                          disabled={selectedRegistration.category === cat || updateCategory.isPending}
                          className={`justify-start p-4 h-auto ${
                            selectedRegistration.category === cat
                              ? "border-[#d4af37] bg-[#d4af37]/20 text-[#d4af37]"
                              : "border-gray-700 text-white hover:border-[#d4af37]"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Badge className={getCategoryColor(cat)}>{getCategoryLabel(cat)}</Badge>
                            {selectedRegistration.category === cat && (
                              <span className="text-[#d4af37] text-sm">(Current)</span>
                            )}
                          </div>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Back Button */}
            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedRegistration(null);
                  setSearchEmail("");
                }}
                className="border-[#d4af37] text-[#d4af37]"
              >
                Search Another Email
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
