import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Smartphone, CheckCircle2, Clock, AlertCircle, Loader2, ExternalLink, Search } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useParams, useLocation } from "wouter";

export default function PaymentPage() {
  const params = useParams<{ orderId: string }>();
  const [, setLocation] = useLocation();
  const orderId = params?.orderId ? parseInt(params.orderId) : null;
  const [isProcessing, setIsProcessing] = useState(false);
  const [registrationSearch, setRegistrationSearch] = useState("");
  
  // Direct order lookup
  const { data: orderData, isLoading: orderLoading } = trpc.merchandise.getOrder.useQuery(
    { orderId: orderId! },
    { enabled: !!orderId }
  );

  // Registration ID lookup
  const { data: regOrders, isLoading: regLoading, refetch: refetchRegOrders } = 
    trpc.merchandise.getMyOrdersByRegistrationId.useQuery(
      { registrationId: registrationSearch },
      { enabled: false }
    );

  const payInstallment = trpc.merchandise.payInstallment.useMutation();

  const isLoading = orderId ? orderLoading : regLoading;

  const handleRegistrationSearch = async () => {
    if (!registrationSearch.trim()) {
      toast.error("Enter your registration ID (e.g., REG-001)");
      return;
    }
    await refetchRegOrders();
  };

  const handlePayInstallment = async (installmentId: number, email: string, phone: string) => {
    setIsProcessing(true);
    try {
      const result = await payInstallment.mutateAsync({
        installmentId,
        email,
        phone,
      });

      if (result.paymentLink) {
        window.location.href = result.paymentLink;
      } else {
        toast.error("Failed to get payment link");
      }
    } catch (error: any) {
      toast.error(error.message || "Payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-900 text-green-200";
      case "pending": return "bg-yellow-900 text-yellow-200";
      case "cancelled": return "bg-red-900 text-red-200";
      case "active": return "bg-blue-900 text-blue-200";
      case "completed": return "bg-green-900 text-green-200";
      default: return "bg-gray-900 text-gray-200";
    }
  };

  const getInstallmentStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-900 text-green-200";
      case "pending": return "bg-yellow-900 text-yellow-200";
      case "overdue": return "bg-red-900 text-red-200";
      default: return "bg-gray-900 text-gray-200";
    }
  };

  // Registration ID search view
  if (!orderId) {
    return (
      <main className="min-h-screen bg-black font-sans text-white selection:bg-[#d4af37] selection:text-black">
        <div className="bg-gradient-to-r from-[#4a1a2a] to-[#2a0a1a] py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-[#d4af37] mb-2">Track Your Orders</h1>
            <p className="text-gray-300">Enter your Registration ID to view orders and make payments</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Search Form */}
          <Card className="bg-[#1a0a1a] border-[#d4af37] mb-8">
            <CardContent className="p-6">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label className="text-white mb-2 block">Registration ID</Label>
                  <Input
                    value={registrationSearch}
                    onChange={(e) => setRegistrationSearch(e.target.value)}
                    placeholder="e.g., REG-001"
                    className="bg-[#2a0a1a] border-[#d4af37] text-white"
                    onKeyDown={(e) => e.key === "Enter" && handleRegistrationSearch()}
                  />
                </div>
                <Button 
                  onClick={handleRegistrationSearch}
                  disabled={regLoading}
                  className="bg-[#d4af37] text-black hover:bg-[#e5c158]"
                >
                  {regLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {regOrders && regOrders.length === 0 && (
            <Card className="bg-[#1a0a1a] border-yellow-500">
              <CardContent className="p-6 text-center">
                <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-white text-xl font-bold mb-2">No Orders Found</h2>
                <p className="text-gray-400">No orders found for registration ID: {registrationSearch}</p>
              </CardContent>
            </Card>
          )}

          {regOrders && regOrders.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-[#d4af37]">Your Orders ({regOrders.length})</h2>
              {regOrders.map((order: any) => (
                <OrderCard 
                  key={order.id} 
                  order={order} 
                  items={order.items}
                  paymentPlan={order.paymentPlan}
                  installments={order.installments}
                  onPay={(installmentId) => handlePayInstallment(installmentId, order.email, order.phoneNumber)}
                  isProcessing={isProcessing}
                  getStatusColor={getStatusColor}
                  getInstallmentStatusColor={getInstallmentStatusColor}
                />
              ))}
            </div>
          )}

          <div className="mt-8 text-center">
            <Button 
              onClick={() => setLocation("/merchandise")}
              variant="outline"
              className="border-[#d4af37] text-[#d4af37]"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Back to Store
            </Button>
          </div>
        </div>
      </main>
    );
  }

  // Single order view
  if (orderLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#d4af37] animate-spin" />
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="bg-[#1a0a1a] border-red-500 max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-white text-xl font-bold mb-2">Order Not Found</h2>
            <p className="text-gray-400 mb-4">The order you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => setLocation("/payment")} className="bg-[#d4af37] text-black">
              Track by Registration ID
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { order, items, paymentPlan, installments } = orderData;

  return (
    <main className="min-h-screen bg-black font-sans text-white selection:bg-[#d4af37] selection:text-black">
      <div className="bg-gradient-to-r from-[#4a1a2a] to-[#2a0a1a] py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-[#d4af37] mb-2">Payment Details</h1>
          <p className="text-gray-300">Order #{order.id}</p>
          {order.registrationId && (
            <Badge className="mt-2 bg-[#d4af37] text-black">
              REG-{order.registrationId.toString().padStart(3, '0')}
            </Badge>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <OrderCard 
          order={order}
          items={items}
          paymentPlan={paymentPlan}
          installments={installments}
          onPay={(installmentId) => handlePayInstallment(installmentId, order.email, order.phoneNumber)}
          isProcessing={isProcessing}
          getStatusColor={getStatusColor}
          getInstallmentStatusColor={getInstallmentStatusColor}
        />

        <div className="mt-8 text-center flex gap-4 justify-center">
          <Button 
            onClick={() => setLocation("/payment")}
            variant="outline"
            className="border-[#d4af37] text-[#d4af37]"
          >
            Track Another Order
          </Button>
          <Button 
            onClick={() => setLocation("/merchandise")}
            variant="outline"
            className="border-[#d4af37] text-[#d4af37]"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Back to Store
          </Button>
        </div>
      </div>
    </main>
  );
}

// Reusable order card component
function OrderCard({ 
  order, items, paymentPlan, installments, onPay, isProcessing, 
  getStatusColor, getInstallmentStatusColor 
}: {
  order: any;
  items: any[];
  paymentPlan: any;
  installments: any[];
  onPay: (installmentId: number) => void;
  isProcessing: boolean;
  getStatusColor: (s: string) => string;
  getInstallmentStatusColor: (s: string) => string;
}) {
  const pendingInstallments = installments.filter((i: any) => i.status === "pending");
  const paidCount = installments.filter((i: any) => i.status === "paid").length;
  const nextPaymentAmount = pendingInstallments.length > 0 ? pendingInstallments[0].amountDue - pendingInstallments[0].amountPaid : 0;
  const remainingAmount = pendingInstallments.reduce((sum: number, i: any) => sum + (i.amountDue - i.amountPaid), 0);

  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* Order Summary */}
      <Card className="bg-[#1a0a1a] border-[#d4af37]">
        <CardHeader>
          <CardTitle className="text-[#d4af37]">Order #{order.id}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {items.map((item: any) => (
              <div key={item.id} className="flex justify-between items-center bg-[#2a0a1a] p-3 rounded-lg">
                <div>
                  <p className="text-white">{item.quantity}x Item</p>
                  <p className="text-gray-400 text-sm">ID: {item.merchandiseId}</p>
                </div>
                <span className="text-[#d4af37]">KES {item.totalPrice.toLocaleString()}</span>
              </div>
            ))}
          </div>
          
          <div className="border-t border-[#d4af37]/30 pt-4">
            <div className="flex justify-between text-lg font-bold">
              <span className="text-white">Total:</span>
              <span className="text-[#d4af37]">KES {order.totalAmount.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-400">Status:</span>
            <Badge className={getStatusColor(order.status)}>
              {order.status.toUpperCase()}
            </Badge>
          </div>

          <div className="bg-[#2a0a1a] p-3 rounded-lg">
            <p className="text-gray-400 text-sm">Contact</p>
            <p className="text-white">{order.fullName}</p>
            <p className="text-gray-400 text-sm">{order.email}</p>
          </div>
        </CardContent>
      </Card>

      {/* Payment Information */}
      <Card className="bg-[#1a0a1a] border-[#d4af37]">
        <CardHeader>
          <CardTitle className="text-[#d4af37]">Payment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {order.status === "paid" && (!paymentPlan || paymentPlan.status === "completed") ? (
            <div className="bg-green-900/30 border border-green-500 rounded-lg p-4 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
              <h3 className="text-green-400 font-bold text-lg">Fully Paid!</h3>
              <p className="text-gray-300 mt-2">Your order has been confirmed. See you at the event!</p>
            </div>
          ) : (
            <>
              {/* Payment Summary */}
              <div className="bg-[#2a0a1a] p-4 rounded-lg">
                <h4 className="text-[#d4af37] font-semibold mb-2">Payment Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total:</span>
                    <span className="text-white">KES {order.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Paid:</span>
                    <span className="text-green-400">KES {(order.totalAmount - remainingAmount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-[#d4af37]/30 pt-2">
                    <span className="text-white">Remaining:</span>
                    <span className="text-[#d4af37]">KES {remainingAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Pay Button */}
              {pendingInstallments.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-white font-semibold">Pay Next Installment</h4>
                  
                  <Button 
                    onClick={() => onPay(pendingInstallments[0].id)}
                    disabled={isProcessing}
                    className="w-full bg-[#4CAF50] hover:bg-[#45a049] text-white justify-start"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                    ) : (
                      <Smartphone className="w-5 h-5 mr-3" />
                    )}
                    Pay KES {nextPaymentAmount.toLocaleString()} with M-Pesa
                  </Button>
                  
                  <Button 
                    onClick={() => onPay(pendingInstallments[0].id)}
                    disabled={isProcessing}
                    className="w-full bg-[#1976D2] hover:bg-[#1565C0] text-white justify-start"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                    ) : (
                      <CreditCard className="w-5 h-5 mr-3" />
                    )}
                    Pay KES {nextPaymentAmount.toLocaleString()} with Card
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Installment Schedule */}
      {paymentPlan && installments.length > 0 && (
        <Card className="bg-[#1a0a1a] border-[#d4af37] md:col-span-2">
          <CardHeader>
            <CardTitle className="text-[#d4af37]">Installment Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-gray-400 mb-2">Payment Plan</p>
                <div className="bg-[#2a0a1a] p-4 rounded-lg">
                  <p className="text-white font-semibold">{paymentPlan.numberOfInstallments} Installments</p>
                  <p className="text-[#d4af37] text-2xl font-bold mt-2">
                    KES {paymentPlan.installmentAmount.toLocaleString()} each
                  </p>
                  <div className="mt-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-white">{paidCount}/{installments.length}</span>
                    </div>
                    <div className="bg-[#3a1c28] rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-[#d4af37] h-full transition-all" 
                        style={{ width: `${(paidCount / installments.length * 100).toFixed(0)}%` }}
                      />
                    </div>
                  </div>
                  <Badge className={`mt-2 ${getStatusColor(paymentPlan.status)}`}>
                    {paymentPlan.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
              
              <div>
                <p className="text-gray-400 mb-2">Payment History</p>
                <div className="space-y-3">
                  {installments.map((installment: any) => (
                    <div key={installment.id} className="bg-[#2a0a1a] p-3 rounded-lg flex justify-between items-center">
                      <div>
                        <p className="text-white">#{installment.installmentNumber}</p>
                        <p className="text-gray-400 text-sm">
                          Due: {new Date(installment.dueDate).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <p className="text-[#d4af37]">KES {installment.amountDue.toLocaleString()}</p>
                          <Badge className={getInstallmentStatusColor(installment.status)}>
                            {installment.status}
                          </Badge>
                        </div>
                        {installment.status === "pending" && (
                          <Button
                            size="sm"
                            onClick={() => onPay(installment.id)}
                            disabled={isProcessing}
                            className="bg-[#d4af37] text-black hover:bg-[#e5c158]"
                          >
                            {isProcessing ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              "Pay"
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
