import { useState, useEffect } from "react";
import TopNav from "@/react-app/components/layout/TopNav";
import { Input } from "@/react-app/components/ui/input";
import { Button } from "@/react-app/components/ui/button";
import { Label } from "@/react-app/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/react-app/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/react-app/components/ui/tabs";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Users,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  User,
} from "lucide-react";

interface Customer {
  id: number;
  name: string;
  ruc_ci: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
}

interface Supplier {
  id: number;
  name: string;
  ruc: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  contact_name: string | null;
  notes: string | null;
}

export default function ContactosPage() {
  const [activeTab, setActiveTab] = useState("clientes");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Customers state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerForm, setCustomerForm] = useState({
    name: "",
    ruc_ci: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });
  
  // Suppliers state
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierForm, setSupplierForm] = useState({
    name: "",
    ruc: "",
    phone: "",
    email: "",
    address: "",
    contact_name: "",
    notes: "",
  });

  // Fetch customers
  useEffect(() => {
    fetchCustomers();
  }, []);

  // Fetch suppliers
  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/customers", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await fetch("/api/suppliers", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data.suppliers || []);
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  // Customer handlers
  const openCustomerModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setCustomerForm({
        name: customer.name,
        ruc_ci: customer.ruc_ci || "",
        phone: customer.phone || "",
        email: customer.email || "",
        address: customer.address || "",
        notes: customer.notes || "",
      });
    } else {
      setEditingCustomer(null);
      setCustomerForm({ name: "", ruc_ci: "", phone: "", email: "", address: "", notes: "" });
    }
    setShowCustomerModal(true);
  };

  const saveCustomer = async () => {
    if (!customerForm.name.trim()) return;
    
    try {
      const url = editingCustomer ? `/api/customers/${editingCustomer.id}` : "/api/customers";
      const method = editingCustomer ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(customerForm),
      });
      
      if (res.ok) {
        fetchCustomers();
        setShowCustomerModal(false);
      }
    } catch (error) {
      console.error("Error saving customer:", error);
    }
  };

  const deleteCustomer = async (id: number) => {
    if (!confirm("¿Eliminar este cliente?")) return;
    
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        fetchCustomers();
      }
    } catch (error) {
      console.error("Error deleting customer:", error);
    }
  };

  // Supplier handlers
  const openSupplierModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setSupplierForm({
        name: supplier.name,
        ruc: supplier.ruc || "",
        phone: supplier.phone || "",
        email: supplier.email || "",
        address: supplier.address || "",
        contact_name: supplier.contact_name || "",
        notes: supplier.notes || "",
      });
    } else {
      setEditingSupplier(null);
      setSupplierForm({ name: "", ruc: "", phone: "", email: "", address: "", contact_name: "", notes: "" });
    }
    setShowSupplierModal(true);
  };

  const saveSupplier = async () => {
    if (!supplierForm.name.trim()) return;
    
    try {
      const url = editingSupplier ? `/api/suppliers/${editingSupplier.id}` : "/api/suppliers";
      const method = editingSupplier ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(supplierForm),
      });
      
      if (res.ok) {
        fetchSuppliers();
        setShowSupplierModal(false);
      }
    } catch (error) {
      console.error("Error saving supplier:", error);
    }
  };

  const deleteSupplier = async (id: number) => {
    if (!confirm("¿Eliminar este proveedor?")) return;
    
    try {
      const res = await fetch(`/api/suppliers/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        fetchSuppliers();
      }
    } catch (error) {
      console.error("Error deleting supplier:", error);
    }
  };

  // Filter lists
  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.ruc_ci && c.ruc_ci.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.phone && c.phone.includes(searchTerm))
  );

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.ruc && s.ruc.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (s.contact_name && s.contact_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      
      <main className="p-4 md:p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <Users className="w-7 h-7 text-yerba" />
            Clientes y Proveedores
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona tu lista de contactos comerciales
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="clientes" className="gap-2">
                <User className="w-4 h-4" />
                Clientes ({customers.length})
              </TabsTrigger>
              <TabsTrigger value="proveedores" className="gap-2">
                <Building2 className="w-4 h-4" />
                Proveedores ({suppliers.length})
              </TabsTrigger>
            </TabsList>
            
            <div className="flex gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                onClick={() => activeTab === "clientes" ? openCustomerModal() : openSupplierModal()}
                className="bg-yerba hover:bg-yerba-600 text-white gap-2"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nuevo</span>
              </Button>
            </div>
          </div>

          {/* Customers Tab */}
          <TabsContent value="clientes">
            <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
              {loadingCustomers ? (
                <div className="p-8 text-center text-muted-foreground">Cargando...</div>
              ) : filteredCustomers.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  {searchTerm ? "No se encontraron clientes" : "No hay clientes registrados"}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/30 border-b">
                      <tr>
                        <th className="text-left p-3 font-medium text-sm">Nombre</th>
                        <th className="text-left p-3 font-medium text-sm">RUC/CI</th>
                        <th className="text-left p-3 font-medium text-sm hidden md:table-cell">Teléfono</th>
                        <th className="text-left p-3 font-medium text-sm hidden lg:table-cell">Email</th>
                        <th className="text-left p-3 font-medium text-sm hidden xl:table-cell">Dirección</th>
                        <th className="text-right p-3 font-medium text-sm w-24">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredCustomers.map((customer) => (
                        <tr key={customer.id} className="hover:bg-muted/20 transition-colors">
                          <td className="p-3 font-medium">{customer.name}</td>
                          <td className="p-3 text-muted-foreground">{customer.ruc_ci || "-"}</td>
                          <td className="p-3 text-muted-foreground hidden md:table-cell">{customer.phone || "-"}</td>
                          <td className="p-3 text-muted-foreground hidden lg:table-cell">{customer.email || "-"}</td>
                          <td className="p-3 text-muted-foreground hidden xl:table-cell truncate max-w-xs">{customer.address || "-"}</td>
                          <td className="p-3">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => openCustomerModal(customer)}
                                className="h-8 w-8"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => deleteCustomer(customer.id)}
                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
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
            </div>
          </TabsContent>

          {/* Suppliers Tab */}
          <TabsContent value="proveedores">
            <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
              {loadingSuppliers ? (
                <div className="p-8 text-center text-muted-foreground">Cargando...</div>
              ) : filteredSuppliers.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  {searchTerm ? "No se encontraron proveedores" : "No hay proveedores registrados"}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/30 border-b">
                      <tr>
                        <th className="text-left p-3 font-medium text-sm">Empresa</th>
                        <th className="text-left p-3 font-medium text-sm">RUC</th>
                        <th className="text-left p-3 font-medium text-sm hidden md:table-cell">Contacto</th>
                        <th className="text-left p-3 font-medium text-sm hidden lg:table-cell">Teléfono</th>
                        <th className="text-left p-3 font-medium text-sm hidden xl:table-cell">Email</th>
                        <th className="text-right p-3 font-medium text-sm w-24">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredSuppliers.map((supplier) => (
                        <tr key={supplier.id} className="hover:bg-muted/20 transition-colors">
                          <td className="p-3 font-medium">{supplier.name}</td>
                          <td className="p-3 text-muted-foreground">{supplier.ruc || "-"}</td>
                          <td className="p-3 text-muted-foreground hidden md:table-cell">{supplier.contact_name || "-"}</td>
                          <td className="p-3 text-muted-foreground hidden lg:table-cell">{supplier.phone || "-"}</td>
                          <td className="p-3 text-muted-foreground hidden xl:table-cell">{supplier.email || "-"}</td>
                          <td className="p-3">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => openSupplierModal(supplier)}
                                className="h-8 w-8"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => deleteSupplier(supplier.id)}
                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
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
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Customer Modal */}
      <Dialog open={showCustomerModal} onOpenChange={setShowCustomerModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-yerba" />
              {editingCustomer ? "Editar Cliente" : "Nuevo Cliente"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="flex items-center gap-1">
                <User className="w-3 h-3" /> Nombre *
              </Label>
              <Input
                value={customerForm.name}
                onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                placeholder="Nombre completo"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="flex items-center gap-1">
                  <FileText className="w-3 h-3" /> RUC/CI
                </Label>
                <Input
                  value={customerForm.ruc_ci}
                  onChange={(e) => setCustomerForm({ ...customerForm, ruc_ci: e.target.value })}
                  placeholder="Documento"
                />
              </div>
              <div>
                <Label className="flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Teléfono
                </Label>
                <Input
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                  placeholder="Teléfono"
                />
              </div>
            </div>
            <div>
              <Label className="flex items-center gap-1">
                <Mail className="w-3 h-3" /> Email
              </Label>
              <Input
                type="email"
                value={customerForm.email}
                onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                placeholder="correo@ejemplo.com"
              />
            </div>
            <div>
              <Label className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Dirección
              </Label>
              <Input
                value={customerForm.address}
                onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                placeholder="Dirección"
              />
            </div>
            <div>
              <Label>Notas</Label>
              <Input
                value={customerForm.notes}
                onChange={(e) => setCustomerForm({ ...customerForm, notes: e.target.value })}
                placeholder="Notas adicionales"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowCustomerModal(false)}>
                Cancelar
              </Button>
              <Button onClick={saveCustomer} className="bg-yerba hover:bg-yerba-600 text-white">
                {editingCustomer ? "Guardar Cambios" : "Crear Cliente"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Supplier Modal */}
      <Dialog open={showSupplierModal} onOpenChange={setShowSupplierModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-yerba" />
              {editingSupplier ? "Editar Proveedor" : "Nuevo Proveedor"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="flex items-center gap-1">
                <Building2 className="w-3 h-3" /> Nombre/Empresa *
              </Label>
              <Input
                value={supplierForm.name}
                onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                placeholder="Nombre de la empresa"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="flex items-center gap-1">
                  <FileText className="w-3 h-3" /> RUC
                </Label>
                <Input
                  value={supplierForm.ruc}
                  onChange={(e) => setSupplierForm({ ...supplierForm, ruc: e.target.value })}
                  placeholder="RUC"
                />
              </div>
              <div>
                <Label className="flex items-center gap-1">
                  <User className="w-3 h-3" /> Contacto
                </Label>
                <Input
                  value={supplierForm.contact_name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, contact_name: e.target.value })}
                  placeholder="Persona de contacto"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Teléfono
                </Label>
                <Input
                  value={supplierForm.phone}
                  onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                  placeholder="Teléfono"
                />
              </div>
              <div>
                <Label className="flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Email
                </Label>
                <Input
                  type="email"
                  value={supplierForm.email}
                  onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                  placeholder="Email"
                />
              </div>
            </div>
            <div>
              <Label className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Dirección
              </Label>
              <Input
                value={supplierForm.address}
                onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                placeholder="Dirección"
              />
            </div>
            <div>
              <Label>Notas</Label>
              <Input
                value={supplierForm.notes}
                onChange={(e) => setSupplierForm({ ...supplierForm, notes: e.target.value })}
                placeholder="Notas adicionales"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowSupplierModal(false)}>
                Cancelar
              </Button>
              <Button onClick={saveSupplier} className="bg-yerba hover:bg-yerba-600 text-white">
                {editingSupplier ? "Guardar Cambios" : "Crear Proveedor"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
