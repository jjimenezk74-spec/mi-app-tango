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
import { Search, Truck, UserPlus, X, Check } from "lucide-react";
import { cn } from "@/react-app/lib/utils";

export interface Supplier {
  id: number;
  name: string;
  ruc: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  contact_name: string | null;
}

interface SupplierSelectorProps {
  selectedSupplier: Supplier | null;
  onSelect: (supplier: Supplier | null) => void;
}

export default function SupplierSelector({ selectedSupplier, onSelect }: SupplierSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // New supplier form
  const [newName, setNewName] = useState("");
  const [newRuc, setNewRuc] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newContactName, setNewContactName] = useState("");

  const fetchSuppliers = useCallback(async (searchTerm: string) => {
    setIsLoading(true);
    try {
      const url = searchTerm 
        ? `/api/suppliers?search=${encodeURIComponent(searchTerm)}`
        : '/api/suppliers';
      const res = await fetch(url, { credentials: "include" });
      const data = await res.json();
      setSuppliers(data);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && !isCreating) {
      fetchSuppliers(search);
    }
  }, [isOpen, isCreating, search, fetchSuppliers]);

  const handleSelect = (supplier: Supplier) => {
    onSelect(supplier);
    setIsOpen(false);
    setSearch("");
  };

  const handleClear = () => {
    onSelect(null);
  };

  const handleCreateSupplier = async () => {
    if (!newName.trim()) return;

    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify({
          name: newName.trim(),
          ruc: newRuc.trim() || null,
          phone: newPhone.trim() || null,
          address: newAddress.trim() || null,
          contact_name: newContactName.trim() || null,
        }),
      });

      const data = await res.json();
      if (data.success && data.supplier) {
        onSelect(data.supplier);
        setIsOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error("Error creating supplier:", error);
    }
  };

  const resetForm = () => {
    setNewName("");
    setNewRuc("");
    setNewPhone("");
    setNewAddress("");
    setNewContactName("");
    setIsCreating(false);
    setSearch("");
  };

  const handleClose = () => {
    setIsOpen(false);
    resetForm();
  };

  return (
    <>
      {/* Supplier Display / Selector Button */}
      <div>
        <Label className="text-sm mb-1.5 block">Proveedor</Label>
        {selectedSupplier ? (
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-yerba/10 border border-yerba/30">
            <div className="flex items-center gap-2 min-w-0">
              <Truck className="w-4 h-4 text-yerba shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{selectedSupplier.name}</p>
                {selectedSupplier.ruc && (
                  <p className="text-xs text-muted-foreground">RUC: {selectedSupplier.ruc}</p>
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
            <Truck className="w-4 h-4 mr-2" />
            Seleccionar proveedor
          </Button>
        )}
      </div>

      {/* Supplier Selection Dialog */}
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isCreating ? "Nuevo Proveedor" : "Seleccionar Proveedor"}</DialogTitle>
          </DialogHeader>

          {isCreating ? (
            /* Create Supplier Form */
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre / Razón Social *</Label>
                <Input
                  id="name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nombre del proveedor"
                  autoFocus
                />
              </div>
              <div>
                <Label htmlFor="ruc">RUC</Label>
                <Input
                  id="ruc"
                  value={newRuc}
                  onChange={(e) => setNewRuc(e.target.value)}
                  placeholder="Número de RUC"
                />
              </div>
              <div>
                <Label htmlFor="contact_name">Persona de Contacto</Label>
                <Input
                  id="contact_name"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  placeholder="Nombre del contacto"
                />
              </div>
              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="Ej: 021 123 456"
                />
              </div>
              <div>
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="Dirección del proveedor"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button 
                  className="flex-1 bg-yerba hover:bg-yerba-600" 
                  onClick={handleCreateSupplier} 
                  disabled={!newName.trim()}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Guardar
                </Button>
              </div>
            </div>
          ) : (
            /* Search and Select Supplier */
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, RUC o teléfono..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                />
              </div>

              <ScrollArea className="h-[250px]">
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Cargando...</div>
                ) : suppliers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Truck className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No se encontraron proveedores</p>
                    {search && <p className="text-xs mt-1">Podés crear uno nuevo</p>}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {suppliers.map((supplier) => (
                      <button
                        key={supplier.id}
                        onClick={() => handleSelect(supplier)}
                        className={cn(
                          "w-full p-3 rounded-lg text-left transition-colors hover:bg-muted",
                          selectedSupplier?.id === supplier.id && "bg-yerba/10 border border-yerba/30"
                        )}
                      >
                        <p className="font-medium text-sm">{supplier.name}</p>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          {supplier.ruc && <span>RUC: {supplier.ruc}</span>}
                          {supplier.phone && <span>Tel: {supplier.phone}</span>}
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
                <Button 
                  variant="secondary" 
                  className="flex-1" 
                  onClick={() => setIsCreating(true)}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Nuevo Proveedor
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
