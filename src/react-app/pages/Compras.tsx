import { useState, useEffect } from "react";
import { Plus, Trash2, Search, Package, FileText, Save, X, CheckCircle } from "lucide-react";
import { authFetch } from "@/react-app/contexts/AuthContext";
import TopNav from "@/react-app/components/layout/TopNav";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { Label } from "@/react-app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/react-app/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/react-app/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/react-app/components/ui/table";
import { cn } from "@/react-app/lib/utils";
import SupplierSelector, { Supplier } from "@/react-app/components/compras/SupplierSelector";

interface Product {
  id: number;
  sku: string;
  name: string;
  category: string;
  cost_price: number;
  sale_price: number;
  stock: number;
}

interface PurchaseItem {
  id: string;
  product_id: number | null;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  unit_cost: number;
  sale_price: number;
  is_new: boolean;
}

const categories = [
  "Yerba Mate",
  "Termos",
  "Guampas",
  "Hielo",
  "Bebidas",
  "Lácteos",
  "Snacks",
  "Accesorios",
];

export default function ComprasPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [receiptType, setReceiptType] = useState<"nota" | "factura">("nota");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [showNewProductForm, setShowNewProductForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  
  // Cash movement search state
  const [foundCashMovement, setFoundCashMovement] = useState<{ amount: number; description: string; created_at: string } | null>(null);
  const [searchingInvoice, setSearchingInvoice] = useState(false);

  // New product form state
  const [newProduct, setNewProduct] = useState({
    sku: "",
    name: "",
    category: "Yerba Mate",
    cost_price: 0,
    sale_price: 0,
    quantity: 1,
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const searchCashMovement = async (invoiceNum: string) => {
    if (!invoiceNum.trim()) {
      setFoundCashMovement(null);
      return;
    }
    setSearchingInvoice(true);
    try {
      const res = await authFetch(`/api/cash-movements/by-invoice?invoice_number=${encodeURIComponent(invoiceNum)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.found && data.movement) {
          setFoundCashMovement({
            amount: data.movement.amount,
            description: data.movement.description,
            created_at: data.movement.created_at
          });
        } else {
          setFoundCashMovement(null);
        }
      }
    } catch (error) {
      console.error("Error searching cash movement:", error);
    } finally {
      setSearchingInvoice(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addExistingProduct = (product: Product) => {
    const existing = purchaseItems.find((item) => item.product_id === product.id);
    if (existing) {
      setPurchaseItems(
        purchaseItems.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setPurchaseItems([
        ...purchaseItems,
        {
          id: `existing-${product.id}-${Date.now()}`,
          product_id: product.id,
          sku: product.sku,
          name: product.name,
          category: product.category,
          quantity: 1,
          unit_cost: product.cost_price,
          sale_price: product.sale_price,
          is_new: false,
        },
      ]);
    }
    setShowProductSearch(false);
    setSearchQuery("");
  };

  const addNewProduct = () => {
    if (!newProduct.sku || !newProduct.name || newProduct.cost_price <= 0) {
      alert("Por favor complete todos los campos del producto");
      return;
    }
    
    // Check if SKU already exists
    const skuExists = products.some(p => p.sku.toLowerCase() === newProduct.sku.toLowerCase());
    if (skuExists) {
      alert("Ya existe un producto con ese código SKU");
      return;
    }

    setPurchaseItems([
      ...purchaseItems,
      {
        id: `new-${Date.now()}`,
        product_id: null,
        sku: newProduct.sku,
        name: newProduct.name,
        category: newProduct.category,
        quantity: newProduct.quantity,
        unit_cost: newProduct.cost_price,
        sale_price: newProduct.sale_price,
        is_new: true,
      },
    ]);

    setNewProduct({
      sku: "",
      name: "",
      category: "Yerba Mate",
      cost_price: 0,
      sale_price: 0,
      quantity: 1,
    });
    setShowNewProductForm(false);
  };

  const updateItemQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) return;
    setPurchaseItems(
      purchaseItems.map((item) =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const updateItemCost = (id: string, unit_cost: number) => {
    setPurchaseItems(
      purchaseItems.map((item) =>
        item.id === id ? { ...item, unit_cost } : item
      )
    );
  };

  const removeItem = (id: string) => {
    setPurchaseItems(purchaseItems.filter((item) => item.id !== id));
  };

  const total = purchaseItems.reduce(
    (sum, item) => sum + item.quantity * item.unit_cost,
    0
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-PY").format(price);
  };

  const handleSavePurchase = async () => {
    if (purchaseItems.length === 0) {
      alert("Agregue al menos un producto");
      return;
    }
    if (!receiptNumber) {
      alert("Ingrese el número de comprobante");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          supplier_name: selectedSupplier?.name || "",
          supplier_id: selectedSupplier?.id || null,
          receipt_type: receiptType,
          receipt_number: receiptNumber,
          notes,
          items: purchaseItems.map((item) => ({
            product_id: item.product_id,
            sku: item.sku,
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            unit_cost: item.unit_cost,
            sale_price: item.sale_price,
            is_new: item.is_new,
          })),
        }),
      });

      if (res.ok) {
        alert("Compra registrada exitosamente. El stock y costos fueron actualizados.");
        // Reset form
        setPurchaseItems([]);
        setSelectedSupplier(null);
        setReceiptNumber("");
        setNotes("");
        fetchProducts(); // Refresh products list
      } else {
        const data = await res.json();
        alert(data.error || "Error al guardar la compra");
      }
    } catch (error) {
      console.error("Error saving purchase:", error);
      alert("Error al guardar la compra");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      
      <main className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-foreground">
            Compras / Reposición
          </h1>
          <p className="text-muted-foreground">
            Registre compras de mercadería y actualice el inventario
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Purchase Info */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-card rounded-xl border p-4 space-y-4">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-yerba" />
                Datos del Comprobante
              </h2>

              <div className="space-y-3">
                <SupplierSelector
                  selectedSupplier={selectedSupplier}
                  onSelect={setSelectedSupplier}
                />

                <div>
                  <Label>Tipo de Comprobante</Label>
                  <Select value={receiptType} onValueChange={(v: "nota" | "factura") => setReceiptType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nota">Nota de Remisión</SelectItem>
                      <SelectItem value="factura">Factura</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Número de Comprobante *</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ej: 001-001-0001234"
                      value={receiptNumber}
                      onChange={(e) => {
                        setReceiptNumber(e.target.value);
                        setFoundCashMovement(null);
                      }}
                      onBlur={(e) => searchCashMovement(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => searchCashMovement(receiptNumber)}
                      disabled={searchingInvoice || !receiptNumber.trim()}
                    >
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                  {searchingInvoice && (
                    <p className="text-xs text-muted-foreground mt-1">Buscando egreso...</p>
                  )}
                  {foundCashMovement && (
                    <div className="mt-2 p-2 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Egreso encontrado</span>
                      </div>
                      <p className="text-sm mt-1">
                        <span className="font-semibold">Monto: ₲ {formatPrice(foundCashMovement.amount)}</span>
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{foundCashMovement.description}</p>
                    </div>
                  )}
                </div>

                <div>
                  <Label>Notas</Label>
                  <Input
                    placeholder="Observaciones"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Total */}
            <div className="bg-gradient-to-br from-yerba to-yerba-700 rounded-xl p-4 text-white">
              <p className="text-yerba-100 text-sm">Total de la Compra</p>
              <p className="text-3xl font-bold">₲ {formatPrice(total)}</p>
              <p className="text-yerba-100 text-sm mt-1">
                {purchaseItems.length} producto(s)
              </p>
            </div>

            {/* Save Button */}
            <Button
              className="w-full h-12 bg-gold hover:bg-gold-600 text-gold-950 font-semibold"
              onClick={handleSavePurchase}
              disabled={saving || purchaseItems.length === 0}
            >
              <Save className="w-5 h-5 mr-2" />
              {saving ? "Guardando..." : "Guardar Compra"}
            </Button>
          </div>

          {/* Items List */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-xl border overflow-hidden">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="font-semibold text-lg flex items-center gap-2">
                  <Package className="w-5 h-5 text-yerba" />
                  Productos
                </h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowProductSearch(true)}
                  >
                    <Search className="w-4 h-4 mr-1" />
                    Buscar Existente
                  </Button>
                  <Button
                    size="sm"
                    className="bg-yerba hover:bg-yerba-600"
                    onClick={() => setShowNewProductForm(true)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Nuevo Producto
                  </Button>
                </div>
              </div>

              {purchaseItems.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No hay productos agregados</p>
                  <p className="text-sm">
                    Use los botones de arriba para agregar productos
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead className="w-24">Cant.</TableHead>
                        <TableHead className="w-32">Costo Unit.</TableHead>
                        <TableHead className="w-32 text-right">Total</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchaseItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium flex items-center gap-2">
                                {item.name}
                                {item.is_new && (
                                  <span className="text-xs bg-yerba/20 text-yerba px-2 py-0.5 rounded-full">
                                    Nuevo
                                  </span>
                                )}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {item.sku} · {item.category}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                updateItemQuantity(item.id, parseInt(e.target.value) || 1)
                              }
                              className="w-20 h-8 text-center"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              value={item.unit_cost}
                              onChange={(e) =>
                                updateItemCost(item.id, parseInt(e.target.value) || 0)
                              }
                              className="w-28 h-8"
                            />
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ₲ {formatPrice(item.quantity * item.unit_cost)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Search Existing Product Dialog */}
      <Dialog open={showProductSearch} onOpenChange={setShowProductSearch}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Buscar Producto Existente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Buscar por nombre o código..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            <div className="max-h-80 overflow-y-auto space-y-2">
              {filteredProducts.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No se encontraron productos
                </p>
              ) : (
                filteredProducts.slice(0, 20).map((product) => (
                  <button
                    key={product.id}
                    className={cn(
                      "w-full p-3 rounded-lg border text-left transition-colors",
                      "hover:bg-yerba/10 hover:border-yerba"
                    )}
                    onClick={() => addExistingProduct(product)}
                  >
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.sku} · Stock: {product.stock} · Costo: ₲{" "}
                      {formatPrice(product.cost_price)}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Product Dialog */}
      <Dialog open={showNewProductForm} onOpenChange={setShowNewProductForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Producto Nuevo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Código SKU *</Label>
                <Input
                  placeholder="Ej: YM-001"
                  value={newProduct.sku}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, sku: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Categoría</Label>
                <Select
                  value={newProduct.category}
                  onValueChange={(v) =>
                    setNewProduct({ ...newProduct, category: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Nombre del Producto *</Label>
              <Input
                placeholder="Ej: Yerba Mate Premium 500g"
                value={newProduct.name}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, name: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Cantidad *</Label>
                <Input
                  type="number"
                  min="1"
                  value={newProduct.quantity}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      quantity: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
              <div>
                <Label>Costo Unitario *</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="₲"
                  value={newProduct.cost_price || ""}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      cost_price: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <Label>Precio de Venta *</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="₲"
                  value={newProduct.sale_price || ""}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      sale_price: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowNewProductForm(false)}
              >
                <X className="w-4 h-4 mr-1" />
                Cancelar
              </Button>
              <Button
                className="bg-yerba hover:bg-yerba-600"
                onClick={addNewProduct}
              >
                <Plus className="w-4 h-4 mr-1" />
                Agregar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
