import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Download, Share2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: "adults" | "teens" | "little_stars";
  participantName: string;
  registrationId: string;
}

export default function SuccessModal({ 
  isOpen, 
  onClose, 
  category, 
  participantName, 
  registrationId 
}: SuccessModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const downloadCertificate = trpc.registration.downloadCertificate.useMutation();
  const downloadPdf = trpc.registration.downloadRegistrationPdf.useMutation();

  const categoryNames: Record<string, string> = {
    adults: "Adults (18-35)",
    teens: "Teens (13-17)",
    little_stars: "Little Stars (5-12)",
  };

  const handleDownloadCertificate = async () => {
    setIsDownloading(true);
    try {
      const result = await downloadCertificate.mutateAsync({
        participantName,
        category,
        registrationId,
        eventDate: "September 12, 2026",
        venue: "Chuka Grounds",
      });

      if (result.success && result.certificateUrl) {
        const link = document.createElement("a");
        link.href = result.certificateUrl;
        link.download = `certificate_${registrationId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Certificate downloaded successfully!");
      }
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download certificate");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      const result = await downloadPdf.mutateAsync({
        registrationId,
      });

      if (result.success && result.pdfUrl) {
        const link = document.createElement("a");
        link.href = result.pdfUrl;
        link.download = `registration_form_${registrationId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Application form downloaded successfully!");
      }
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download application form");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleShare = () => {
    const shareText = `I just registered for the Models Call Out event! Join me at the Mr & Miss Face of Tharaka-Nithi County 2026 on September 12 at Chuka Grounds. Registration is FREE! 🎭✨`;
    
    if (navigator.share) {
      navigator.share({
        title: "Models Call Out Event",
        text: shareText,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success("Share text copied to clipboard!");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#2a0a1a] border-[#d4af37] border-2 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-[#d4af37] text-2xl flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-green-400" />
            Registration Confirmed!
          </DialogTitle>
          <DialogDescription className="text-white">
            Your registration for the Models Call Out event has been successfully submitted.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Free Registration Confirmation */}
          <Card className="bg-gradient-to-r from-[#d4af37] to-[#e5c158] border-0">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-black text-2xl font-bold mb-2">Registration is FREE!</h3>
                <p className="text-black text-lg">
                  No payment required to register. However, you can purchase optional items below.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Optional Payment Section */}
          <Card className="bg-[#1a0a1a] border-[#d4af37] border-2">
            <CardHeader>
              <CardTitle className="text-[#d4af37]">Optional: Pay for Bootcamp & Merchandise</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-300 text-sm">
                Enhance your experience with our bootcamp training and official merchandise.
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-[#2a0a1a] p-3 rounded">
                  <p className="text-[#d4af37] font-semibold">Bootcamp</p>
                  <p className="text-white">KES 3,000</p>
                </div>
                <div className="bg-[#2a0a1a] p-3 rounded">
                  <p className="text-[#d4af37] font-semibold">T-Shirt</p>
                  <p className="text-white">KES 1,000</p>
                </div>
                <div className="bg-[#2a0a1a] p-3 rounded">
                  <p className="text-[#d4af37] font-semibold">Hoodie</p>
                  <p className="text-white">KES 2,000</p>
                </div>
                <div className="bg-[#2a0a1a] p-3 rounded">
                  <p className="text-[#d4af37] font-semibold">Kofia</p>
                  <p className="text-white">KES 500</p>
                </div>
              </div>
              <Button
                onClick={() => window.location.href = "/merchandise"}
                className="w-full bg-[#d4af37] text-black hover:bg-[#e5c158] font-bold text-lg py-4"
              >
                🛒 Pay for Bootcamp & Merchandise
              </Button>
            </CardContent>
          </Card>

          {/* Registration Details */}
          <Card className="bg-[#1a0a1a] border-[#d4af37] border-2">
            <CardHeader>
              <CardTitle className="text-[#d4af37]">Your Registration Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Name</p>
                  <p className="text-white font-semibold">{participantName}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Category</p>
                  <p className="text-white font-semibold">{categoryNames[category]}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Registration ID</p>
                  <p className="text-white font-semibold">{registrationId}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Event Date</p>
                  <p className="text-white font-semibold">September 12, 2026</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Event Information */}
          <Card className="bg-[#1a0a1a] border-[#d4af37] border-2">
            <CardHeader>
              <CardTitle className="text-[#d4af37]">Event Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-white">
              <p><span className="text-[#d4af37] font-semibold">Event:</span> Mr & Miss Face of Tharaka-Nithi County 2026</p>
              <p><span className="text-[#d4af37] font-semibold">Date:</span> September 12, 2026</p>
              <p><span className="text-[#d4af37] font-semibold">Venue:</span> Chuka Grounds</p>
              <p><span className="text-[#d4af37] font-semibold">Theme:</span> Fashion | Talent | Celebration</p>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="bg-[#1a0a1a] border-[#d4af37] border-2">
            <CardHeader>
              <CardTitle className="text-[#d4af37]">Next Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-white">
              <p>✓ Your registration has been confirmed</p>
              <p>✓ Check your email for confirmation details</p>
              <p>✓ Download your registration certificate below</p>
              <p>✓ Shop for official merchandise (bootcamp, t-shirts, hoodies)</p>
              <p>✓ Share your registration with friends and family</p>
              <p>✓ Prepare your portfolio for the event</p>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4">
            <Button 
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="w-full bg-[#d4af37] text-black hover:bg-[#e5c158] font-bold text-lg py-6 flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              {isDownloadingPdf ? "Generating Form..." : "Download Registration Form (Hardcopy)"}
            </Button>
            <p className="text-gray-400 text-sm text-center">
              * Download this form, sign it, and bring it to the bootcamp.
            </p>

            <Button 
              onClick={handleDownloadCertificate}
              disabled={isDownloading}
              className="w-full border-2 border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-black font-bold text-lg py-6 flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              {isDownloading ? "Generating Certificate..." : "Download Digital Certificate"}
            </Button>
            
            <Button
              onClick={handleShare}
              className="w-full border-2 border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-black font-bold py-2"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share Registration
            </Button>
            <Button
              onClick={() => window.location.href = "/merchandise"}
              className="w-full bg-[#4a1a2a] text-[#d4af37] hover:bg-[#5a2a3a] border border-[#d4af37] font-bold py-2"
            >
              🛒 Shop Merchandise
            </Button>
            <Button
              onClick={onClose}
              className="flex-1 bg-[#4a1a2a] text-[#d4af37] hover:bg-[#5a2a3a] border border-[#d4af37] font-bold py-2"
            >
              Close
            </Button>
          </div>

          {/* Support Message */}
          <div className="bg-[#4a1a2a] border border-[#d4af37] rounded-lg p-4 text-center">
            <p className="text-white text-sm">
              Have questions? Contact us at <span className="text-[#d4af37] font-semibold">support@royaliconevents.co.ke</span>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
