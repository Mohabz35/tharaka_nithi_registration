import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Smartphone, Building, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

interface CartItem {
  merchandiseId: number;
  name: string;
  price: number;
  quantity: number;
}

export default function MerchandiseStore() {
  const [, setLocation] = useLocation();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [numberOfInstallments, setNumberOfInstallments] = useState(1);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    registrationId: "",
  });

  const { data: items, isLoading } = trpc.merchandise.getItems.useQuery();
  const createOrder = trpc.merchandise.createOrder.useMutation();

  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev.find(c => c.merchandiseId === item.id);
      if (existing) {
        return prev.map(c => 
          c.merchandiseId === item.id 
            ? { ...c, quantity: c.quantity + 1 }
            : c
        );
      }
      return [...prev, {
        merchandiseId: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
      }];
    });
    toast.success(`${item.name} added to cart`);
  };

  const removeFromCart = (merchandiseId: number) => {
    setCart(prev => prev.filter(c => c.merchandiseId !== merchandiseId));
  };

  const updateQuantity = (merchandiseId: number, delta: number) => {
    setCart(prev => prev.map(c => {
      if (c.merchandiseId === merchandiseId) {
        const newQuantity = c.quantity + delta;
        return newQuantity > 0 ? { ...c, quantity: newQuantity } : c;
      }
      return c;
    }).filter(c => c.quantity > 0));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const installmentAmount = numberOfInstallments > 1 
    ? Math.ceil(totalAmount / numberOfInstallments) 
    : totalAmount;

  const handleSubmitOrder = async () => {
    if (!formData.fullName || !formData.email || !formData.phoneNumber) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    try {
      const result = await createOrder.mutateAsync({
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        registrationId: formData.registrationId ? parseInt(formData.registrationId) : undefined,
        items: cart.map(item => ({
          merchandiseId: item.merchandiseId,
          quantity: item.quantity,
        })),
        numberOfInstallments: numberOfInstallments,
      });

      toast.success("Order created successfully!");
      setCart([]);
      setShowCheckout(false);
      setFormData({ fullName: "", email: "", phoneNumber: "", registrationId: "" });
      
      // Redirect to payment page or show payment instructions
      setLocation(`/payment/${result.orderId}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create order");
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "bootcamp": return "🎓";
      case "apparel": return "👕";
      case "accessories": return "🧢";
      default: return "📦";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#d4af37] animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black font-sans text-white selection:bg-[#d4af37] selection:text-black">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#4a1a2a] to-[#2a0a1a] py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-[#d4af37] mb-4">
            Official Merchandise
          </h1>
          <p className="text-gray-300 text-lg">
            Support the event and get exclusive merchandise
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Products Grid */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-[#d4af37] mb-6">Available Items</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {items?.map((item) => (
                <Card key={item.id} className="bg-[#1a0a1a] border-[#d4af37]/30 hover:border-[#d4af37] transition-colors">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-2xl">{getCategoryIcon(item.category)}</span>
                        <h3 className="text-white font-semibold mt-2">{item.name}</h3>
                      </div>
                      <Badge variant="outline" className="text-[#d4af37] border-[#d4af37]">
                        KES {item.price.toLocaleString()}
                      </Badge>
                    </div>
                    <p className="text-gray-400 text-sm mb-4">{item.description}</p>
                    <Button 
                      onClick={() => addToCart(item)}
                      className="w-full bg-[#d4af37] text-black hover:bg-[#e5c158]"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add to Cart
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Cart & Checkout */}
          <div className="lg:col-span-1">
            <Card className="bg-[#1a0a1a] border-[#d4af37] sticky top-4">
              <CardHeader>
                <CardTitle className="text-[#d4af37] flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Your Cart ({cart.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cart.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">Your cart is empty</p>
                ) : (
                  <>
                    <div className="space-y-4 mb-6">
                      {cart.map((item) => (
                        <div key={item.merchandiseId} className="flex justify-between items-center bg-[#2a0a1a] p-3 rounded-lg">
                          <div className="flex-1">
                            <p className="text-white font-medium">{item.name}</p>
                            <p className="text-[#d4af37] text-sm">KES {item.price.toLocaleString()}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.merchandiseId, -1)}
                              className="h-8 w-8 p-0 border-[#d4af37] text-[#d4af37]"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="text-white w-8 text-center">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.merchandiseId, 1)}
                              className="h-8 w-8 p-0 border-[#d4af37] text-[#d4af37]"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeFromCart(item.merchandiseId)}
                              className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Total */}
                    <div className="border-t border-[#d4af37]/30 pt-4 mb-6">
                      <div className="flex justify-between text-lg">
                        <span className="text-white">Total:</span>
                        <span className="text-[#d4af37] font-bold">KES {totalAmount.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Payment Options */}
                    <div className="space-y-4 mb-6">
                      <Label className="text-white">Payment Option</Label>
                      <Select 
                        value={numberOfInstallments.toString()} 
                        onValueChange={(v) => setNumberOfInstallments(parseInt(v))}
                      >
                        <SelectTrigger className="bg-[#2a0a1a] border-[#d4af37] text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#2a0a1a] border-[#d4af37]">
                          <SelectItem value="1">Pay in Full - KES {totalAmount.toLocaleString()}</SelectItem>
                          <SelectItem value="2">2 Installments - KES {Math.ceil(totalAmount / 2).toLocaleString()} each</SelectItem>
                          <SelectItem value="3">3 Installments - KES {Math.ceil(totalAmount / 3).toLocaleString()} each</SelectItem>
                          <SelectItem value="4">4 Installments - KES {Math.ceil(totalAmount / 4).toLocaleString()} each</SelectItem>
                          <SelectItem value="5">5 Installments - KES {Math.ceil(totalAmount / 5).toLocaleString()} each</SelectItem>
                          <SelectItem value="6">6 Installments - KES {Math.ceil(totalAmount / 6).toLocaleString()} each</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {numberOfInstallments > 1 && (
                        <div className="bg-[#2a0a1a] p-3 rounded-lg text-sm">
                          <p className="text-[#d4af37]">Installment Plan:</p>
                          <p className="text-white">
                            {numberOfInstallments} monthly payments of KES {installmentAmount.toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>

                    <Button 
                      onClick={() => setShowCheckout(true)}
                      className="w-full bg-[#d4af37] text-black hover:bg-[#e5c158]"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Proceed to Checkout
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <Card className="bg-[#1a0a1a] border-[#d4af37] w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-[#d4af37]">Checkout</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white">Full Name *</Label>
                <Input
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="bg-[#2a0a1a] border-[#d4af37] text-white"
                  placeholder="Enter your full name"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-white">Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-[#2a0a1a] border-[#d4af37] text-white"
                  placeholder="Enter your email"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-white">Phone Number *</Label>
                <Input
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="bg-[#2a0a1a] border-[#d4af37] text-white"
                  placeholder="Enter your phone number"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-white">Registration ID (Optional)</Label>
                <Input
                  value={formData.registrationId}
                  onChange={(e) => setFormData({ ...formData, registrationId: e.target.value })}
                  className="bg-[#2a0a1a] border-[#d4af37] text-white"
                  placeholder="e.g., REG-001"
                />
              </div>

              {/* Order Summary */}
              <div className="bg-[#2a0a1a] p-4 rounded-lg mt-4">
                <h4 className="text-[#d4af37] font-semibold mb-2">Order Summary</h4>
                <div className="space-y-2 text-sm">
                  {cart.map(item => (
                    <div key={item.merchandiseId} className="flex justify-between">
                      <span className="text-gray-300">{item.quantity}x {item.name}</span>
                      <span className="text-white">KES {(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="border-t border-[#d4af37]/30 pt-2 mt-2">
                    <div className="flex justify-between font-bold">
                      <span className="text-white">Total:</span>
                      <span className="text-[#d4af37]">KES {totalAmount.toLocaleString()}</span>
                    </div>
                    {numberOfInstallments > 1 && (
                      <p className="text-sm text-[#d4af37] mt-1">
                        {numberOfInstallments}x KES {installmentAmount.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCheckout(false)}
                  className="flex-1 border-[#d4af37] text-[#d4af37]"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitOrder}
                  disabled={createOrder.isPending}
                  className="flex-1 bg-[#d4af37] text-black hover:bg-[#e5c158]"
                >
                  {createOrder.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Place Order
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}
