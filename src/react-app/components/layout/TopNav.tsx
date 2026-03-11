import { NavLink, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FileBarChart,
  Settings,
  LogOut,
  ChevronDown,
  Wallet,
  Truck,
  Users,
} from "lucide-react";
import { cn } from "@/react-app/lib/utils";
import { useAppAuth } from "@/react-app/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/react-app/components/ui/dropdown-menu";

const navItems = [
  { icon: LayoutDashboard, label: "Panel Principal", path: "/", adminOnly: true },
  { icon: Package, label: "Inventario", path: "/inventario", adminOnly: true },
  { icon: Truck, label: "Compras", path: "/compras", adminOnly: true },
  { icon: ShoppingCart, label: "POS", path: "/pos", adminOnly: false },
  { icon: Wallet, label: "Caja", path: "/caja", adminOnly: false },
  { icon: FileBarChart, label: "Reportes", path: "/reportes", adminOnly: true },
  { icon: Users, label: "Contactos", path: "/contactos", adminOnly: true },
  { icon: Settings, label: "Configuración", path: "/configuracion", adminOnly: true },
];

export default function TopNav() {
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
    <header className="sticky top-0 z-40 bg-sidebar text-sidebar-foreground shadow-lg">
      <div className="flex items-center justify-between px-4 h-16">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yerba to-emerald-600 flex items-center justify-center text-xl shadow-lg">
            🧉
          </div>
          <div className="hidden sm:block">
            <h1 className="font-display font-bold text-lg text-gold leading-tight">
              Tango & Tereré
            </h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )
              }
            >
              <item.icon className="w-4 h-4" />
              <span className="font-medium text-sm hidden md:inline">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-sidebar-accent transition-colors">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold",
                isAdmin 
                  ? "bg-gradient-to-br from-yerba-600 to-yerba-700" 
                  : "bg-gradient-to-br from-gold-500 to-gold-600"
              )}>
                {userInitial}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium leading-tight">{userName}</p>
                <p className="text-xs text-sidebar-foreground/60">{roleLabel}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-sidebar-foreground/60 hidden sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5 sm:hidden">
              <p className="text-sm font-medium">{userName}</p>
              <p className="text-xs text-muted-foreground">{roleLabel}</p>
            </div>
            <DropdownMenuSeparator className="sm:hidden" />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
