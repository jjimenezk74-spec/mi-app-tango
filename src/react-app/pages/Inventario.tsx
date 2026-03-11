import { useState, useMemo, useEffect, useCallback } from "react";
import MainLayout from "@/react-app/components/layout/MainLayout";
import { Card } from "@/react-app/components/ui/card";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { Badge } from "@/react-app/components/ui/badge";
import {
  Search,
  Plus,
  Filter,
  ChevronDown,
  Edit2,
  Trash2,
  AlertTriangle,
  Clock,
  Package,
  X,
  Loader2,
} from "lucide-react";
import {
  categories,
  formatCurrency,
  getStockStatus,
  getDaysUntilExpiration,
  type Product,
} from "@/data/products";
import { cn } from "@/react-app/lib/utils";
import ProductModal from "@/react-app/components/inventory/ProductModal";
import ComboModal, { type ComboFormData } from "@/react-app/components/inventory/ComboModal";

// Database product type (snake_case)
interface DBProduct {
  id: number;
  sku: string;
  name: string;
  category: string;
  cost_price: number;
  sale_price: number;
  stock: number;
  min_stock: number;
  expiration_date: string | null;
  is_combo: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

// Convert DB product to frontend Product
function dbToProduct(db: DBProduct): Product {
  return {
    id: db.id,
    name: db.name,
    sku: db.sku,
    category: db.category,
    costPrice: db.cost_price,
    salePrice: db.sale_price,
    stock: db.stock,
    minStock: db.min_stock,
    expirationDate: db.expiration_date,
    isCombo: db.is_combo === 1,
  };
}

// Convert frontend Product to DB format
function productToDb(p: Omit<Product, 'id'>) {
  return {
    sku: p.sku,
    name: p.name,
    category: p.category,
    cost_price: p.costPrice,
    sale_price: p.salePrice,
    stock: p.stock,
    min_stock: p.minStock,
    expiration_date: p.expirationDate,
    is_combo: p.isCombo,
  };
}

export default function InventarioPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'expiring'>('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isComboModalOpen, setIsComboModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch products from API
  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json() as DBProduct[];
      setProducts(data.map(dbToProduct));
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        searchQuery === "" ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        !selectedCategory || product.category === selectedCategory;

      let matchesStockFilter = true;
      if (stockFilter === 'low') {
        matchesStockFilter = product.stock <= product.minStock;
      } else if (stockFilter === 'expiring') {
        const days = getDaysUntilExpiration(product.expirationDate);
        matchesStockFilter = days !== null && days <= 7;
      }

      return matchesSearch && matchesCategory && matchesStockFilter;
    });
  }, [products, searchQuery, selectedCategory, stockFilter]);

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const lowStock = products.filter(p => p.stock <= p.minStock).length;
    const expiringSoon = products.filter(p => {
      const days = getDaysUntilExpiration(p.expirationDate);
      return days !== null && days <= 7;
    }).length;
    const totalValue = products.reduce((sum, p) => sum + (p.salePrice * p.stock), 0);
    return { totalProducts, lowStock, expiringSoon, totalValue };
  }, [products]);

  const handleNewProduct = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    if (product.isCombo) {
      setEditingProduct(product);
      setIsComboModalOpen(true);
    } else {
      setEditingProduct(product);
      setIsModalOpen(true);
    }
  };

  const handleNewCombo = () => {
    setEditingProduct(null);
    setIsComboModalOpen(true);
  };

  const handleSaveCombo = async (comboData: ComboFormData) => {
    setIsSaving(true);
    try {
      const dbData = {
        sku: comboData.sku,
        name: comboData.name,
        category: comboData.category,
        cost_price: comboData.costPrice,
        sale_price: comboData.salePrice,
        stock: comboData.stock,
        min_stock: comboData.minStock,
        items: comboData.items.map(i => ({
          component_product_id: i.component_product_id,
          quantity: i.quantity,
        })),
      };
      
      if (editingProduct) {
        await fetch(`/api/combos/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dbData),
        });
      } else {
        await fetch('/api/combos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dbData),
        });
      }
      
      await fetchProducts();
      setIsComboModalOpen(false);
    } catch (error) {
      console.error('Error saving combo:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProduct = async (productData: Omit<Product, 'id'>) => {
    setIsSaving(true);
    try {
      const dbData = productToDb(productData);
      
      if (editingProduct) {
        // Update existing product
        await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dbData),
        });
      } else {
        // Create new product
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dbData),
        });
      }
      
      await fetchProducts();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      try {
        await fetch(`/api/products/${id}`, { method: 'DELETE' });
        await fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <MainLayout title="Inventario" subtitle="Gestión de productos y stock">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title="Inventario"
      subtitle="Gestión de productos y stock"
      actions={
        <div className="flex gap-2">
          <Button onClick={handleNewCombo} variant="outline" className="border-gold text-gold hover:bg-gold/10">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Combo
          </Button>
          <Button onClick={handleNewProduct} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Producto
          </Button>
        </div>
      }
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalProducts}</p>
              <p className="text-sm text-muted-foreground">Productos</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.lowStock}</p>
              <p className="text-sm text-muted-foreground">Stock Bajo</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gold/10">
              <Clock className="w-5 h-5 text-gold" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.expiringSoon}</p>
              <p className="text-sm text-muted-foreground">Por Vencer</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yerba/10">
              <span className="text-yerba font-bold text-lg">₲</span>
            </div>
            <div>
              <p className="text-xl font-bold">{formatCurrency(stats.totalValue)}</p>
              <p className="text-sm text-muted-foreground">Valor Total</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="p-6">
        {/* Search and Filters */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, código SKU o categoría..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
              Filtros
              <ChevronDown className={cn("w-4 h-4 transition-transform", showFilters && "rotate-180")} />
            </Button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="p-4 bg-muted/50 rounded-lg space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Categoría</label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={selectedCategory === null ? "default" : "outline"}
                    onClick={() => setSelectedCategory(null)}
                  >
                    Todas
                  </Button>
                  {categories.map((cat) => (
                    <Button
                      key={cat}
                      size="sm"
                      variant={selectedCategory === cat ? "default" : "outline"}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Estado de Stock</label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={stockFilter === 'all' ? "default" : "outline"}
                    onClick={() => setStockFilter('all')}
                  >
                    Todos
                  </Button>
                  <Button
                    size="sm"
                    variant={stockFilter === 'low' ? "default" : "outline"}
                    onClick={() => setStockFilter('low')}
                    className={stockFilter === 'low' ? "" : "text-destructive border-destructive/50"}
                  >
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Stock Bajo
                  </Button>
                  <Button
                    size="sm"
                    variant={stockFilter === 'expiring' ? "default" : "outline"}
                    onClick={() => setStockFilter('expiring')}
                    className={stockFilter === 'expiring' ? "" : "text-gold border-gold/50"}
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    Por Vencer
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Active Filters */}
          {(selectedCategory || stockFilter !== 'all') && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Filtros activos:</span>
              {selectedCategory && (
                <Badge variant="secondary" className="gap-1">
                  {selectedCategory}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedCategory(null)} />
                </Badge>
              )}
              {stockFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  {stockFilter === 'low' ? 'Stock Bajo' : 'Por Vencer'}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setStockFilter('all')} />
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Products Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Producto</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">SKU</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Categoría</th>
                <th className="text-right py-3 px-4 font-semibold text-sm text-muted-foreground">Costo</th>
                <th className="text-right py-3 px-4 font-semibold text-sm text-muted-foreground">Precio</th>
                <th className="text-center py-3 px-4 font-semibold text-sm text-muted-foreground">Stock</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Vencimiento</th>
                <th className="text-right py-3 px-4 font-semibold text-sm text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product.stock, product.minStock);
                const daysUntilExp = getDaysUntilExpiration(product.expirationDate);
                
                return (
                  <tr key={product.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{product.name}</span>
                        {product.isCombo && (
                          <Badge variant="outline" className="text-xs border-gold text-gold">
                            Combo
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground font-mono">
                      {product.sku}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="secondary" className="font-normal">
                        {product.category}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-muted-foreground">
                      {formatCurrency(product.costPrice)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      {formatCurrency(product.salePrice)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <span className={cn(
                          "font-semibold",
                          stockStatus === 'critical' && "text-destructive",
                          stockStatus === 'low' && "text-gold",
                          stockStatus === 'normal' && "text-foreground"
                        )}>
                          {product.stock}
                        </span>
                        <span className="text-xs text-muted-foreground">/ {product.minStock}</span>
                        {stockStatus !== 'normal' && (
                          <AlertTriangle className={cn(
                            "w-4 h-4",
                            stockStatus === 'critical' ? "text-destructive" : "text-gold"
                          )} />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {product.expirationDate ? (
                        <div className={cn(
                          "text-sm",
                          daysUntilExp !== null && daysUntilExp <= 3 && "text-destructive font-medium",
                          daysUntilExp !== null && daysUntilExp > 3 && daysUntilExp <= 7 && "text-gold"
                        )}>
                          {new Date(product.expirationDate).toLocaleDateString('es-PY')}
                          {daysUntilExp !== null && daysUntilExp <= 7 && (
                            <span className="block text-xs">
                              {daysUntilExp <= 0 ? '¡Vencido!' : `${daysUntilExp} días`}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditProduct(product)}
                          className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteProduct(product.id)}
                          className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                {products.length === 0 
                  ? "No hay productos. ¡Agrega tu primer producto!" 
                  : "No se encontraron productos con los filtros seleccionados"}
              </p>
              {products.length === 0 && (
                <Button onClick={handleNewProduct} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Producto
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Results Count */}
        {products.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground">
            Mostrando {filteredProducts.length} de {products.length} productos
          </div>
        )}
      </Card>

      {/* Product Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProduct}
        product={editingProduct}
        isSaving={isSaving}
      />

      {/* Combo Modal */}
      <ComboModal
        isOpen={isComboModalOpen}
        onClose={() => setIsComboModalOpen(false)}
        onSave={handleSaveCombo}
        combo={editingProduct}
        products={products}
        isSaving={isSaving}
      />
    </MainLayout>
  );
}
