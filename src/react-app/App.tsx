import { BrowserRouter as Router, Routes, Route } from "react-router";
import { AppAuthProvider } from "@/react-app/contexts/AuthContext";
import ProtectedRoute from "@/react-app/components/ProtectedRoute";
import HomePage from "@/react-app/pages/Home";
import InventarioPage from "@/react-app/pages/Inventario";
import ComprasPage from "@/react-app/pages/Compras";
import POSPage from "@/react-app/pages/POS";
import CajaPage from "@/react-app/pages/Caja";
import ReportesPage from "@/react-app/pages/Reportes";
import ConfiguracionPage from "@/react-app/pages/Configuracion";
import ContactosPage from "@/react-app/pages/Contactos";
import LoginPage from "@/react-app/pages/Login";

export default function App() {
  return (
    <AppAuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected routes - Admin only */}
          <Route path="/" element={
            <ProtectedRoute requireAdmin>
              <HomePage />
            </ProtectedRoute>
          } />
          <Route path="/inventario" element={
            <ProtectedRoute requireAdmin>
              <InventarioPage />
            </ProtectedRoute>
          } />
          <Route path="/compras" element={
            <ProtectedRoute requireAdmin>
              <ComprasPage />
            </ProtectedRoute>
          } />
          <Route path="/reportes" element={
            <ProtectedRoute requireAdmin>
              <ReportesPage />
            </ProtectedRoute>
          } />
          <Route path="/configuracion" element={
            <ProtectedRoute requireAdmin>
              <ConfiguracionPage />
            </ProtectedRoute>
          } />
          <Route path="/contactos" element={
            <ProtectedRoute requireAdmin>
              <ContactosPage />
            </ProtectedRoute>
          } />
          
          {/* Protected routes - All authenticated users */}
          <Route path="/pos" element={
            <ProtectedRoute>
              <POSPage />
            </ProtectedRoute>
          } />
          <Route path="/caja" element={
            <ProtectedRoute>
              <CajaPage />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AppAuthProvider>
  );
}
