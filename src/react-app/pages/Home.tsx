import { useEffect, useState } from "react";
import {
  Package,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Clock,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import MainLayout from "@/react-app/components/layout/MainLayout";
import { Card } from "@/react-app/components/ui/card";
import { cn } from "@/react-app/lib/utils";
import { useNavigate } from "react-router";

interface DashboardStats {
  today_transactions: number;
  today_sales: number;
  total_products: number;
  low_stock_count: number;
  expiring_count: number;
  inventory_value: number;
}

interface Sale {
  id: number;
  receipt_number: string;
  total: number;
  payment_method: string;
  cashier_name: string;
  created_at: string;
  items_summary?: string;
}

interface LowStockProduct {
  id: number;
  name: string;
  stock: number;
  min_stock: number;
}

interface ExpiringProduct {
  id: number;
  name: string;
  expiration_date: string;
  stock: number;
}

function formatGuarani(amount: number): string {
  return `₲ ${Math.round(amount).toLocaleString("es-PY")}`;
}

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "Ahora mismo";
  if (diffMins < 60) return `Hace ${diffMins} min`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
}

function daysUntil(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return "Vencido";
  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Mañana";
  return `${diffDays} días`;
}

export default function HomePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [expiringProducts, setExpiringProducts] = useState<ExpiringProduct[]>([]);
  const [monthStats, setMonthStats] = useState({ total: 0, transactions: 0 });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, salesRes, lowStockRes, expiringRes, monthRes] = await Promise.all([
        fetch("/api/dashboard/stats", { credentials: "include" }),
        fetch("/api/sales?limit=5", { credentials: "include" }),
        fetch("/api/reports/low-stock", { credentials: "include" }),
        fetch("/api/reports/expiring?days=7", { credentials: "include" }),
        fetchMonthStats(),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }

      if (salesRes.ok) {
        const data = await salesRes.json();
        setRecentSales(data);
      }

      if (lowStockRes.ok) {
        const data = await lowStockRes.json();
        setLowStockProducts(data.slice(0, 5));
      }

      if (expiringRes.ok) {
        const data = await expiringRes.json();
        setExpiringProducts(data.slice(0, 4));
      }

      if (monthRes) {
        setMonthStats(monthRes);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthStats = async () => {
    // Get first day of current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    
    let total = 0;
    let transactions = 0;
    
    // Fetch all sales for this month (simple approach)
    const res = await fetch(`/api/sales?limit=1000`, { credentials: "include" });
    if (res.ok) {
      const sales: Sale[] = await res.json();
      sales.forEach(sale => {
        const saleDate = new Date(sale.created_at);
        if (saleDate >= firstDay && saleDate <= now) {
          total += sale.total;
          transactions++;
        }
      });
    }
    
    return { total, transactions };
  };

  const currentDate = new Date().toLocaleDateString('es-PY', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const statCards = stats ? [
    {
      label: "Ventas del Día",
      value: formatGuarani(stats.today_sales),
      change: `${stats.today_transactions} ventas`,
      trend: "up" as const,
      icon: DollarSign,
      color: "text-yerba",
      bgColor: "bg-yerba/10",
    },
    {
      label: "Transacciones Hoy",
      value: String(stats.today_transactions),
      change: "hoy",
      trend: "up" as const,
      icon: ShoppingCart,
      color: "text-gold",
      bgColor: "bg-gold/10",
    },
    {
      label: "Productos en Stock",
      value: stats.total_products.toLocaleString(),
      change: formatGuarani(stats.inventory_value),
      trend: "info" as const,
      icon: Package,
      color: "text-wood",
      bgColor: "bg-wood/10",
    },
    {
      label: "Alertas",
      value: String(stats.low_stock_count + stats.expiring_count),
      change: `${stats.low_stock_count} stock bajo`,
      trend: stats.low_stock_count > 0 ? "warning" as const : "up" as const,
      icon: AlertTriangle,
      color: stats.low_stock_count > 0 ? "text-destructive" : "text-yerba",
      bgColor: stats.low_stock_count > 0 ? "bg-destructive/10" : "bg-yerba/10",
    },
  ] : [];

  if (loading) {
    return (
      <MainLayout
        title="Panel Principal"
        subtitle={currentDate.charAt(0).toUpperCase() + currentDate.slice(1)}
      >
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-yerba" />
          <span className="ml-2 text-muted-foreground">Cargando datos...</span>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title="Panel Principal"
      subtitle={currentDate.charAt(0).toUpperCase() + currentDate.slice(1)}
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.label} className="p-5 bg-card border-border hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className={cn("p-2.5 rounded-xl", stat.bgColor)}>
                <stat.icon className={cn("w-5 h-5", stat.color)} />
              </div>
              {stat.trend === "up" && (
                <div className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full text-yerba bg-yerba/10">
                  <ArrowUpRight className="w-3 h-3" />
                  {stat.change}
                </div>
              )}
              {stat.trend === "warning" && (
                <span className="text-xs font-medium text-destructive bg-destructive/10 px-2 py-1 rounded-full">
                  {stat.change}
                </span>
              )}
              {stat.trend === "info" && (
                <span className="text-xs font-medium text-wood bg-wood/10 px-2 py-1 rounded-full">
                  {stat.change}
                </span>
              )}
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sales */}
        <Card className="lg:col-span-2 p-6 bg-card border-border">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display font-semibold text-lg text-foreground">Ventas Recientes</h2>
              <p className="text-sm text-muted-foreground">Últimas transacciones del día</p>
            </div>
            <button 
              onClick={() => navigate("/pos")}
              className="text-sm text-primary hover:underline font-medium"
            >
              Ver POS →
            </button>
          </div>
          <div className="space-y-3">
            {recentSales.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay ventas recientes
              </div>
            ) : (
              recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yerba/20 to-gold/20 flex items-center justify-center">
                      <ShoppingCart className="w-4 h-4 text-yerba" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground line-clamp-1">
                        {sale.items_summary || sale.receipt_number}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {timeAgo(sale.created_at)}
                        <span className="px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground capitalize">
                          {sale.payment_method}
                        </span>
                        {sale.cashier_name && (
                          <span className="text-muted-foreground">• {sale.cashier_name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="font-semibold text-foreground">{formatGuarani(sale.total)}</p>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Alerts Column */}
        <div className="space-y-6">
          {/* Low Stock Alert */}
          <Card className="p-5 bg-card border-border">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="w-4 h-4 text-destructive" />
              </div>
              <h3 className="font-semibold text-foreground">Stock Bajo</h3>
              {lowStockProducts.length > 0 && (
                <span className="ml-auto text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">
                  {lowStockProducts.length}
                </span>
              )}
            </div>
            <div className="space-y-3">
              {lowStockProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  ✓ Todo el inventario está bien
                </p>
              ) : (
                lowStockProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <span className="text-sm text-foreground truncate flex-1 mr-2">{product.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-destructive bg-destructive/10 px-2 py-1 rounded">
                        {product.stock} / {product.min_stock}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button 
              onClick={() => navigate("/inventario")}
              className="w-full mt-4 py-2 text-sm font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors"
            >
              Ver inventario completo
            </button>
          </Card>

          {/* Expiring Products */}
          <Card className="p-5 bg-card border-border">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-gold/10">
                <Clock className="w-4 h-4 text-gold" />
              </div>
              <h3 className="font-semibold text-foreground">Próximos a Vencer</h3>
              {expiringProducts.length > 0 && (
                <span className="ml-auto text-xs bg-gold/10 text-gold px-2 py-0.5 rounded-full">
                  {expiringProducts.length}
                </span>
              )}
            </div>
            <div className="space-y-3">
              {expiringProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  ✓ Sin productos por vencer próximamente
                </p>
              ) : (
                expiringProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <span className="text-sm text-foreground truncate flex-1 mr-2">{product.name}</span>
                    <span className="text-xs font-medium text-gold bg-gold/10 px-2 py-1 rounded whitespace-nowrap">
                      {daysUntil(product.expiration_date)}
                    </span>
                  </div>
                ))
              )}
            </div>
            <button 
              onClick={() => navigate("/inventario")}
              className="w-full mt-4 py-2 text-sm font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors"
            >
              Ver todos los productos
            </button>
          </Card>

          {/* Quick Stats */}
          <Card className="p-5 bg-gradient-to-br from-yerba to-emerald-600 text-white border-0">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5" />
              <h3 className="font-semibold">Resumen del Mes</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-white/80 text-sm">Total Ventas</span>
                <span className="font-bold">{formatGuarani(monthStats.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/80 text-sm">Transacciones</span>
                <span className="font-bold">{monthStats.transactions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/80 text-sm">Ticket Promedio</span>
                <span className="font-bold">
                  {monthStats.transactions > 0 
                    ? formatGuarani(monthStats.total / monthStats.transactions)
                    : "₲ 0"}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
