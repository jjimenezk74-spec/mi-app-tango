import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Loader2, User, Lock, AlertCircle } from "lucide-react";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { useAppAuth } from "@/react-app/contexts/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAppAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialSetup, setIsInitialSetup] = useState(false);

  useEffect(() => {
    // Check if system is in initial setup mode
    fetch("/api/system/setup-status")
      .then(res => res.json())
      .then(data => setIsInitialSetup(data.isInitialSetup))
      .catch(() => setIsInitialSetup(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await login(username, password);

    if (result.success) {
      navigate("/");
    } else {
      setError(result.error || "Error de autenticación");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yerba-50 via-cream to-wood-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yerba-600 to-yerba-700 rounded-2xl shadow-lg mb-4">
            <span className="text-4xl">🧉</span>
          </div>
          <h1 className="text-3xl font-bold text-yerba-900 tracking-tight">
            Tango & Tereré
          </h1>
          <p className="text-wood-600 mt-1">Sistema de Gestión</p>
        </div>

        {/* Login card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-wood-200 p-8">
          <h2 className="text-xl font-semibold text-center text-wood-800 mb-6">
            Iniciar Sesión
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-wood-700 mb-1.5">
                Usuario
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-wood-400" />
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nombre de usuario"
                  className="pl-10"
                  required
                  disabled={isLoading}
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-wood-700 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-wood-400" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !username || !password}
              className="w-full bg-yerba-600 hover:bg-yerba-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Ingresando...
                </>
              ) : (
                "Ingresar"
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-wood-200">
            <div className="flex items-center justify-center gap-4 text-sm text-wood-500">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-yerba-500"></div>
                <span>Admin</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-gold-500"></div>
                <span>Cajero</span>
              </div>
            </div>
            {isInitialSetup && (
              <p className="text-center text-xs text-wood-400 mt-2">
                Usuario inicial: admin / admin123
              </p>
            )}
          </div>
        </div>

        <p className="text-center text-wood-500 text-sm mt-6">
          © 2024 Tango & Tereré Shop
        </p>
      </div>
    </div>
  );
}
