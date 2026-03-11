import { useState, useEffect, useMemo } from "react";
import { X, Plus, Minus, Package, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { formatCurrency, type Product } from "@/data/products";

interface ComboItem {
  component_product_id: number;
  quantity: number;
  product_name?: string;
  product_sku?: string;
  sale_price?: number;
}

interface ComboModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (comboData: ComboFormData) => Promise<void>;
  combo: Product | null;
  products: Product[];
  isSaving: boolean;
}

export interface ComboFormData {
  sku: string;
  name: string;
  category: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  items: ComboItem[];
}

export default function ComboModal({ isOpen, onClose, onSave, combo, products, isSaving }: ComboModalProps) {
  const [formData, setFormData] = useState<ComboFormData>({
    sku: "",
    name: "",
    category: "Combos",
    costPrice: 0,
    salePrice: 0,
    stock: 99,
    minStock: 5,
    items: [],
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  // Filter out combo products from available products
  const availableProducts = useMemo(() => {
    return products.filter(p => !p.isCombo && !formData.items.some(i => i.component_product_id === p.id));
  }, [products, formData.items]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return availableProducts.slice(0, 10);
    return availableProducts.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [availableProducts, searchQuery]);

  // Calculate suggested prices based on components
  const suggestedPrices = useMemo(() => {
    const totalCost = formData.items.reduce((sum, item) => {
      const product = products.find(p => p.id === item.component_product_id);
      return sum + (product?.costPrice || 0) * item.quantity;
    }, 0);
    const totalSale = formData.items.reduce((sum, item) => {
      const product = products.find(p => p.id === item.component_product_id);
      return sum + (product?.salePrice || 0) * item.quantity;
    }, 0);
    return { cost: totalCost, sale: totalSale, discount: Math.round(totalSale * 0.9) };
  }, [formData.items, products]);

  useEffect(() => {
    if (isOpen) {
      if (combo) {
        // Load combo items from API
        setIsLoadingItems(true);
        fetch(`/api/combos/${combo.id}/items`)
          .then(res => res.json())
          .then((items: ComboItem[]) => {
            setFormData({
              sku: combo.sku,
              name: combo.name,
              category: combo.category,
              costPrice: combo.costPrice,
              salePrice: combo.salePrice,
              stock: combo.stock,
              minStock: combo.minStock,
              items: items.map(i => ({
                component_product_id: i.component_product_id,
                quantity: i.quantity,
                product_name: i.product_name,
                product_sku: i.product_sku,
                sale_price: i.sale_price,
              })),
            });
          })
          .finally(() => setIsLoadingItems(false));
      } else {
        // Generate SKU for new combo
        const timestamp = Date.now().toString().slice(-6);
        setFormData({
          sku: `CMB-${timestamp}`,
          name: "",
          category: "Combos",
          costPrice: 0,
          salePrice: 0,
          stock: 99,
          minStock: 5,
          items: [],
        });
      }
      setSearchQuery("");
    }
  }, [isOpen, combo]);

  const handleAddProduct = (product: Product) => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        component_product_id: product.id,
        quantity: 1,
        product_name: product.name,
        product_sku: product.sku,
        sale_price: product.salePrice,
      }],
    }));
    setSearchQuery("");
  };

  const handleUpdateQuantity = (productId: number, delta: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.component_product_id === productId
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      ),
    }));
  };

  const handleRemoveProduct = (productId: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.component_product_id !== productId),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      alert("Agrega al menos un producto al combo");
      return;
    }
    await onSave(formData);
  };

  const handleApplySuggestedPrices = () => {
    setFormData(prev => ({
      ...prev,
      costPrice: suggestedPrices.cost,
      salePrice: suggestedPrices.discount,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gold/10">
              <Package className="w-5 h-5 text-gold" />
            </div>
            <h2 className="text-xl font-bold">{combo ? "Editar Combo" : "Nuevo Combo"}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoadingItems ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-180px)]">
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Nombre del Combo</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ej: Combo Tereré Completo"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Código SKU</label>
                  <Input
                    value={formData.sku}
                    onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                    className="font-mono"
                    required
                  />
                </div>
              </div>

              {/* Products Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Productos del Combo</label>
                
                {/* Search Products */}
                <div className="relative mb-3">
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar producto para agregar..."
                    className="pr-10"
                  />
                  <Plus className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>

                {/* Available Products Dropdown */}
                {searchQuery && filteredProducts.length > 0 && (
                  <div className="mb-3 border border-border rounded-lg bg-background shadow-lg max-h-40 overflow-y-auto">
                    {filteredProducts.map(product => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => handleAddProduct(product)}
                        className="w-full px-4 py-2 text-left hover:bg-muted/50 flex items-center justify-between transition-colors"
                      >
                        <div>
                          <span className="font-medium">{product.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">{product.sku}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{formatCurrency(product.salePrice)}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Selected Products */}
                <div className="border border-border rounded-lg divide-y divide-border">
                  {formData.items.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Busca y agrega productos al combo</p>
                    </div>
                  ) : (
                    formData.items.map(item => {
                      const product = products.find(p => p.id === item.component_product_id);
                      return (
                        <div key={item.component_product_id} className="p-3 flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{item.product_name || product?.name}</p>
                            <p className="text-xs text-muted-foreground">{item.product_sku || product?.sku}</p>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency((item.sale_price || product?.salePrice || 0) * item.quantity)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleUpdateQuantity(item.component_product_id, -1)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleUpdateQuantity(item.component_product_id, 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                            onClick={() => handleRemoveProduct(item.component_product_id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Pricing */}
              {formData.items.length > 0 && (
                <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Valor total de productos:</span>
                    <span className="font-medium">{formatCurrency(suggestedPrices.sale)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Precio sugerido (10% desc):</span>
                    <span className="font-medium text-yerba">{formatCurrency(suggestedPrices.discount)}</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleApplySuggestedPrices}
                    className="w-full"
                  >
                    Aplicar precios sugeridos
                  </Button>
                </div>
              )}

              {/* Manual Pricing */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Precio de Costo</label>
                  <Input
                    type="number"
                    value={formData.costPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, costPrice: parseInt(e.target.value) || 0 }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Precio de Venta</label>
                  <Input
                    type="number"
                    value={formData.salePrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, salePrice: parseInt(e.target.value) || 0 }))}
                    required
                  />
                </div>
              </div>

              {/* Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Stock Disponible</label>
                  <Input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">Cantidad de combos que puedes vender</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Stock Mínimo</label>
                  <Input
                    type="number"
                    value={formData.minStock}
                    onChange={(e) => setFormData(prev => ({ ...prev, minStock: parseInt(e.target.value) || 0 }))}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-muted/30">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving || formData.items.length === 0}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Package className="w-4 h-4 mr-2" />
                    {combo ? "Guardar Cambios" : "Crear Combo"}
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
