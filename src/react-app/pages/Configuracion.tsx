import { useState, useEffect } from "react";
import MainLayout from "@/react-app/components/layout/MainLayout";
import { authFetch } from "@/react-app/contexts/AuthContext";
import { Card } from "@/react-app/components/ui/card";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/react-app/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/react-app/components/ui/select";
import { Users, Plus, Pencil, Trash2, UserCog, Loader2, AlertCircle, Shield, ShoppingCart, Eye, EyeOff } from "lucide-react";
import { cn } from "@/react-app/lib/utils";

interface User {
  id: number;
  username: string;
  password_hash: string;
  name: string | null;
  role: 'admin' | 'cashier';
  is_active: number;
  created_at: string;
}

interface UserFormData {
  username: string;
  password: string;
  name: string;
  role: 'admin' | 'cashier';
  is_active: boolean;
}

const emptyForm: UserFormData = {
  username: "",
  password: "",
  name: "",
  role: "cashier",
  is_active: true,
};

export default function ConfiguracionPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await authFetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        console.error("Error fetching users:", res.status);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    }
    setIsLoading(false);
  };

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        password: "",
        name: user.name || "",
        role: user.role,
        is_active: user.is_active === 1,
      });
    } else {
      setEditingUser(null);
      setFormData(emptyForm);
    }
    setError("");
    setShowPassword(false);
    setModalOpen(true);
  };

  const handleSave = async () => {
    setError("");
    
    if (!formData.username.trim()) {
      setError("El nombre de usuario es requerido");
      return;
    }
    
    if (!editingUser && !formData.password.trim()) {
      setError("La contraseña es requerida para nuevos usuarios");
      return;
    }

    setIsSaving(true);

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users";
      const method = editingUser ? "PUT" : "POST";
      
      const body: any = {
        username: formData.username,
        name: formData.name || null,
        role: formData.role,
        is_active: formData.is_active,
      };
      
      if (formData.password) {
        body.password = formData.password;
      }

      const res = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al guardar usuario");
        setIsSaving(false);
        return;
      }

      await fetchUsers();
      setModalOpen(false);
    } catch (err) {
      setError("Error de conexión");
    }
    setIsSaving(false);
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`¿Eliminar usuario "${user.username}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const res = await authFetch(`/api/users/${user.id}`, { method: "DELETE" });
      const data = await res.json();
      
      if (!res.ok) {
        alert(data.error || "Error al eliminar usuario");
        return;
      }
      
      await fetchUsers();
    } catch (err) {
      alert("Error de conexión");
    }
  };

  return (
    <MainLayout title="Configuración" subtitle="Gestión de usuarios y sistema">
      {/* User Management Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yerba-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-yerba-600" />
            </div>
            <div>
              <h2 className="font-semibold text-lg text-foreground">Usuarios</h2>
              <p className="text-sm text-muted-foreground">Gestiona los usuarios del sistema</p>
            </div>
          </div>
          <Button onClick={() => handleOpenModal()} className="bg-yerba-600 hover:bg-yerba-700">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Usuario
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-yerba-600 animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <UserCog className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No hay usuarios registrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">Usuario</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">Nombre</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">Contraseña</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">Rol</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">Estado</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground text-sm">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold",
                          user.role === 'admin' 
                            ? "bg-gradient-to-br from-yerba-600 to-yerba-700" 
                            : "bg-gradient-to-br from-gold-500 to-gold-600"
                        )}>
                          {(user.name || user.username).charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">{user.username}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {user.name || "-"}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">
                          {visiblePasswords.has(user.id) ? user.password_hash : "••••••••"}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setVisiblePasswords(prev => {
                              const newSet = new Set(prev);
                              if (newSet.has(user.id)) {
                                newSet.delete(user.id);
                              } else {
                                newSet.add(user.id);
                              }
                              return newSet;
                            });
                          }}
                          className="text-muted-foreground hover:text-foreground"
                          title={visiblePasswords.has(user.id) ? "Ocultar contraseña" : "Mostrar contraseña"}
                        >
                          {visiblePasswords.has(user.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                        user.role === 'admin'
                          ? "bg-yerba-100 text-yerba-700"
                          : "bg-gold-100 text-gold-700"
                      )}>
                        {user.role === 'admin' ? <Shield className="w-3 h-3" /> : <ShoppingCart className="w-3 h-3" />}
                        {user.role === 'admin' ? 'Administrador' : 'Cajero'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn(
                        "inline-flex px-2 py-0.5 rounded text-xs font-medium",
                        user.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      )}>
                        {user.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenModal(user)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(user)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* User Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
            </DialogTitle>
          </DialogHeader>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Nombre de usuario *
              </label>
              <Input
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="usuario"
                disabled={!!editingUser}
              />
              {editingUser && (
                <p className="text-xs text-muted-foreground mt-1">El nombre de usuario no se puede cambiar</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Contraseña {editingUser ? "(dejar vacío para no cambiar)" : "*"}
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingUser ? "••••••••" : "Contraseña"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Nombre completo
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Juan Pérez"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Rol
              </label>
              <Select
                value={formData.role}
                onValueChange={(value: 'admin' | 'cashier') => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-yerba-600" />
                      Administrador
                    </div>
                  </SelectItem>
                  <SelectItem value="cashier">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-gold-600" />
                      Cajero
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {formData.role === 'admin' 
                  ? "Acceso completo: Panel Principal, Inventario, POS, Reportes" 
                  : "Acceso limitado: Solo Punto de Venta"}
              </p>
            </div>

            {editingUser && (
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <label htmlFor="is_active" className="text-sm">
                  Usuario activo
                </label>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-yerba-600 hover:bg-yerba-700">
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingUser ? "Guardar Cambios" : "Crear Usuario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
