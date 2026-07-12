import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Pencil } from "lucide-react";

interface Contestant {
  id: number;
  fullName: string;
  dateOfBirth: string;
  age: number;
  category: string;
  phoneNumber: string;
  email: string;
  countySubLocation: string;
  talents: string | null;
  socialMediaHandles: string | null;
  paymentStatus: string;
}

interface Props {
  contestant: Contestant;
  onSuccess: () => void;
}

export default function AdminEditContestantModal({ contestant, onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: contestant.fullName,
    dateOfBirth: contestant.dateOfBirth,
    age: contestant.age,
    category: contestant.category as "adults" | "teens" | "little_stars",
    phoneNumber: contestant.phoneNumber,
    email: contestant.email,
    countySubLocation: contestant.countySubLocation,
    talents: contestant.talents || "",
    socialMediaHandles: contestant.socialMediaHandles || "",
    paymentStatus: contestant.paymentStatus as "pending" | "completed",
  });

  const updateMutation = trpc.admin.updateRegistration.useMutation({
    onSuccess: () => {
      toast.success("Contestant updated successfully");
      setOpen(false);
      onSuccess();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update contestant");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      id: contestant.id,
      ...formData,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-[#d4af37] hover:text-[#e5c158] hover:bg-[#d4af37]/10" title="Edit Details">
          <Pencil className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#2a0a1a] border-[#d4af37] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#d4af37]">Edit Contestant: {contestant.fullName}</DialogTitle>
          <DialogDescription className="text-gray-400">
            Update the contestant's details below.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input 
                value={formData.fullName} 
                onChange={(e) => setFormData(p => ({ ...p, fullName: e.target.value }))}
                className="bg-[#4a1a2a] border-[#d4af37] text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input 
                type="email"
                value={formData.email} 
                onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                className="bg-[#4a1a2a] border-[#d4af37] text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input 
                value={formData.phoneNumber} 
                onChange={(e) => setFormData(p => ({ ...p, phoneNumber: e.target.value }))}
                className="bg-[#4a1a2a] border-[#d4af37] text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input 
                value={formData.countySubLocation} 
                onChange={(e) => setFormData(p => ({ ...p, countySubLocation: e.target.value }))}
                className="bg-[#4a1a2a] border-[#d4af37] text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={(val: any) => setFormData(p => ({ ...p, category: val }))}
              >
                <SelectTrigger className="bg-[#4a1a2a] border-[#d4af37] text-white">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-[#4a1a2a] border-[#d4af37] text-white">
                  <SelectItem value="adults">Adults (18-35)</SelectItem>
                  <SelectItem value="teens">Teens (13-17)</SelectItem>
                  <SelectItem value="little_stars">Little Stars (5-12)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Payment Status</Label>
              <Select 
                value={formData.paymentStatus} 
                onValueChange={(val: any) => setFormData(p => ({ ...p, paymentStatus: val }))}
              >
                <SelectTrigger className="bg-[#4a1a2a] border-[#d4af37] text-white">
                  <SelectValue placeholder="Select payment status" />
                </SelectTrigger>
                <SelectContent className="bg-[#4a1a2a] border-[#d4af37] text-white">
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Talents</Label>
            <Textarea 
              value={formData.talents} 
              onChange={(e) => setFormData(p => ({ ...p, talents: e.target.value }))}
              className="bg-[#4a1a2a] border-[#d4af37] text-white"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Social Media Handles</Label>
            <Input 
              value={formData.socialMediaHandles} 
              onChange={(e) => setFormData(p => ({ ...p, socialMediaHandles: e.target.value }))}
              className="bg-[#4a1a2a] border-[#d4af37] text-white"
              placeholder="IG: @user, TikTok: @user"
            />
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-[#d4af37] text-white hover:bg-white/10">
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending} className="bg-[#d4af37] text-black hover:bg-[#e5c158]">
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
