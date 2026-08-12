import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Smartphone, Building, CheckCircle2, Clock, AlertCircle, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useParams, useLocation } from "wouter";

export default function PaymentPage() {
  const params = useParams<{ orderId: string }>();
  const [, setLocation] = useLocation();
  const orderId = params?.orderId ? parseInt(params.orderId) : null;
  
  const { data: orderData, isLoading, error } = trpc.merchandise.getOrder.useQuery(
    { orderId: orderId! },
    { enabled: !!orderId }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#d4af37] animate-spin" />
      </div>
    );
  }

  if (error || !orderData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="bg-[#1a0a1a] border-red-500 max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-white text-xl font-bold mb-2">Order Not Found</h2>
            <p className="text-gray-400 mb-4">The order you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => setLocation("/merchandise")} className="bg-[#d4af37] text-black">
              Back to Store
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { order, items, paymentPlan, installments } = orderData;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-900 text-green-200";
      case "pending": return "bg-yellow-900 text-yellow-200";
      case "cancelled": return "bg-red-900 text-red-200";
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

  return (
    <main className="min-h-screen bg-black font-sans text-white selection:bg-[#d4af37] selection:text-black">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#4a1a2a] to-[#2a0a1a] py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-[#d4af37] mb-2">Payment Details</h1>
          <p className="text-gray-300">Order #{order.id}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <Card className="bg-[#1a0a1a] border-[#d4af37]">
            <CardHeader>
              <CardTitle className="text-[#d4af37]">Order Summary</CardTitle>
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
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card className="bg-[#1a0a1a] border-[#d4af37]">
            <CardHeader>
              <CardTitle className="text-[#d4af37]">Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.status === "paid" ? (
                <div className="bg-green-900/30 border border-green-500 rounded-lg p-4 text-center">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <h3 className="text-green-400 font-bold text-lg">Payment Complete!</h3>
                  <p className="text-gray-300 mt-2">Thank you for your payment. Your order has been confirmed.</p>
                </div>
              ) : (
                <>
                  {/* Payment Methods */}
                  <div className="space-y-3">
                    <h4 className="text-white font-semibold">Payment Methods</h4>
                    
                    <Button className="w-full bg-[#4CAF50] hover:bg-[#45a049] text-white justify-start">
                      <Smartphone className="w-5 h-5 mr-3" />
                      Pay with M-Pesa
                    </Button>
                    
                    <Button className="w-full bg-[#1976D2] hover:bg-[#1565C0] text-white justify-start">
                      <CreditCard className="w-5 h-5 mr-3" />
                      Pay with Card
                    </Button>
                    
                    <Button className="w-full bg-[#FF9800] hover:bg-[#F57C00] text-white justify-start">
                      <Building className="w-5 h-5 mr-3" />
                      Bank Transfer
                    </Button>
                  </div>

                  {/* M-Pesa Instructions */}
                  <div className="bg-[#2a0a1a] p-4 rounded-lg mt-4">
                    <h4 className="text-[#d4af37] font-semibold mb-2">M-Pesa Instructions</h4>
                    <ol className="text-sm text-gray-300 space-y-2 list-decimal list-inside">
                      <li>Go to M-Pesa Lipa na M-Pesa</li>
                      <li>Select Paybill</li>
                      <li>Enter Business Number: <span className="text-[#d4af37]">522522</span></li>
                      <li>Enter Account Number: <span className="text-[#d4af37]">ROYALS{order.id}</span></li>
                      <li>Enter Amount: <span className="text-[#d4af37]">KES {order.totalAmount.toLocaleString()}</span></li>
                      <li>Enter your M-Pesa PIN</li>
                      <li>Confirm the transaction</li>
                    </ol>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Installment Schedule */}
        {paymentPlan && installments.length > 0 && (
          <Card className="bg-[#1a0a1a] border-[#d4af37] mt-8">
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
                      KES {paymentPlan.installmentAmount.toLocaleString()}/month
                    </p>
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
                          <p className="text-white">Installment #{installment.installmentNumber}</p>
                          <p className="text-gray-400 text-sm">
                            Due: {new Date(installment.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[#d4af37]">KES {installment.amountDue.toLocaleString()}</p>
                          <Badge className={getInstallmentStatusColor(installment.status)}>
                            {installment.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Back Button */}
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
