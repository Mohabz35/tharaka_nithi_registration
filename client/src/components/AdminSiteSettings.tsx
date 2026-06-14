import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function AdminSiteSettings() {
  const {
    data: settings,
    isLoading,
    refetch,
  } = trpc.siteSettings.getAll.useQuery();
  const updateMutation = trpc.siteSettings.update.useMutation();

  const [formData, setFormData] = useState<Record<string, string>>({
    instagram: "",
    tiktok: "",
    twitter: "",
    facebook: "",
    youtube: "",
    whatsapp: "",
  });

  useEffect(() => {
    if (settings) {
      setFormData(prev => ({
        ...prev,
        ...settings,
      }));
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

  if (isLoading)
    return (
      <div className="text-center py-8 text-white">
        <Loader2 className="animate-spin mx-auto w-8 h-8 text-[#d4af37]" />
      </div>
    );

  return (
    <Card className="bg-[#2a0a1a] border-[#d4af37] border-2">
      <CardHeader>
        <CardTitle className="text-[#d4af37]">
          Site Settings & Content Management
        </CardTitle>
        <CardDescription className="text-gray-400">
          Update the social media links that appear in the website footer. Leave
          blank to hide the icon.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white">
            Social Media Links
          </h3>

          <div className="grid gap-4">
            {Object.keys(formData).map(platform => (
              <div key={platform} className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-white text-sm capitalize block mb-1">
                    {platform}
                  </label>
                  <Input
                    name={platform}
                    value={formData[platform]}
                    onChange={handleChange}
                    placeholder={`Enter ${platform} URL`}
                    className="bg-[#4a1a2a] text-white border-[#d4af37]"
                  />
                </div>
                <Button
                  onClick={() => handleSave(platform)}
                  disabled={
                    updateMutation.isPending &&
                    updateMutation.variables?.key === platform
                  }
                  className="mt-6 bg-[#d4af37] text-black hover:bg-[#e5c158]"
                >
                  {updateMutation.isPending &&
                  updateMutation.variables?.key === platform
                    ? "Saving..."
                    : "Save"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
