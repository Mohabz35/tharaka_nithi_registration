import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Mail, CheckCircle2, AlertCircle } from "lucide-react";

interface Registration {
  id: number;
  fullName: string;
  email: string;
  category: string;
}

interface Props {
  registrations: Registration[];
}

export default function AdminBulkEmailPanel({ registrations }: Props) {
  const [open, setOpen] = useState(false);
  const [emailType, setEmailType] = useState<"certificate" | "registration_pdf">("certificate");
  const [targetCategory, setTargetCategory] = useState<"all" | "adults" | "teens" | "little_stars">("all");
  const [results, setResults] = useState<{ sent: number; failed: number } | null>(null);

  const bulkEmailMutation = trpc.admin.sendBulkEmail.useMutation({
    onSuccess: (data) => {
      setResults({ sent: data.sentCount, failed: data.failedCount });
      toast.success(`Sent ${data.sentCount} emails. ${data.failedCount} failed.`);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to send bulk emails");
    },
  });

  const getTargetRegistrations = () => {
    if (targetCategory === "all") return registrations;
    return registrations.filter(r => r.category === targetCategory);
  };

  const targets = getTargetRegistrations();

  const handleSend = () => {
    if (targets.length === 0) {
      toast.error("No recipients selected.");
      return;
    }
    setResults(null);
    bulkEmailMutation.mutate({
      type: emailType,
      registrationIds: targets.map(r => r.id),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) setResults(null); }}>
      <DialogTrigger asChild>
        <Button className="bg-[#d4af37] text-black hover:bg-[#e5c158]">
          <Mail className="w-4 h-4 mr-2" />
          Bulk Email
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#2a0a1a] border-[#d4af37] text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[#d4af37]">Send Bulk Emails</DialogTitle>
          <DialogDescription className="text-gray-400">
            Send certificates or registration forms to contestants via email.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email Type</label>
            <Select value={emailType} onValueChange={(val: any) => setEmailType(val)}>
              <SelectTrigger className="bg-[#4a1a2a] border-[#d4af37] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#4a1a2a] border-[#d4af37] text-white">
                <SelectItem value="certificate">Certificate of Registration</SelectItem>
                <SelectItem value="registration_pdf">Registration Form PDF</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Target Audience (From Current Table)</label>
            <Select value={targetCategory} onValueChange={(val: any) => setTargetCategory(val)}>
              <SelectTrigger className="bg-[#4a1a2a] border-[#d4af37] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#4a1a2a] border-[#d4af37] text-white">
                <SelectItem value="all">All Currently Filtered ({registrations.length})</SelectItem>
                <SelectItem value="adults">Adults Only</SelectItem>
                <SelectItem value="teens">Teens Only</SelectItem>
                <SelectItem value="little_stars">Little Stars Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-black/50 border border-[#d4af37] rounded-md p-4 mt-4">
            <p className="text-sm">
              You are about to send <strong className="text-[#d4af37]">{emailType === 'certificate' ? 'Certificates' : 'Registration PDFs'}</strong> to <strong className="text-[#d4af37]">{targets.length}</strong> contestants.
            </p>
          </div>

          {results && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center text-green-400">
                <CheckCircle2 className="w-5 h-5 mr-2" />
                <span>Successfully sent: {results.sent}</span>
              </div>
              {results.failed > 0 && (
                <div className="flex items-center text-red-400">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <span>Failed: {results.failed}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} className="border-[#d4af37] text-white hover:bg-white/10">
            Close
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={bulkEmailMutation.isLoading || targets.length === 0}
            className="bg-[#d4af37] text-black hover:bg-[#e5c158]"
          >
            {bulkEmailMutation.isLoading ? "Sending..." : "Send Emails"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
