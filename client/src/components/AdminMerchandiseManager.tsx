import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, Edit, Trash2, Save, X, Loader2, Package, 
  ToggleLeft, ToggleRight 
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface MerchandiseItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
  category: string;
  imageUrl: string | null;
  imageKey: string | null;
  isActive: boolean;
}

export default function AdminMerchandiseManager() {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    category: "bootcamp",
  });

  const { data: items, isLoading } = trpc.merchandise.getItems.useQuery();
  const utils = trpc.useContext();

  const createItem = trpc.merchandise.admin.createMerchandiseItem.useMutation({
    onSuccess: () => {
      toast.success("Item created successfully");
      utils.merchandise.getItems.invalidate();
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create item");
    },
  });

  const updateItem = trpc.merchandise.admin.updateMerchandiseItem.useMutation({
    onSuccess: () => {
      toast.success("Item updated successfully");
      utils.merchandise.getItems.invalidate();
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update item");
    },
  });

  const deleteItem = trpc.merchandise.admin.deleteMerchandiseItem.useMutation({
    onSuccess: () => {
      toast.success("Item deleted successfully");
      utils.merchandise.getItems.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete item");
    },
  });

  const toggleActive = trpc.merchandise.admin.updateMerchandiseItem.useMutation({
    onSuccess: () => {
      utils.merchandise.getItems.invalidate();
    },
  });

  const resetForm = () => {
    setFormData({ name: "", description: "", price: 0, category: "bootcamp" });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (item: MerchandiseItem) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      description: item.description || "",
      price: item.price,
      category: item.category,
    });
    setIsAdding(false);
  };

  const handleSubmit = () => {
    if (!formData.name || formData.price <= 0) {
      toast.error("Name and valid price are required");
      return;
    }

    if (editingId) {
      updateItem.mutateAsync({
        id: editingId,
        name: formData.name,
        description: formData.description,
        price: formData.price,
        category: formData.category,
      });
    } else {
      createItem.mutateAsync({
        name: formData.name,
        description: formData.description,
        price: formData.price,
        category: formData.category,
        isActive: true,
      });
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "bootcamp": return "bg-purple-900 text-purple-200";
      case "apparel": return "bg-blue-900 text-blue-200";
      case "accessories": return "bg-orange-900 text-orange-200";
      default: return "bg-gray-900 text-gray-200";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-[#d4af37] animate-spin" />
      </div>
    );
  }

  return (
    <Card className="bg-[#1a0a1a] border-[#d4af37]/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-[#d4af37] flex items-center gap-2">
            <Package className="w-5 h-5" />
            Manage Merchandise Items
          </CardTitle>
          <Button
            onClick={() => {
              resetForm();
              setIsAdding(true);
            }}
            className="bg-[#d4af37] text-black hover:bg-[#e5c158]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Item
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add/Edit Form */}
        {(isAdding || editingId) && (
          <Card className="bg-[#2a0a1a] border-[#d4af37]">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[#d4af37] font-semibold">
                  {editingId ? "Edit Item" : "Add New Item"}
                </h4>
                <Button variant="ghost" size="sm" onClick={resetForm}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Item Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Bootcamp Registration"
                    className="bg-[#1a0a1a] border-[#d4af37] text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger className="bg-[#1a0a1a] border-[#d4af37] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a0a1a] border-[#d4af37]">
                      <SelectItem value="bootcamp">Bootcamp</SelectItem>
                      <SelectItem value="apparel">Apparel</SelectItem>
                      <SelectItem value="accessories">Accessories</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Price (KES) *</Label>
                  <Input
                    type="number"
                    value={formData.price || ""}
                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                    placeholder="e.g., 3000"
                    className="bg-[#1a0a1a] border-[#d4af37] text-white"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-white">Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the item..."
                    className="bg-[#1a0a1a] border-[#d4af37] text-white"
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={resetForm} className="border-gray-500 text-gray-400">
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={createItem.isPending || updateItem.isPending}
                  className="bg-[#d4af37] text-black hover:bg-[#e5c158]"
                >
                  {(createItem.isPending || updateItem.isPending) ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {editingId ? "Update Item" : "Create Item"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Items List */}
        <div className="space-y-3">
          {items && items.length > 0 ? (
            items.map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between bg-[#2a0a1a] p-4 rounded-lg border transition-colors ${
                  item.isActive ? "border-[#d4af37]/30" : "border-gray-700 opacity-60"
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="text-white font-semibold">{item.name}</h4>
                    <Badge className={getCategoryColor(item.category)}>
                      {item.category}
                    </Badge>
                    {!item.isActive && (
                      <Badge className="bg-gray-700 text-gray-400">Inactive</Badge>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-gray-400 text-sm">{item.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-[#d4af37] font-bold text-lg">
                    KES {item.price.toLocaleString()}
                  </span>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleActive.mutateAsync({ id: item.id, isActive: !item.isActive })}
                    className={item.isActive ? "text-green-400" : "text-gray-500"}
                  >
                    {item.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(item)}
                    className="text-[#d4af37] hover:bg-[#d4af37]/20"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm(`Delete "${item.name}"?`)) {
                        deleteItem.mutateAsync(item.id);
                      }
                    }}
                    className="text-red-400 hover:bg-red-900/50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-center py-8">
              No merchandise items. Click "Add New Item" or use "Seed Merchandise Items" to get started.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
