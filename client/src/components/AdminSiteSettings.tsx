import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const SOCIAL_PLATFORMS = ["instagram", "tiktok", "twitter", "facebook", "youtube", "whatsapp"] as const;

// Convert a stored ISO/local datetime string into the value a
// <input type="datetime-local"> expects: "YYYY-MM-DDTHH:mm"
function toDatetimeLocal(value: string): string {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminSiteSettings() {
  const { data: settings, isLoading, refetch } = trpc.siteSettings.getAll.useQuery();
  const updateMutation = trpc.admin.updateSiteSetting.useMutation();

  const [formData, setFormData] = useState<Record<string, string>>({
    instagram: "",
    tiktok: "",
    twitter: "",
    facebook: "",
    youtube: "",
    whatsapp: "",
  });

  const [deadline, setDeadline] = useState("");
  const isClosed = settings?.registration_closed === "true";

  useEffect(() => {
    if (settings) {
      setFormData((prev) => ({
        ...prev,
        ...settings,
      }));
      setDeadline(toDatetimeLocal(settings.registration_deadline || ""));
    }
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (key: string) => {
    try {
      await updateMutation.mutateAsync({
        key,
        value: formData[key] || "",
      });
      toast.success("Settings saved successfully!");
      refetch();
    } catch (err) {
      toast.error("Failed to save settings");
      console.error(err);
    }
  };

  const handleSaveDeadline = async () => {
    if (!deadline) {
      toast.error("Please choose a deadline date and time.");
      return;
    }
    try {
      await updateMutation.mutateAsync({ key: "registration_deadline", value: deadline });
      toast.success("Registration deadline updated!");
      refetch();
    } catch (err) {
      toast.error("Failed to update deadline");
      console.error(err);
    }
  };

  const handleToggleClosed = async () => {
    try {
      await updateMutation.mutateAsync({
        key: "registration_closed",
        value: isClosed ? "false" : "true",
      });
      toast.success(isClosed ? "Registration re-opened!" : "Registration closed!");
      refetch();
    } catch (err) {
      toast.error("Failed to update registration status");
      console.error(err);
    }
  };

  if (isLoading) return <div className="text-center py-8 text-white"><Loader2 className="animate-spin mx-auto w-8 h-8 text-[#d4af37]" /></div>;

  return (
    <div className="space-y-6">
      {/* Registration Control */}
      <Card className="bg-[#2a0a1a] border-[#d4af37] border-2">
        <CardHeader>
          <CardTitle className="text-[#d4af37]">Registration Control</CardTitle>
          <CardDescription className="text-gray-400">
            Set the registration deadline or close registration entirely.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1">
              <label className="text-white text-sm block mb-1">Registration Deadline</label>
              <Input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="bg-[#4a1a2a] text-white border-[#d4af37]"
              />
            </div>
            <Button
              onClick={handleSaveDeadline}
              disabled={updateMutation.isPending && updateMutation.variables?.key === "registration_deadline"}
              className="bg-[#d4af37] text-black hover:bg-[#e5c158]"
            >
              {updateMutation.isPending && updateMutation.variables?.key === "registration_deadline" ? "Saving..." : "Save Deadline"}
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-[#d4af37]/30 pt-4">
            <div>
              <p className="text-white font-semibold">
                Status: {isClosed ? (
                  <span className="text-red-400">Closed</span>
                ) : (
                  <span className="text-green-400">Open</span>
                )}
              </p>
              <p className="text-gray-400 text-sm">
                {isClosed
                  ? "New registrations are blocked regardless of the deadline."
                  : "New registrations are accepted until the deadline above."}
              </p>
            </div>
            <Button
              onClick={handleToggleClosed}
              disabled={updateMutation.isPending && updateMutation.variables?.key === "registration_closed"}
              className={isClosed
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-red-600 text-white hover:bg-red-700"}
            >
              {updateMutation.isPending && updateMutation.variables?.key === "registration_closed"
                ? "Updating..."
                : isClosed ? "Re-open Registration" : "Close Registration"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Social Media */}
      <Card className="bg-[#2a0a1a] border-[#d4af37] border-2">
        <CardHeader>
          <CardTitle className="text-[#d4af37]">Site Settings & Content Management</CardTitle>
          <CardDescription className="text-gray-400">
            Update the social media links that appear in the website footer. Leave blank to hide the icon.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">Social Media Links</h3>

            <div className="grid gap-4">
              {SOCIAL_PLATFORMS.map((platform) => (
                <div key={platform} className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-white text-sm capitalize block mb-1">{platform}</label>
                    <Input
                      name={platform}
                      value={formData[platform] || ""}
                      onChange={handleChange}
                      placeholder={`Enter ${platform} URL`}
                      className="bg-[#4a1a2a] text-white border-[#d4af37]"
                    />
                  </div>
                  <Button
                    onClick={() => handleSave(platform)}
                    disabled={updateMutation.isPending && updateMutation.variables?.key === platform}
                    className="mt-6 bg-[#d4af37] text-black hover:bg-[#e5c158]"
                  >
                    {updateMutation.isPending && updateMutation.variables?.key === platform ? "Saving..." : "Save"}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
