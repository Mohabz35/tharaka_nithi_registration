import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface AdminAddContestantModalProps {
  onSuccess: () => void;
}

export default function AdminAddContestantModal({
  onSuccess,
}: AdminAddContestantModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const addRegistration = trpc.admin.addRegistration.useMutation();

  const [formData, setFormData] = useState({
    fullName: "",
    category: "adults" as "adults" | "teens" | "little_stars",
    age: "",
    phoneNumber: "",
    email: "",
    countySubLocation: "",
    talents: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await addRegistration.mutateAsync({
        ...formData,
        age: parseInt(formData.age, 10),
      });
      toast.success("Contestant added successfully!");
      setIsOpen(false);
      setFormData({
        fullName: "",
        category: "adults",
        age: "",
        phoneNumber: "",
        email: "",
        countySubLocation: "",
        talents: "",
      });
      onSuccess();
    } catch (error) {
      toast.error("Failed to add contestant.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#d4af37] text-black hover:bg-[#e5c158] ml-2">
          <UserPlus className="w-4 h-4 mr-2" />
          Add Contestant
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#2a0a1a] border-[#d4af37] text-white">
        <DialogHeader>
          <DialogTitle className="text-[#d4af37] text-xl">
            Add New Contestant
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-gray-300">
              Full Name
            </Label>
            <Input
              id="fullName"
              required
              value={formData.fullName}
              onChange={e =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              className="bg-[#3a1a2a] border-[#d4af37] text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category" className="text-gray-300">
                Category
              </Label>
              <Select
                value={formData.category}
                onValueChange={(val: any) =>
                  setFormData({ ...formData, category: val })
                }
              >
                <SelectTrigger className="bg-[#3a1a2a] border-[#d4af37] text-white">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent className="bg-[#2a0a1a] border-[#d4af37] text-white">
                  <SelectItem value="adults">Adults (18-26)</SelectItem>
                  <SelectItem value="teens">Teens (13-17)</SelectItem>
                  <SelectItem value="little_stars">
                    Little Stars (5-12)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="age" className="text-gray-300">
                Age
              </Label>
              <Input
                id="age"
                type="number"
                required
                min="5"
                max="26"
                value={formData.age}
                onChange={e =>
                  setFormData({ ...formData, age: e.target.value })
                }
                className="bg-[#3a1a2a] border-[#d4af37] text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="text-gray-300">
                Phone
              </Label>
              <Input
                id="phoneNumber"
                required
                value={formData.phoneNumber}
                onChange={e =>
                  setFormData({ ...formData, phoneNumber: e.target.value })
                }
                className="bg-[#3a1a2a] border-[#d4af37] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={e =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="bg-[#3a1a2a] border-[#d4af37] text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="countySubLocation" className="text-gray-300">
              Location (County / Sub-Location)
            </Label>
            <Input
              id="countySubLocation"
              required
              value={formData.countySubLocation}
              onChange={e =>
                setFormData({ ...formData, countySubLocation: e.target.value })
              }
              className="bg-[#3a1a2a] border-[#d4af37] text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="talents" className="text-gray-300">
              Talents (Optional)
            </Label>
            <Input
              id="talents"
              value={formData.talents}
              onChange={e =>
                setFormData({ ...formData, talents: e.target.value })
              }
              className="bg-[#3a1a2a] border-[#d4af37] text-white"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-[#d4af37] text-black hover:bg-[#e5c158] mt-4"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            Add Contestant
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
