import { ReactNode } from "react";
import { Navigate } from "react-router";
import { useAppAuth } from "@/react-app/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, isPending, isAdmin } = useAppAuth();

  if (isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yerba-50 via-cream to-wood-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-yerba-600 animate-spin mx-auto mb-4" />
          <p className="text-wood-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user is active
  if (user.is_active === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yerba-50 via-cream to-wood-100 flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-wood-200 p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🚫</span>
          </div>
          <h2 className="text-xl font-semibold text-wood-800 mb-2">
            Cuenta desactivada
          </h2>
          <p className="text-wood-600">
            Tu cuenta ha sido desactivada. Contactá al administrador.
          </p>
        </div>
      </div>
    );
  }

  // Check admin requirement
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/pos" replace />;
  }

  return <>{children}</>;
}
