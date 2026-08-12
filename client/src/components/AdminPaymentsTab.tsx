import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Package, CreditCard, Clock, CheckCircle2, AlertCircle, 
  TrendingUp, DollarSign, Users, Calendar, Loader2 
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function AdminPaymentsTab() {
  const [activeTab, setActiveTab] = useState("overview");

  const { data: stats, isLoading: statsLoading } = trpc.merchandise.admin.getPaymentStats.useQuery();
  const { data: orders, isLoading: ordersLoading } = trpc.merchandise.admin.getAllOrders.useQuery();
  const { data: plans, isLoading: plansLoading } = trpc.merchandise.admin.getAllPaymentPlans.useQuery();
  const { data: overdue, isLoading: overdueLoading } = trpc.merchandise.admin.getOverdueInstallments.useQuery();

  const updateOrderStatus = trpc.merchandise.admin.updateOrderStatus.useMutation();
  const updateInstallmentStatus = trpc.merchandise.admin.updateInstallmentStatus.useMutation();
  const seedMerchandise = trpc.merchandise.admin.seedMerchandise.useMutation();
  const utils = trpc.useContext();

  const handleUpdateOrderStatus = async (orderId: number, status: "pending" | "paid" | "cancelled") => {
    try {
      await updateOrderStatus.mutateAsync({ orderId, status });
      toast.success("Order status updated");
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    }
  };

  const handleUpdateInstallmentStatus = async (
    installmentId: number, 
    status: "pending" | "paid" | "overdue" | "cancelled",
    amountPaid?: number
  ) => {
    try {
      await updateInstallmentStatus.mutateAsync({ 
        installmentId, 
        status, 
        amountPaid,
        paymentMethod: "manual"
      });
      toast.success("Installment status updated");
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": case "completed": return "bg-green-900 text-green-200";
      case "pending": case "active": return "bg-yellow-900 text-yellow-200";
      case "cancelled": return "bg-red-900 text-red-200";
      case "overdue": return "bg-red-900 text-red-200";
      default: return "bg-gray-900 text-gray-200";
    }
  };

  if (statsLoading || ordersLoading || plansLoading || overdueLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-[#d4af37] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-[#1a0a1a] border-[#d4af37]/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-[#d4af37]/20 p-2 rounded-lg">
                <DollarSign className="w-5 h-5 text-[#d4af37]" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Revenue</p>
                <p className="text-white font-bold">KES {(stats?.totalRevenue || 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1a0a1a] border-[#d4af37]/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-900/30 p-2 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Paid Orders</p>
                <p className="text-white font-bold">{stats?.paidOrders || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1a0a1a] border-[#d4af37]/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-900/30 p-2 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Pending</p>
                <p className="text-white font-bold">{stats?.pendingOrders || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1a0a1a] border-[#d4af37]/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-900/30 p-2 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Overdue</p>
                <p className="text-white font-bold">{stats?.overdueInstallments || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seed Button */}
      <Card className="bg-[#1a0a1a] border-[#d4af37]/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-semibold">Merchandise Items</p>
              <p className="text-gray-400 text-sm">Initialize the shop with bootcamp and merchandise items</p>
            </div>
            <Button
              onClick={async () => {
                try {
                  const result = await seedMerchandise.mutateAsync();
                  toast.success(result.message);
                  utils.merchandise.getItems.invalidate();
                } catch (error: any) {
                  toast.error(error.message || "Failed to seed merchandise");
                }
              }}
              disabled={seedMerchandise.isPending}
              className="bg-[#d4af37] text-black hover:bg-[#e5c158]"
            >
              {seedMerchandise.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {seedMerchandise.isPending ? "Seeding..." : "Seed Merchandise Items"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#1a0a1a] border border-[#d4af37]/30">
          <TabsTrigger value="overview" className="data-[state=active]:bg-[#d4af37] data-[state=active]:text-black">
            Overview
          </TabsTrigger>
          <TabsTrigger value="orders" className="data-[state=active]:bg-[#d4af37] data-[state=active]:text-black">
            Orders ({orders?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="plans" className="data-[state=active]:bg-[#d4af37] data-[state=active]:text-black">
            Payment Plans ({plans?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="overdue" className="data-[state=active]:bg-[#d4af37] data-[state=active]:text-black">
            Overdue ({overdue?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <Card className="bg-[#1a0a1a] border-[#d4af37]/30">
            <CardHeader>
              <CardTitle className="text-[#d4af37]">Payment Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-white font-semibold mb-3">Revenue Breakdown</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Revenue (Paid)</span>
                      <span className="text-green-400">KES {(stats?.totalRevenue || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Pending Payments</span>
                      <span className="text-yellow-400">KES {(stats?.pendingPayments || 0).toLocaleString()}</span>
                    </div>
                    <div className="border-t border-[#d4af37]/30 pt-2 mt-2">
                      <div className="flex justify-between font-bold">
                        <span className="text-white">Total Expected</span>
                        <span className="text-[#d4af37]">
                          KES {((stats?.totalRevenue || 0) + (stats?.pendingPayments || 0)).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-white font-semibold mb-3">Payment Plans</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Active Plans</span>
                      <span className="text-yellow-400">{stats?.activePlans || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Completed Plans</span>
                      <span className="text-green-400">{stats?.completedPlans || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Overdue Installments</span>
                      <span className="text-red-400">{stats?.overdueInstallments || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="mt-6">
          <Card className="bg-[#1a0a1a] border-[#d4af37]/30">
            <CardHeader>
              <CardTitle className="text-[#d4af37]">All Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {orders && orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="bg-[#2a0a1a] p-4 rounded-lg">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Package className="w-4 h-4 text-[#d4af37]" />
                            <span className="text-white font-semibold">Order #{order.id}</span>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-400">Customer</p>
                              <p className="text-white">{order.fullName}</p>
                            </div>
                            <div>
                              <p className="text-gray-400">Amount</p>
                              <p className="text-[#d4af37]">KES {order.totalAmount.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-400">Date</p>
                              <p className="text-white">{new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-400">Method</p>
                              <p className="text-white capitalize">{order.paymentMethod || "Not set"}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Select
                            value={order.status}
                            onValueChange={(value: any) => handleUpdateOrderStatus(order.id, value)}
                          >
                            <SelectTrigger className="w-32 bg-[#1a0a1a] border-[#d4af37] text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1a0a1a] border-[#d4af37]">
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">No orders found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Plans Tab */}
        <TabsContent value="plans" className="mt-6">
          <Card className="bg-[#1a0a1a] border-[#d4af37]/30">
            <CardHeader>
              <CardTitle className="text-[#d4af37]">Payment Plans</CardTitle>
            </CardHeader>
            <CardContent>
              {plans && plans.length > 0 ? (
                <div className="space-y-4">
                  {plans.map((plan) => (
                    <div key={plan.id} className="bg-[#2a0a1a] p-4 rounded-lg">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CreditCard className="w-4 h-4 text-[#d4af37]" />
                            <span className="text-white font-semibold">Plan #{plan.id}</span>
                            <Badge className={getStatusColor(plan.status)}>
                              {plan.status.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-400">Order ID</p>
                              <p className="text-white">#{plan.orderId}</p>
                            </div>
                            <div>
                              <p className="text-gray-400">Total</p>
                              <p className="text-[#d4af37]">KES {plan.totalAmount.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-400">Installments</p>
                              <p className="text-white">{plan.numberOfInstallments}x KES {plan.installmentAmount.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-400">Start Date</p>
                              <p className="text-white">{new Date(plan.startDate).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">No payment plans found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overdue Tab */}
        <TabsContent value="overdue" className="mt-6">
          <Card className="bg-[#1a0a1a] border-red-500/30">
            <CardHeader>
              <CardTitle className="text-red-400 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Overdue Installments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {overdue && overdue.length > 0 ? (
                <div className="space-y-4">
                  {overdue.map((installment) => (
                    <div key={installment.id} className="bg-red-900/20 border border-red-500/30 p-4 rounded-lg">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Clock className="w-4 h-4 text-red-400" />
                            <span className="text-white font-semibold">Installment #{installment.installmentNumber}</span>
                            <Badge className="bg-red-900 text-red-200">OVERDUE</Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-400">Plan ID</p>
                              <p className="text-white">#{installment.paymentPlanId}</p>
                            </div>
                            <div>
                              <p className="text-gray-400">Amount Due</p>
                              <p className="text-red-400">KES {installment.amountDue.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-400">Due Date</p>
                              <p className="text-red-400">{new Date(installment.dueDate).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-400">Amount Paid</p>
                              <p className="text-white">KES {installment.amountPaid.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateInstallmentStatus(installment.id, "paid", installment.amountDue)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Mark Paid
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateInstallmentStatus(installment.id, "pending")}
                            className="border-yellow-500 text-yellow-500"
                          >
                            Keep Pending
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-400">No overdue installments</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
