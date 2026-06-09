import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Trash2, Image as ImageIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function PartnerLogosManager() {
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const utils = trpc.useContext();
  const { data: logos, isLoading } = trpc.admin.getPartnerLogos.useQuery();
  const createMutation = trpc.admin.createPartnerLogo.useMutation({
    onSuccess: () => utils.admin.getPartnerLogos.invalidate(),
  });
  const toggleMutation = trpc.admin.togglePartnerLogoStatus.useMutation({
    onSuccess: () => utils.admin.getPartnerLogos.invalidate(),
  });
  const deleteMutation = trpc.admin.deletePartnerLogo.useMutation({
    onSuccess: () => utils.admin.getPartnerLogos.invalidate(),
  });

  const handleAddLogo = async () => {
    if (!name || !file) {
      toast.error("Name and logo file are required.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch("/api/upload", {
        method: "POST",
        body: file,
        headers: {
          "x-file-name": file.name,
          "content-type": file.type,
        },
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Upload failed");

      await createMutation.mutateAsync({
        name,
        logoUrl: data.url,
        logoKey: data.key,
      });

      toast.success("Partner logo added successfully!");
      setName("");
      setFile(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to add partner logo");
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return <div className="text-white text-center py-8">Loading logos...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="bg-[#2a0a1a] border-[#d4af37] border-2">
        <CardHeader>
          <CardTitle className="text-[#d4af37]">Add New Partner Logo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Partner Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-[#1a0a1a] border-[#4a1a2a] text-white"
                placeholder="e.g. Royals Icon Events"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Logo Image</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="bg-[#1a0a1a] border-[#4a1a2a] text-white flex-1 justify-start overflow-hidden text-ellipsis whitespace-nowrap"
                  onClick={() => document.getElementById("partner-logo-upload")?.click()}
                >
                  <ImageIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                  {file ? file.name : "Select Logo Image"}
                </Button>
                <input
                  id="partner-logo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const selected = e.target.files?.[0];
                    if (selected) setFile(selected);
                  }}
                />
              </div>
            </div>
          </div>
          <Button
            onClick={handleAddLogo}
            disabled={isUploading || createMutation.isPending || !name || !file}
            className="bg-[#d4af37] text-black hover:bg-[#e5c158] font-bold"
          >
            {isUploading || createMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              "Add Partner Logo"
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-[#2a0a1a] border-[#d4af37] border-2">
        <CardHeader>
          <CardTitle className="text-[#d4af37]">Manage Partner Logos</CardTitle>
        </CardHeader>
        <CardContent>
          {(!logos || logos.length === 0) ? (
            <p className="text-white text-center py-8">No partner logos added yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-[#d4af37]">
                  <TableHead className="text-[#d4af37]">Logo</TableHead>
                  <TableHead className="text-[#d4af37]">Name</TableHead>
                  <TableHead className="text-[#d4af37]">Visible on Certs</TableHead>
                  <TableHead className="text-[#d4af37]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logos.map((logo) => (
                  <TableRow key={logo.id} className="border-[#4a1a2a] hover:bg-[#4a1a2a]">
                    <TableCell>
                      <img src={logo.logoUrl} alt={logo.name} className="w-16 h-16 object-contain bg-white rounded p-1" />
                    </TableCell>
                    <TableCell className="text-white font-medium">{logo.name}</TableCell>
                    <TableCell>
                      <Switch
                        checked={logo.isActive}
                        onCheckedChange={(checked) => toggleMutation.mutate({ id: logo.id, isActive: checked })}
                        disabled={toggleMutation.isPending}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete ${logo.name}?`)) {
                            deleteMutation.mutate(logo.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        className="bg-red-900 hover:bg-red-800 text-white"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
