import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Package, CreditCard, Clock, CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export default function PaymentDashboard() {
  const [, setLocation] = useLocation();
  const [searchEmail, setSearchEmail] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const { data: orders, isLoading, refetch } = trpc.merchandise.getMyOrders.useQuery(
    { email: searchEmail },
    { enabled: false }
  );

  const handleSearch = async () => {
    if (!searchEmail) {
      toast.error("Please enter your email address");
      return;
    }
    setIsSearching(true);
    await refetch();
    setIsSearching(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-900 text-green-200";
      case "pending": return "bg-yellow-900 text-yellow-200";
      case "cancelled": return "bg-red-900 text-red-200";
      default: return "bg-gray-900 text-gray-200";
    }
  };

  return (
    <main className="min-h-screen bg-black font-sans text-white selection:bg-[#d4af37] selection:text-black">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#4a1a2a] to-[#2a0a1a] py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-[#d4af37] mb-2">My Orders</h1>
          <p className="text-gray-300">View your merchandise orders and payment status</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Search Form */}
        <Card className="bg-[#1a0a1a] border-[#d4af37] mb-8">
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
                  disabled={isLoading || isSearching}
                  className="bg-[#d4af37] text-black hover:bg-[#e5c158]"
                >
                  {isLoading || isSearching ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Search className="w-4 h-4 mr-2" />
                  )}
                  Search Orders
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        {orders && orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id} className="bg-[#1a0a1a] border-[#d4af37]/30 hover:border-[#d4af37] transition-colors">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Package className="w-5 h-5 text-[#d4af37]" />
                        <h3 className="text-white font-semibold text-lg">Order #{order.id}</h3>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Total Amount</p>
                          <p className="text-[#d4af37] font-semibold">KES {order.totalAmount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Date</p>
                          <p className="text-white">{new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Payment Method</p>
                          <p className="text-white capitalize">{order.paymentMethod || "Not specified"}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Phone</p>
                          <p className="text-white">{order.phoneNumber}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Button 
                        size="sm"
                        onClick={() => setLocation(`/payment/${order.id}`)}
                        className="bg-[#d4af37] text-black hover:bg-[#e5c158]"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        {order.status === "paid" ? "View Details" : "Pay Now"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : orders && orders.length === 0 ? (
          <Card className="bg-[#1a0a1a] border-[#d4af37]">
            <CardContent className="p-8 text-center">
              <Package className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-white text-xl font-semibold mb-2">No Orders Found</h3>
              <p className="text-gray-400 mb-4">You haven't placed any orders yet.</p>
              <Button 
                onClick={() => setLocation("/merchandise")}
                className="bg-[#d4af37] text-black hover:bg-[#e5c158]"
              >
                Browse Merchandise
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {/* Help Section */}
        <Card className="bg-[#1a0a1a] border-[#d4af37]/30 mt-8">
          <CardContent className="p-6">
            <h3 className="text-[#d4af37] font-semibold mb-4">Need Help?</h3>
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div>
                <p className="text-white font-medium mb-2">Contact Support</p>
                <p className="text-gray-400">
                  If you have any questions about your order or payment, please contact us at:
                </p>
                <p className="text-[#d4af37] mt-2">support@royaliconevents.co.ke</p>
              </div>
              <div>
                <p className="text-white font-medium mb-2">Payment Issues</p>
                <p className="text-gray-400">
                  For payment-related issues, please have your order number ready when you contact us.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
