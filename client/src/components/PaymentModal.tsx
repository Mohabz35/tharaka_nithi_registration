import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Copy } from "lucide-react";
import { toast } from "sonner";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: "adults" | "teens" | "little_stars";
}

const categoryFees: Record<string, { name: string; fee: number }> = {
  adults: { name: "Adults", fee: 1000 },
  teens: { name: "Teens", fee: 500 },
  little_stars: { name: "Little Stars", fee: 300 },
};

export default function PaymentModal({ isOpen, onClose, category }: PaymentModalProps) {
  const { name, fee } = categoryFees[category];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#2a0a1a] border-[#d4af37] border-2 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-[#d4af37] text-2xl flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6" />
            Registration Submitted Successfully!
          </DialogTitle>
          <DialogDescription className="text-white">
            Your registration has been received. Now complete your payment to finalize your entry.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Confirmation Message */}
          <Card className="bg-[#1a0a1a] border-[#d4af37] border-2">
            <CardContent className="pt-6">
              <p className="text-white text-center text-lg">
                Thank you for registering for the <span className="font-bold text-[#d4af37]">Models Call Out</span>!
              </p>
              <p className="text-gray-300 text-center mt-2">
                Your registration is pending payment confirmation. Complete the M-PESA payment below to secure your spot.
              </p>
            </CardContent>
          </Card>

          {/* Payment Instructions */}
          <Card className="bg-[#1a0a1a] border-[#d4af37] border-2">
            <CardHeader>
              <CardTitle className="text-[#d4af37]">M-PESA Payment Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-[#2a0a1a] p-4 rounded-lg border border-[#d4af37]">
                <p className="text-white text-sm mb-2">Category:</p>
                <p className="text-[#d4af37] font-bold text-lg">{name}</p>
              </div>

              <div className="bg-[#2a0a1a] p-4 rounded-lg border border-[#d4af37]">
                <p className="text-white text-sm mb-2">Registration Fee:</p>
                <p className="text-[#d4af37] font-bold text-2xl">KSh {fee.toLocaleString()}</p>
              </div>

              <div className="space-y-3">
                <div className="bg-[#2a0a1a] p-4 rounded-lg border border-[#d4af37]">
                  <p className="text-white text-sm mb-2">Paybill Number:</p>
                  <div className="flex items-center justify-between">
                    <p className="text-[#d4af37] font-bold text-xl">522522</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard("522522")}
                      className="text-[#d4af37] hover:bg-[#4a1a2a]"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="bg-[#2a0a1a] p-4 rounded-lg border border-[#d4af37]">
                  <p className="text-white text-sm mb-2">Account Name:</p>
                  <div className="flex items-center justify-between">
                    <p className="text-[#d4af37] font-bold text-xl">ROYALS2026</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard("ROYALS2026")}
                      className="text-[#d4af37] hover:bg-[#4a1a2a]"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-900 bg-opacity-30 border border-yellow-600 p-4 rounded-lg">
                <p className="text-yellow-100 text-sm">
                  <span className="font-bold">📱 How to Pay:</span> Go to M-PESA on your phone, select "Lipa na M-PESA Online", enter Paybill <span className="font-bold">522522</span>, Account <span className="font-bold">ROYALS2026</span>, and the amount <span className="font-bold">KSh {fee}</span>.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Important Notes */}
          <Card className="bg-[#1a0a1a] border-[#d4af37] border-2">
            <CardHeader>
              <CardTitle className="text-[#d4af37] text-base">Important Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-white text-sm">
              <p>✓ Keep your M-PESA receipt for verification purposes.</p>
              <p>✓ You will receive an SMS confirmation once payment is verified.</p>
              <p>✓ Ensure you have sufficient M-PESA balance before attempting payment.</p>
              <p>✓ For payment issues, contact: contact@royalsiconevents.co.ke</p>
            </CardContent>
          </Card>

          {/* Close Button */}
          <Button
            onClick={onClose}
            className="w-full bg-[#d4af37] text-black hover:bg-[#e5c158] font-bold text-lg py-6"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
