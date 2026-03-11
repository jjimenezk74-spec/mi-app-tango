import { useState, useEffect } from "react";
import MainLayout from "@/react-app/components/layout/MainLayout";
import { Card } from "@/react-app/components/ui/card";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/react-app/components/ui/tabs";
import { 
  Calculator, 
  AlertTriangle, 
  Clock, 
  CreditCard, 
  Banknote, 
  Building2,
  Wallet,
  Package,
  TrendingUp,
  Calendar,
  Printer,
  RefreshCw
} from "lucide-react";
import { formatCurrency } from "@/data/products";

interface DailyReport {
  date: string;
  total_transactions: number;
  total_sales: number;
  total_iva: number;
  by_payment_method: {
    payment_method: string;
    count: number;
    total_sales?: number;
  }[];
}

interface Sale {
  id: number;
  receipt_number: string;
  subtotal: number;
  iva: number;
  total: number;
  payment_method: string;
  cashier_name: string | null;
  created_at: string;
  items_summary?: string;
}

interface SaleItem {
  id: number;
  sale_id: number;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  receipt_number: string;
  cashier_name: string | null;
  created_at: string;
  cost_price: number | null;
  category: string | null;
}

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
}

const paymentMethodIcons: Record<string, React.ReactNode> = {
  'Efectivo': <Banknote className="w-4 h-4" />,
  'Tarjeta': <CreditCard className="w-4 h-4" />,
  'Transferencia': <Building2 className="w-4 h-4" />,
  'Billetera': <Wallet className="w-4 h-4" />,
};

