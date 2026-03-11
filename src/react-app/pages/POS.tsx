import { useState, useMemo, useEffect, useCallback } from "react";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { Badge } from "@/react-app/components/ui/badge";
import { ScrollArea } from "@/react-app/components/ui/scroll-area";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Smartphone,
  Building2,
  ShoppingCart,
  Receipt,
  X,
  Loader2,
  History,
} from "lucide-react";
import { categories, formatCurrency, type Product } from "@/data/products";
import { cn } from "@/react-app/lib/utils";
import ReceiptModal from "@/react-app/components/pos/ReceiptModal";
import SalesHistory from "@/react-app/components/pos/SalesHistory";
import TopNav from "@/react-app/components/layout/TopNav";
import CustomerSelector, { type Customer } from "@/react-app/components/pos/CustomerSelector";

// Database product type
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
}

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

interface CartItem {
  product: Product;
  quantity: number;
}

type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia' | 'billetera';

const paymentMethods: { id: PaymentMethod; label: string; icon: React.ElementType }[] = [
  { id: 'efectivo', label: 'Efectivo', icon: Banknote },
  { id: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
  { id: 'transferencia', label: 'Transferencia', icon: Building2 },
  { id: 'billetera', label: 'Billetera', icon: Smartphone },
];

const IVA_RATE = 0.10; // 10% IVA in Paraguay

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showSalesHistory, setShowSalesHistory] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [lastSale, setLastSale] = useState<{
    items: CartItem[];
    subtotal: number;
    iva: number;
    total: number;
    paymentMethod: PaymentMethod;
    cashReceived?: number;
    change?: number;
    timestamp: Date;
    receiptNumber: string;
    customer?: Customer | null;
  } | null>(null);

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

  // Filter products for display
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        searchQuery === "" ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        !selectedCategory || product.category === selectedCategory;

      return matchesSearch && matchesCategory && product.stock > 0;
    });
  }, [products, searchQuery, selectedCategory]);

  // Calculate totals
  const { subtotal, iva, total } = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.product.salePrice * item.quantity, 0);
    const iva = Math.round(subtotal * IVA_RATE);
    const total = subtotal + iva;
    return { subtotal, iva, total };
  }, [cart]);

  const change = paymentMethod === 'efectivo' && cashReceived > 0 ? cashReceived - total : 0;

  // Cart actions
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id !== productId) return item;
          const newQuantity = item.quantity + delta;
          if (newQuantity <= 0) return null;
          if (newQuantity > item.product.stock) return item;
          return { ...item, quantity: newQuantity };
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const setQuantity = (productId: number, quantity: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id !== productId) return item;
          if (quantity <= 0) return null;
          const newQuantity = Math.min(quantity, item.product.stock);
          return { ...item, quantity: newQuantity };
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCashReceived(0);
  };

  const completeSale = async () => {
    if (cart.length === 0 || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      // Prepare sale data for API
      const saleData = {
        items: cart.map(item => ({
          product_id: item.product.id,
          product_name: item.product.name,
          product_sku: item.product.sku,
          quantity: item.quantity,
          unit_price: item.product.salePrice,
          total_price: item.product.salePrice * item.quantity,
        })),
        subtotal,
        iva,
        total,
        payment_method: paymentMethod,
        cash_received: paymentMethod === 'efectivo' ? cashReceived : null,
        change_amount: paymentMethod === 'efectivo' ? change : null,
        cashier_name: 'Admin', // TODO: Get from auth
        customer_id: selectedCustomer?.id || null,
        customer_name: selectedCustomer?.name || null,
        customer_ruc_ci: selectedCustomer?.ruc_ci || null,
      };
      
      // Save sale to database
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData),
      });
      
      const result = await res.json();
      
      if (result.success) {
        const sale = {
          items: [...cart],
          subtotal,
          iva,
          total,
          paymentMethod,
          cashReceived: paymentMethod === 'efectivo' ? cashReceived : undefined,
          change: paymentMethod === 'efectivo' ? change : undefined,
          timestamp: new Date(),
          receiptNumber: result.receipt_number,
          customer: selectedCustomer,
        };
        
        setLastSale(sale);
        setShowReceipt(true);
        clearCart();
        setSelectedCustomer(null);
        
        // Refresh products to update stock
        await fetchProducts();
      }
    } catch (error) {
      console.error('Error completing sale:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const canComplete = cart.length > 0 && (paymentMethod !== 'efectivo' || cashReceived >= total) && !isProcessing;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <TopNav />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNav />
      <div className="flex-1 flex">
      {/* Product Selection Panel */}
      <div className="flex-1 p-4 lg:p-6">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-display font-bold text-foreground">Punto de Venta</h1>
          <p className="text-sm text-muted-foreground">Selecciona productos para agregar a la venta</p>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Buscar producto por nombre o código..."
            className="pl-11 h-12 text-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <Button
            size="sm"
            variant={selectedCategory === null ? "default" : "outline"}
            onClick={() => setSelectedCategory(null)}
            className="whitespace-nowrap"
          >
            Todos
          </Button>
          {categories.filter(c => c !== "Combos").map((cat) => (
            <Button
              key={cat}
              size="sm"
              variant={selectedCategory === cat ? "default" : "outline"}
              onClick={() => setSelectedCategory(cat)}
              className="whitespace-nowrap"
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Products Grid */}
        <ScrollArea className="h-[calc(100vh-284px)]">
          {products.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No hay productos en el inventario</p>
              <p className="text-sm text-muted-foreground mt-1">Agrega productos en la sección de Inventario</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredProducts.map((product) => {
                const inCart = cart.find((item) => item.product.id === product.id);
                return (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className={cn(
                      "p-3 rounded-lg border text-left transition-all hover:shadow-md hover:border-primary/50",
                      inCart ? "border-primary bg-primary/5" : "border-border bg-card"
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="secondary" className="text-[10px] px-1.5">
                        {product.category}
                      </Badge>
                      {inCart && (
                        <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                          {inCart.quantity}
                        </span>
                      )}
                    </div>
                    <h3 className="font-medium text-sm text-foreground line-clamp-2 mb-1">
                      {product.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-2">{product.sku}</p>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-primary">{formatCurrency(product.salePrice)}</span>
                      <span className="text-xs text-muted-foreground">Stock: {product.stock}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          {filteredProducts.length === 0 && products.length > 0 && (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No se encontraron productos</p>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Cart Panel */}
      <div className="w-full max-w-md border-l border-border bg-card flex flex-col">
        {/* Cart Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Carrito</h2>
            {cart.length > 0 && (
              <Badge variant="secondary">{cart.reduce((sum, i) => sum + i.quantity, 0)}</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowSalesHistory(true)}
              title="Reimprimir ventas anteriores"
            >
              <History className="w-4 h-4 mr-1" />
              Historial
            </Button>
            {cart.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCart} className="text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4 mr-1" />
                Limpiar
              </Button>
            )}
          </div>
        </div>

        {/* Customer Selector */}
        <CustomerSelector
          selectedCustomer={selectedCustomer}
          onSelect={setSelectedCustomer}
        />

        {/* Cart Items */}
        <ScrollArea className="flex-1 p-4">
          {cart.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">El carrito está vacío</p>
              <p className="text-xs">Selecciona productos para agregar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-2">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatCurrency(item.product.salePrice)} c/u
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateQuantity(item.product.id, -1)}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <input
                      type="number"
                      min="1"
                      max={item.product.stock}
                      value={item.quantity}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        if (val > 0) setQuantity(item.product.id, val);
                      }}
                      className="w-12 h-7 text-center font-semibold text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-yerba-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateQuantity(item.product.id, 1)}
                      disabled={item.quantity >= item.product.stock}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="text-right min-w-[90px] flex-shrink-0">
                    <p className="font-semibold text-sm whitespace-nowrap">
                      {formatCurrency(item.product.salePrice * item.quantity)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0"
                    onClick={() => removeFromCart(item.product.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Totals and Payment */}
        <div className="border-t border-border p-4 space-y-4">
          {/* Totals */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">IVA (10%)</span>
              <span>{formatCurrency(iva)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Payment Methods */}
          <div>
            <p className="text-sm font-medium mb-2">Método de Pago</p>
            <div className="grid grid-cols-4 gap-2">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-lg border transition-all",
                    paymentMethod === method.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <method.icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{method.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cash Received (only for efectivo) */}
          {paymentMethod === 'efectivo' && cart.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Efectivo Recibido</p>
              <Input
                type="number"
                placeholder="0"
                value={cashReceived || ""}
                onChange={(e) => setCashReceived(parseInt(e.target.value) || 0)}
                className="text-right text-lg font-semibold"
              />
              {cashReceived > 0 && cashReceived >= total && (
                <div className="flex justify-between mt-2 p-2 rounded bg-yerba/10 text-yerba">
                  <span className="font-medium">Vuelto</span>
                  <span className="font-bold">{formatCurrency(change)}</span>
                </div>
              )}
            </div>
          )}

          {/* Complete Sale Button */}
          <Button
            className="w-full h-12 text-lg font-semibold"
            disabled={!canComplete}
            onClick={completeSale}
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Receipt className="w-5 h-5 mr-2" />
            )}
            {isProcessing ? "Procesando..." : "Completar Venta"}
          </Button>
        </div>
      </div>
      </div>

      {/* Receipt Modal */}
      {lastSale && (
        <ReceiptModal
          isOpen={showReceipt}
          onClose={() => setShowReceipt(false)}
          sale={lastSale}
        />
      )}

      {/* Sales History Modal */}
      <SalesHistory
        isOpen={showSalesHistory}
        onClose={() => setShowSalesHistory(false)}
      />
    </div>
  );
}
