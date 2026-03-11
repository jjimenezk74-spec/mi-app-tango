import { NavLink, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FileBarChart,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
} from "lucide-react";
import { cn } from "@/react-app/lib/utils";
import { useAppAuth } from "@/react-app/contexts/AuthContext";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { icon: LayoutDashboard, label: "Panel Principal", path: "/", adminOnly: true },
  { icon: Package, label: "Inventario", path: "/inventario", adminOnly: true },
  { icon: ShoppingCart, label: "Punto de Venta", path: "/pos", adminOnly: false },
  { icon: FileBarChart, label: "Reportes", path: "/reportes", adminOnly: true },
  { icon: Settings, label: "Configuración", path: "/configuracion", adminOnly: true },
];

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, isAdmin, logout } = useAppAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const visibleNavItems = navItems.filter(item => !item.adminOnly || isAdmin);
  const userName = user?.name || user?.username || 'Usuario';
  const userInitial = userName.charAt(0).toUpperCase();
  const roleLabel = isAdmin ? 'Administrador' : 'Cajero';

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar text-sidebar-foreground transition-all duration-300 flex flex-col",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Header */}
      <div className="relative flex items-center justify-between p-4 border-b border-sidebar-border">
        <div className={cn("flex items-center gap-3 overflow-hidden", collapsed && "justify-center w-full")}>
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yerba to-emerald-600 flex items-center justify-center text-xl flex-shrink-0 shadow-lg">
            🧉
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="font-display font-bold text-lg text-gold leading-tight">
                Tango & Tereré
              </h1>
              <span className="text-xs text-sidebar-foreground/60">Shop</span>
            </div>
          )}
        </div>
        <button
          onClick={onToggle}
          className={cn(
            "p-1.5 rounded-md hover:bg-sidebar-accent transition-colors",
            collapsed && "absolute -right-3 top-1/2 -translate-y-1/2 bg-sidebar border border-sidebar-border shadow-md"
          )}
        >
          {collapsed ? (
            <Menu className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {visibleNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                collapsed && "justify-center px-2",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && (
              <span className="font-medium text-sm">{item.label}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border">
        <div className={cn(
          "flex items-center gap-3 p-3 rounded-lg bg-sidebar-accent/50",
          collapsed && "justify-center p-2"
        )}>
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0",
            isAdmin 
              ? "bg-gradient-to-br from-yerba-600 to-yerba-700" 
              : "bg-gradient-to-br from-gold-500 to-gold-600"
          )}>
            {userInitial}
          </div>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{userName}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">{roleLabel}</p>
            </div>
          )}
          {!collapsed && (
            <button 
              onClick={handleLogout}
              className="p-1.5 rounded-md hover:bg-sidebar-accent transition-colors text-sidebar-foreground/60 hover:text-sidebar-foreground"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
