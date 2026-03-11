import { useState, useEffect, useCallback } from "react";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { Label } from "@/react-app/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/react-app/components/ui/dialog";
import { ScrollArea } from "@/react-app/components/ui/scroll-area";
import { Search, User, UserPlus, X, Check } from "lucide-react";
import { cn } from "@/react-app/lib/utils";

export interface Customer {
  id: number;
  name: string;
  ruc_ci: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
}

interface CustomerSelectorProps {
  selectedCustomer: Customer | null;
  onSelect: (customer: Customer | null) => void;
}

export default function CustomerSelector({ selectedCustomer, onSelect }: CustomerSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // New customer form
  const [newName, setNewName] = useState("");
  const [newRucCi, setNewRucCi] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAddress, setNewAddress] = useState("");

  const fetchCustomers = useCallback(async (searchTerm: string) => {
    setIsLoading(true);
    try {
      const url = searchTerm 
        ? `/api/customers?search=${encodeURIComponent(searchTerm)}`
        : '/api/customers';
      const res = await fetch(url);
      const data = await res.json();
      setCustomers(data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && !isCreating) {
      fetchCustomers(search);
    }
  }, [isOpen, isCreating, search, fetchCustomers]);

  const handleSelect = (customer: Customer) => {
    onSelect(customer);
    setIsOpen(false);
    setSearch("");
  };

  const handleClear = () => {
    onSelect(null);
  };

  const handleCreateCustomer = async () => {
    if (!newName.trim()) return;

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          ruc_ci: newRucCi.trim() || null,
          phone: newPhone.trim() || null,
          address: newAddress.trim() || null,
        }),
      });

      const data = await res.json();
      if (data.success && data.customer) {
        onSelect(data.customer);
        setIsOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error("Error creating customer:", error);
    }
  };

  const resetForm = () => {
    setNewName("");
    setNewRucCi("");
    setNewPhone("");
    setNewAddress("");
    setIsCreating(false);
    setSearch("");
  };

  const handleClose = () => {
    setIsOpen(false);
    resetForm();
  };

  return (
    <>
      {/* Customer Display / Selector Button */}
      <div className="p-3 border-b border-border">
        <Label className="text-xs text-muted-foreground mb-1.5 block">Cliente</Label>
        {selectedCustomer ? (
          <div className="flex items-center justify-between p-2 rounded-lg bg-primary/10 border border-primary/30">
            <div className="flex items-center gap-2 min-w-0">
              <User className="w-4 h-4 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{selectedCustomer.name}</p>
                {selectedCustomer.ruc_ci && (
                  <p className="text-xs text-muted-foreground">RUC/CI: {selectedCustomer.ruc_ci}</p>
                )}
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleClear}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full justify-start text-muted-foreground"
            onClick={() => setIsOpen(true)}
          >
            <User className="w-4 h-4 mr-2" />
            Consumidor Final
            <span className="ml-auto text-xs">Cambiar</span>
          </Button>
        )}
      </div>

      {/* Customer Selection Dialog */}
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isCreating ? "Nuevo Cliente" : "Seleccionar Cliente"}</DialogTitle>
          </DialogHeader>

          {isCreating ? (
            /* Create Customer Form */
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nombre completo o razón social"
                  autoFocus
                />
              </div>
              <div>
                <Label htmlFor="ruc_ci">RUC / CI</Label>
                <Input
                  id="ruc_ci"
                  value={newRucCi}
                  onChange={(e) => setNewRucCi(e.target.value)}
                  placeholder="Número de documento"
                />
              </div>
              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="Ej: 0981 123 456"
                />
              </div>
              <div>
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="Dirección del cliente"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button className="flex-1" onClick={handleCreateCustomer} disabled={!newName.trim()}>
                  <Check className="w-4 h-4 mr-2" />
                  Guardar
                </Button>
              </div>
            </div>
          ) : (
            /* Search and Select Customer */
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, RUC/CI o teléfono..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                />
              </div>

              <ScrollArea className="h-[250px]">
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Cargando...</div>
                ) : customers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <User className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No se encontraron clientes</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {customers.map((customer) => (
                      <button
                        key={customer.id}
                        onClick={() => handleSelect(customer)}
                        className={cn(
                          "w-full p-3 rounded-lg text-left transition-colors hover:bg-muted",
                          selectedCustomer?.id === customer.id && "bg-primary/10 border border-primary/30"
                        )}
                      >
                        <p className="font-medium text-sm">{customer.name}</p>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          {customer.ruc_ci && <span>RUC/CI: {customer.ruc_ci}</span>}
                          {customer.phone && <span>Tel: {customer.phone}</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>

              <div className="flex gap-3 pt-2 border-t">
                <Button variant="outline" className="flex-1" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button variant="secondary" className="flex-1" onClick={() => setIsCreating(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Nuevo Cliente
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