const paymentMethodLabels: Record<string, string> = {
  'Efectivo': 'Efectivo',
  'Tarjeta': 'Tarjeta de Crédito/Débito',
  'Transferencia': 'Transferencia Bancaria',
  'Billetera': 'Billetera Digital',
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-PY', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  });
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('es-PY', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

function getDaysUntilExpiration(expirationDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = new Date(expirationDate);
  const diffTime = expDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export default function ReportesPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);
  const [daySales, setDaySales] = useState<Sale[]>([]);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<DBProduct[]>([]);
  const [expiringProducts, setExpiringProducts] = useState<DBProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ventas");

  useEffect(() => {
    fetchDailyData();
  }, [selectedDate]);

  useEffect(() => {
    if (activeTab === "stock") {
      fetchLowStock();
    } else if (activeTab === "vencimientos") {
      fetchExpiring();
    }
  }, [activeTab]);

  async function fetchDailyData() {
    setLoading(true);
    try {
      const [reportRes, salesRes, itemsRes] = await Promise.all([
        fetch(`/api/reports/daily?date=${selectedDate}`),
        fetch(`/api/sales?date=${selectedDate}&limit=100`),
        fetch(`/api/reports/sales-detail?date=${selectedDate}`)
      ]);
      
      const reportData = await reportRes.json();
      const salesData = await salesRes.json();
      const itemsData = await itemsRes.json();
      
      setDailyReport(reportData);
      setDaySales(salesData);
      setSaleItems(itemsData);
    } catch (error) {
      console.error("Error fetching daily data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchLowStock() {
    try {
      const res = await fetch("/api/reports/low-stock");
      const data = await res.json();
      setLowStockProducts(data);
    } catch (error) {
      console.error("Error fetching low stock:", error);
    }
  }

  async function fetchExpiring() {
    try {
      const res = await fetch("/api/reports/expiring?days=60");
      const data = await res.json();
      setExpiringProducts(data);
    } catch (error) {
      console.error("Error fetching expiring products:", error);
    }
  }

  function handlePrint() {
    const totalQuantity = saleItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalSales = saleItems.reduce((sum, item) => sum + item.total_price, 0);
    const totalProfit = saleItems.reduce((sum, item) => {
      const profit = item.cost_price 
        ? (item.unit_price - item.cost_price) * item.quantity 
        : 0;
      return sum + profit;
    }, 0);

    const itemRows = saleItems.map((item, index) => {
      const profit = item.cost_price 
        ? (item.unit_price - item.cost_price) * item.quantity 
        : 0;
      return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 6px 12px; color: #3b82f6; font-weight: 500; font-size: 12px;">${index + 1}</td>
          <td style="padding: 6px 12px; color: #1e293b; font-size: 12px;">${item.product_name}</td>
          <td style="padding: 6px 12px; text-align: center; font-weight: 600; font-size: 12px;">${item.quantity}</td>
          <td style="padding: 6px 12px; text-align: right; color: #64748b; font-size: 12px;">${formatCurrency(item.unit_price)}</td>
          <td style="padding: 6px 12px; text-align: right; color: #64748b; font-size: 12px;">${formatCurrency(item.total_price)}</td>
          <td style="padding: 6px 12px; color: #475569; font-size: 12px;">${item.cashier_name || 'Admin'}</td>
          <td style="padding: 6px 12px; text-align: right; font-weight: 600; color: #16a34a; font-size: 12px;">${formatCurrency(profit)}</td>
        </tr>
      `;
    }).join('');

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Informe de Ventas - ${formatDate(selectedDate)}</title>
          <style>
            * { 
              margin: 0; 
              padding: 0; 
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 16px 24px;
              color: #1e293b;
              font-size: 12px;
              background: white;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            table { width: 100%; border-collapse: collapse; }
            @media print {
              body { padding: 12px 16px; }
              @page { margin: 8mm; }
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
            }
          </style>
        </head>
        <body>
          <!-- Header -->
          <div style="background: #475569; color: white; text-align: center; padding: 10px 16px; border-radius: 6px 6px 0 0;">
            <h1 style="font-size: 14px; font-weight: 500; margin: 0;">Informe diario de ventas</h1>
          </div>
          
          <!-- Sub-header with date and transactions -->
          <div style="padding: 8px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-top: none; margin-bottom: 12px; font-size: 12px;">
            <span style="color: #475569;">Fecha: ${formatDate(selectedDate)}</span>
            <span style="margin-left: 24px; color: #475569;">Transacciones:</span>
            <span style="color: #16a34a; font-weight: 600; margin-left: 4px;">${dailyReport?.total_transactions || 0}</span>
          </div>

          <!-- Table -->
          <table style="background: white; border-radius: 6px; overflow: hidden; border: 1px solid #e2e8f0;">
            <thead>
              <tr style="background: #475569; color: white;">
                <th style="padding: 8px 12px; text-align: left; font-weight: 500; font-size: 11px; width: 40px;">#</th>
                <th style="padding: 8px 12px; text-align: left; font-weight: 500; font-size: 11px;">Producto</th>
                <th style="padding: 8px 12px; text-align: center; font-weight: 500; font-size: 11px; width: 50px;">Cant.</th>
                <th style="padding: 8px 12px; text-align: right; font-weight: 500; font-size: 11px; width: 90px;">Precio Unit.</th>
                <th style="padding: 8px 12px; text-align: right; font-weight: 500; font-size: 11px; width: 80px;">Total</th>
                <th style="padding: 8px 12px; text-align: left; font-weight: 500; font-size: 11px; width: 80px;">Vendedor</th>
                <th style="padding: 8px 12px; text-align: right; font-weight: 500; font-size: 11px; width: 80px;">Ganancia</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
            <tfoot>
              <tr style="background: #475569; color: white; font-weight: 600; font-size: 12px;">
                <td style="padding: 8px 12px;" colspan="2">TOTAL</td>
                <td style="padding: 8px 12px; text-align: center;">${totalQuantity}</td>
                <td style="padding: 8px 12px;"></td>
                <td style="padding: 8px 12px; text-align: right;">${formatCurrency(totalSales)}</td>
                <td style="padding: 8px 12px;"></td>
                <td style="padding: 8px 12px; text-align: right;">${formatCurrency(totalProfit)}</td>
              </tr>
            </tfoot>
          </table>

          <!-- Summary Cards -->
          <div style="display: flex; gap: 12px; margin-top: 16px;">
            <div style="flex: 1; padding: 10px 14px; border-radius: 4px; background: #ecfdf5; border-left: 3px solid #3b82f6;">
              <p style="font-size: 10px; color: #ef4444; margin-bottom: 4px;">Venta Total</p>
              <p style="font-size: 16px; font-weight: 700; color: #0d9488;">${formatCurrency(dailyReport?.total_sales || 0)}</p>
            </div>
            <div style="flex: 1; padding: 10px 14px; border-radius: 4px; background: #ecfdf5; border-left: 3px solid #3b82f6;">
              <p style="font-size: 10px; color: #ef4444; margin-bottom: 4px;">IVA Recaudado</p>
              <p style="font-size: 16px; font-weight: 700; color: #0d9488;">${formatCurrency(dailyReport?.total_iva || 0)}</p>
            </div>
            <div style="flex: 1; padding: 10px 14px; border-radius: 4px; background: #ecfdf5; border-left: 3px solid #16a34a;">
              <p style="font-size: 10px; color: #475569; margin-bottom: 4px;">Ganancia Total</p>
              <p style="font-size: 16px; font-weight: 700; color: #16a34a;">${formatCurrency(totalProfit)}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Create hidden iframe for direct printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.style.left = '-9999px';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(printContent);
      iframeDoc.close();
      
      setTimeout(() => {
        iframe.contentWindow?.print();
        // Remove iframe after printing
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 500);
      }, 100);
    }
  }

  return (
    <MainLayout
      title="Reportes"
      subtitle="Análisis y estadísticas del negocio"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="ventas" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            Informe de Ventas
          </TabsTrigger>
          <TabsTrigger value="cierre" className="gap-2">
            <Calculator className="w-4 h-4" />
            Cierre de Caja
          </TabsTrigger>
          <TabsTrigger value="stock" className="gap-2">
            <AlertTriangle className="w-4 h-4" />
            Stock Bajo
          </TabsTrigger>
          <TabsTrigger value="vencimientos" className="gap-2">
            <Clock className="w-4 h-4" />
            Vencimientos
          </TabsTrigger>
        </TabsList>

        {/* INFORME DE VENTAS TAB */}
        <TabsContent value="ventas" className="space-y-6">
          {/* Date selector and actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-44"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={fetchDailyData}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <Button variant="outline" onClick={handlePrint} className="gap-2">
              <Printer className="w-4 h-4" />
              Imprimir Reporte
            </Button>
          </div>

          {/* Sales Report Table */}
          <Card className="p-6 print:shadow-none print:border-none">
            <div className="mb-4 print:mb-6">
              <div className="bg-slate-700 text-white text-center py-3 rounded-t-lg print:rounded-none">
                <h2 className="text-lg font-semibold">Informe diario de ventas</h2>
              </div>
              <div className="border border-t-0 border-border px-4 py-2 bg-muted/30">
                <p className="text-sm">
                  <span className="font-medium">Fecha:</span> {formatDate(selectedDate)}
                  <span className="ml-4 font-medium">Transacciones:</span> {dailyReport?.total_transactions || 0}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Cargando...</div>
            ) : saleItems.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-600 text-white">
                        <th className="py-2 px-3 text-left font-medium w-12">#</th>
                        <th className="py-2 px-3 text-left font-medium">Producto</th>
                        <th className="py-2 px-3 text-center font-medium w-20">Cant.</th>
                        <th className="py-2 px-3 text-right font-medium w-28">Precio Unit.</th>
                        <th className="py-2 px-3 text-right font-medium w-28">Total</th>
                        <th className="py-2 px-3 text-left font-medium w-32">Vendedor</th>
                        <th className="py-2 px-3 text-right font-medium w-28">Ganancia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {saleItems.map((item, index) => {
                        const profit = item.cost_price 
                          ? (item.unit_price - item.cost_price) * item.quantity 
                          : 0;
                        return (
                          <tr key={item.id} className="border-b border-border hover:bg-muted/30">
                            <td className="py-2 px-3 text-muted-foreground">{index + 1}</td>
                            <td className="py-2 px-3 font-medium">{item.product_name}</td>
                            <td className="py-2 px-3 text-center">{item.quantity}</td>
                            <td className="py-2 px-3 text-right">{formatCurrency(item.unit_price)}</td>
                            <td className="py-2 px-3 text-right font-medium">{formatCurrency(item.total_price)}</td>
                            <td className="py-2 px-3 text-muted-foreground">{item.cashier_name || '-'}</td>
                            <td className={`py-2 px-3 text-right font-medium ${profit > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                              {formatCurrency(profit)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-600 text-white font-semibold">
                        <td className="py-2 px-3" colSpan={2}>TOTAL</td>
                        <td className="py-2 px-3 text-center">
                          {saleItems.reduce((sum, item) => sum + item.quantity, 0)}
                        </td>
                        <td className="py-2 px-3"></td>
                        <td className="py-2 px-3 text-right">
                          {formatCurrency(saleItems.reduce((sum, item) => sum + item.total_price, 0))}
                        </td>
                        <td className="py-2 px-3"></td>
                        <td className="py-2 px-3 text-right">
                          {formatCurrency(saleItems.reduce((sum, item) => {
                            const profit = item.cost_price 
                              ? (item.unit_price - item.cost_price) * item.quantity 
                              : 0;
                            return sum + profit;
                          }, 0))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Summary cards below table */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 print:hidden">
                  <div className="p-4 rounded-lg bg-emerald-50 border-l-4 border-blue-500">
                    <p className="text-sm text-red-500">Venta Total</p>
                    <p className="text-xl font-bold text-blue-600">
                      {formatCurrency(dailyReport?.total_sales || 0)}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-blue-50 border-l-4 border-blue-500">
                    <p className="text-sm text-red-500">IVA Recaudado</p>
                    <p className="text-xl font-bold text-blue-600">
                      {formatCurrency(dailyReport?.total_iva || 0)}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-emerald-50 border-l-4 border-green-500">
                    <p className="text-sm text-gray-600">Ganancia Total</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(saleItems.reduce((sum, item) => {
                        const profit = item.cost_price 
                          ? (item.unit_price - item.cost_price) * item.quantity 
                          : 0;
                        return sum + profit;
                      }, 0))}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No hay ventas registradas para esta fecha</p>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* CIERRE DE CAJA TAB */}
        <TabsContent value="cierre" className="space-y-6">
          {/* Date selector and actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-44"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={fetchDailyData}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <Button variant="outline" onClick={handlePrint} className="gap-2">
              <Printer className="w-4 h-4" />
              Imprimir Reporte
            </Button>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-5 bg-gradient-to-br from-yerba/10 to-yerba/5 border-yerba/20">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ventas Totales</p>
                  <p className="text-2xl font-bold text-yerba mt-1">
                    {formatCurrency(dailyReport?.total_sales || 0)}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-yerba/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-yerba" />
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Transacciones</p>
                  <p className="text-2xl font-bold mt-1">
                    {dailyReport?.total_transactions || 0}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Package className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">IVA Recaudado</p>
                  <p className="text-2xl font-bold mt-1">
                    {formatCurrency(dailyReport?.total_iva || 0)}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ticket Promedio</p>
                  <p className="text-2xl font-bold mt-1">
                    {formatCurrency(
                      dailyReport?.total_transactions 
                        ? Math.round((dailyReport.total_sales || 0) / dailyReport.total_transactions)
                        : 0
                    )}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment methods breakdown */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Desglose por Método de Pago</h3>
              {dailyReport?.by_payment_method && dailyReport.by_payment_method.length > 0 ? (
                <div className="space-y-3">
                  {dailyReport.by_payment_method.map((method) => (
                    <div 
                      key={method.payment_method}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center">
                          {paymentMethodIcons[method.payment_method] || <Wallet className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-medium">
                            {paymentMethodLabels[method.payment_method] || method.payment_method}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {method.count} {method.count === 1 ? 'transacción' : 'transacciones'}
                          </p>
                        </div>
                      </div>
                      <p className="font-semibold">
                        {formatCurrency(method.total_sales || 0)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hay ventas registradas para esta fecha
                </div>
              )}
            </Card>

            {/* Sales list */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Detalle de Ventas</h3>
              {daySales.length > 0 ? (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {daySales.map((sale) => (
                    <div 
                      key={sale.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          {paymentMethodIcons[sale.payment_method] || <Wallet className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">
                            {sale.items_summary || sale.receipt_number}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatTime(sale.created_at)}
                            {sale.cashier_name && ` • ${sale.cashier_name}`}
                          </p>
                        </div>
                      </div>
                      <p className="font-semibold text-sm flex-shrink-0 ml-2">
                        {formatCurrency(sale.total)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hay ventas registradas para esta fecha
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* STOCK BAJO TAB */}
        <TabsContent value="stock" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-lg">Productos con Stock Bajo</h3>
                <p className="text-sm text-muted-foreground">
                  Productos que necesitan reposición
                </p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">{lowStockProducts.length} alertas</span>
              </div>
            </div>

            {lowStockProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Producto</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">SKU</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Categoría</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Stock Actual</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Stock Mínimo</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockProducts.map((product) => {
                      const isCritical = product.stock <= product.min_stock * 0.3;
                      return (
                        <tr key={product.id} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="py-3 px-4 font-medium">{product.name}</td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">{product.sku}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 rounded-full text-xs bg-muted">
                              {product.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-bold">
                            <span className={isCritical ? 'text-red-500' : 'text-amber-500'}>
                              {product.stock}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center text-muted-foreground">
                            {product.min_stock}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isCritical ? (
                              <span className="px-2 py-1 rounded-full text-xs bg-red-500/10 text-red-500 font-medium">
                                Crítico
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded-full text-xs bg-amber-500/10 text-amber-500 font-medium">
                                Bajo
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-green-500" />
                </div>
                <h4 className="font-medium text-lg mb-1">Todo en orden</h4>
                <p className="text-muted-foreground">
                  No hay productos con stock bajo en este momento
                </p>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* VENCIMIENTOS TAB */}
        <TabsContent value="vencimientos" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-lg">Productos por Vencer</h3>
                <p className="text-sm text-muted-foreground">
                  Próximos 60 días
                </p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-600">
                <Clock className="w-4 h-4" />
                <span className="font-medium">{expiringProducts.length} productos</span>
              </div>
            </div>

            {expiringProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Producto</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">SKU</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Categoría</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Stock</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Vencimiento</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expiringProducts.map((product) => {
                      const daysLeft = getDaysUntilExpiration(product.expiration_date!);
                      const isExpired = daysLeft <= 0;
                      const isCritical = daysLeft > 0 && daysLeft <= 7;
                      const isWarning = daysLeft > 7 && daysLeft <= 30;
                      
                      return (
                        <tr key={product.id} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="py-3 px-4 font-medium">{product.name}</td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">{product.sku}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 rounded-full text-xs bg-muted">
                              {product.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">{product.stock}</td>
                          <td className="py-3 px-4 text-center">
                            {formatDate(product.expiration_date!)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isExpired ? (
                              <span className="px-2 py-1 rounded-full text-xs bg-red-500/10 text-red-500 font-medium">
                                ¡Vencido!
                              </span>
                            ) : isCritical ? (
                              <span className="px-2 py-1 rounded-full text-xs bg-red-500/10 text-red-500 font-medium">
                                {daysLeft} días
                              </span>
                            ) : isWarning ? (
                              <span className="px-2 py-1 rounded-full text-xs bg-amber-500/10 text-amber-500 font-medium">
                                {daysLeft} días
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground font-medium">
                                {daysLeft} días
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-green-500" />
                </div>
                <h4 className="font-medium text-lg mb-1">Todo en orden</h4>
                <p className="text-muted-foreground">
                  No hay productos próximos a vencer
                </p>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
