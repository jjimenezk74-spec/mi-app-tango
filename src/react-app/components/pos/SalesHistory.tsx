import { useState, useEffect, useCallback } from "react";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { formatCurrency } from "@/data/products";
import { Search, Printer, X, Receipt, Calendar, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/react-app/components/ui/dialog";
import ReceiptModal from "./ReceiptModal";
import type { Product } from "@/data/products";

interface Sale {
  id: number;
  receipt_number: string;
  subtotal: number;
  iva: number;
  total: number;
  payment_method: 'efectivo' | 'tarjeta' | 'transferencia' | 'billetera';
  cash_received: number | null;
  change_amount: number | null;
  customer_id: number | null;
  customer_name: string | null;
  customer_ruc_ci: string | null;
  created_at: string;
}

interface SaleItem {
  id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface SaleWithItems extends Sale {
  items: SaleItem[];
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface SalesHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

const paymentLabels: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  billetera: 'Billetera',
};

export default function SalesHistory({ isOpen, onClose }: SalesHistoryProps) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedSale, setSelectedSale] = useState<SaleWithItems | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("limit", "100");
      if (search) params.append("search", search);
      if (dateFilter) params.append("date", dateFilter);
      
      const res = await fetch(`/api/sales?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSales(data);
      }
    } catch (err) {
      console.error("Error fetching sales:", err);
    } finally {
      setLoading(false);
    }
  }, [search, dateFilter]);

  useEffect(() => {
    if (isOpen) {
      fetchSales();
    }
  }, [isOpen, fetchSales]);

  const handleReprint = async (saleId: number) => {
    try {
      const res = await fetch(`/api/sales/${saleId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedSale(data);
        setShowReceipt(true);
      }
    } catch (err) {
      console.error("Error fetching sale details:", err);
    }
  };

  const convertToReceiptFormat = (sale: SaleWithItems) => {
    const items: CartItem[] = sale.items.map(item => ({
      product: {
        id: item.product_id,
        name: item.product_name,
        sku: item.product_sku,
        salePrice: item.unit_price,
        // Fill in required Product fields with defaults
        category: "",
        costPrice: 0,
        stock: 0,
        unit: "unidad",
        minStock: 0,
        expirationDate: null,
        isCombo: false,
      },
      quantity: item.quantity,
    }));

    return {
      items,
      subtotal: sale.subtotal,
      iva: sale.iva,
      total: sale.total,
      paymentMethod: sale.payment_method,
      cashReceived: sale.cash_received || undefined,
      change: sale.change_amount || undefined,
      timestamp: new Date(sale.created_at),
      receiptNumber: sale.receipt_number,
      customer: sale.customer_id ? {
        id: sale.customer_id,
        name: sale.customer_name || "Consumidor Final",
        ruc_ci: sale.customer_ruc_ci,
        phone: null,
        address: null,
      } : null,
    };
  };

  return (
    <>
      <Dialog open={isOpen && !showReceipt} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              Historial de Ventas - Reimprimir
            </DialogTitle>
          </DialogHeader>

          {/* Filters */}
          <div className="flex gap-3 py-3 border-b">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por Nº recibo o cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-40"
            />
            {(search || dateFilter) && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => { setSearch(""); setDateFilter(""); }}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Sales List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : sales.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No se encontraron ventas
              </div>
            ) : (
              <div className="divide-y">
                {sales.map((sale) => (
                  <div 
                    key={sale.id} 
                    className="p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-primary text-sm">
                          {sale.receipt_number}
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs bg-muted whitespace-nowrap">
                          {paymentLabels[sale.payment_method]}
                        </span>
                      </div>
                      <div className="font-bold text-lg text-foreground whitespace-nowrap">
                        {formatCurrency(sale.total)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm text-muted-foreground space-y-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 flex-shrink-0" />
                          <span>{new Date(sale.created_at).toLocaleDateString('es-PY')}</span>
                          <span>{new Date(sale.created_at).toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{sale.customer_name || "Consumidor Final"}</span>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-shrink-0"
                        onClick={() => handleReprint(sale.id)}
                      >
                        <Printer className="w-4 h-4 mr-1" />
                        Reimprimir
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Modal for Reprinting */}
      {selectedSale && (
        <ReceiptModal
          isOpen={showReceipt}
          onClose={() => {
            setShowReceipt(false);
            setSelectedSale(null);
          }}
          sale={convertToReceiptFormat(selectedSale)}
          isReprint={true}
        />
      )}
    </>
  );
}
