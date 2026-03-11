import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/react-app/components/ui/dialog";
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
import { Switch } from "@/react-app/components/ui/switch";
import { categories, type Product } from "@/data/products";
import { Save, X } from "lucide-react";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Omit<Product, 'id'>) => Promise<void>;
  product: Product | null;
  isSaving?: boolean;
}

const emptyProduct: Omit<Product, 'id'> = {
  name: "",
  sku: "",
  category: "Yerba Mate",
  costPrice: 0,
  salePrice: 0,
  stock: 0,
  minStock: 5,
  expirationDate: null,
  isCombo: false,
};

export default function ProductModal({ isOpen, onClose, onSave, product, isSaving = false }: ProductModalProps) {
  const [formData, setFormData] = useState<Omit<Product, 'id'>>(emptyProduct);
  const [hasExpiration, setHasExpiration] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        sku: product.sku,
        category: product.category,
        costPrice: product.costPrice,
        salePrice: product.salePrice,
        stock: product.stock,
        minStock: product.minStock,
        expirationDate: product.expirationDate,
        isCombo: product.isCombo,
        comboItems: product.comboItems,
      });
      setHasExpiration(!!product.expirationDate);
    } else {
      setFormData(emptyProduct);
      setHasExpiration(false);
    }
  }, [product, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      expirationDate: hasExpiration ? formData.expirationDate : null,
    });
  };

  const handleChange = (field: keyof typeof formData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const margin = formData.salePrice > 0 && formData.costPrice > 0
    ? (((formData.salePrice - formData.costPrice) / formData.costPrice) * 100).toFixed(1)
    : "0";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            {product ? "Editar Producto" : "Nuevo Producto"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Producto *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Ej: Yerba Mate Pajarito 1kg"
              required
            />
          </div>

          {/* SKU and Category Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">Código SKU *</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => handleChange('sku', e.target.value.toUpperCase())}
                placeholder="YRB-PAJ-1000"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleChange('category', value)}
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

          {/* Prices Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="costPrice">Precio de Costo (₲)</Label>
              <Input
                id="costPrice"
                type="number"
                min="0"
                value={formData.costPrice || ""}
                onChange={(e) => handleChange('costPrice', parseInt(e.target.value) || 0)}
                placeholder="35000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salePrice">Precio de Venta (₲) *</Label>
              <Input
                id="salePrice"
                type="number"
                min="0"
                value={formData.salePrice || ""}
                onChange={(e) => handleChange('salePrice', parseInt(e.target.value) || 0)}
                placeholder="48000"
                required
              />
            </div>
          </div>

          {/* Margin Indicator */}
          {formData.costPrice > 0 && formData.salePrice > 0 && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Margen de Ganancia</span>
                <span className="font-semibold text-yerba">{margin}%</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-muted-foreground">Ganancia por unidad</span>
                <span className="font-semibold">₲ {(formData.salePrice - formData.costPrice).toLocaleString('es-PY')}</span>
              </div>
            </div>
          )}

          {/* Stock Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stock">Stock Actual</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={formData.stock || ""}
                onChange={(e) => handleChange('stock', parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minStock">Stock Mínimo (Alerta)</Label>
              <Input
                id="minStock"
                type="number"
                min="0"
                value={formData.minStock || ""}
                onChange={(e) => handleChange('minStock', parseInt(e.target.value) || 0)}
                placeholder="5"
              />
            </div>
          </div>

          {/* Expiration Date */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="hasExpiration">Producto con Fecha de Vencimiento</Label>
              <Switch
                id="hasExpiration"
                checked={hasExpiration}
                onCheckedChange={setHasExpiration}
              />
            </div>
            {hasExpiration && (
              <Input
                type="date"
                value={formData.expirationDate || ""}
                onChange={(e) => handleChange('expirationDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            )}
          </div>

          {/* Is Combo Toggle */}
          <div className="flex items-center justify-between p-3 bg-gold/5 rounded-lg border border-gold/20">
            <div>
              <Label htmlFor="isCombo" className="cursor-pointer">¿Es un Combo?</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Los combos agrupan varios productos
              </p>
            </div>
            <Switch
              id="isCombo"
              checked={formData.isCombo}
              onCheckedChange={(checked) => handleChange('isCombo', checked)}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={isSaving}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 bg-primary" disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Guardando..." : (product ? "Guardar Cambios" : "Crear Producto")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
