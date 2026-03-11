import { useState, useEffect, useCallback } from "react";
import MainLayout from "@/react-app/components/layout/MainLayout";
import { authFetch } from "@/react-app/contexts/AuthContext";
import { Card } from "@/react-app/components/ui/card";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { Label } from "@/react-app/components/ui/label";
import { Textarea } from "@/react-app/components/ui/textarea";
import { 
  LockOpen, 
  Lock, 
  Plus, 
  Minus,
  DollarSign,
  History
} from "lucide-react";
import { formatCurrency } from "@/data/products";
import CashCounter from "@/react-app/components/CashCounter";

interface CashSession {
  id: number;
  user_id: number;
  user_name: string;
  opening_amount: number;
  closing_amount: number | null;
  expected_amount: number | null;
  difference: number | null;
  status: 'open' | 'closed';
  notes: string | null;
  opened_at: string;
  closed_at: string | null;
}

interface CashMovement {
  id: number;
  session_id: number;
  movement_type: string;
  amount: number;
  description: string | null;
  sale_id: number | null;
  user_name: string;
  created_at: string;
}

interface ExpenseCategory {
  id: number;
  name: string;
  category_type: string;
  is_active: number;
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('es-PY', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('es-PY', { 
    hour: '2-digit', 
    minute: '2-digit'
  });
}

const movementTypeLabels: Record<string, string> = {
  'venta_efectivo': 'Venta en Efectivo',
  'ingreso': 'Ingreso',
  'egreso': 'Egreso',
  'retiro': 'Egreso',
};

const movementTypeIcons: Record<string, React.ReactNode> = {
  'venta_efectivo': <DollarSign className="w-4 h-4 text-green-500" />,
  'ingreso': <Plus className="w-4 h-4 text-blue-500" />,
  'egreso': <Minus className="w-4 h-4 text-red-500" />,
  'retiro': <Minus className="w-4 h-4 text-red-500" />,
};

export default function CajaPage() {
  const [currentSession, setCurrentSession] = useState<CashSession | null>(null);
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [sessionHistory, setSessionHistory] = useState<CashSession[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [openingAmount, setOpeningAmount] = useState(0);
  const [openingNotes, setOpeningNotes] = useState("");
  const [closingAmount, setClosingAmount] = useState(0);
  const [closingNotes, setClosingNotes] = useState("");
  const [movementType, setMovementType] = useState<'ingreso' | 'egreso'>('ingreso');
  const [movementAmount, setMovementAmount] = useState("");
  const [movementDescription, setMovementDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null);
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);

  // Callbacks for CashCounter
  const handleOpeningAmountChange = useCallback((total: number) => {
    setOpeningAmount(total);
  }, []);

  const handleClosingAmountChange = useCallback((total: number) => {
    setClosingAmount(total);
  }, []);

  useEffect(() => {
    fetchCurrentSession();
    fetchHistory();
    fetchExpenseCategories();
  }, []);

  async function fetchCurrentSession() {
    setLoading(true);
    try {
      const res = await authFetch("/api/cash-sessions/current");
      const data = await res.json();
      setCurrentSession(data.session);
      setMovements(data.movements || []);
    } catch (error) {
      console.error("Error fetching current session:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchHistory() {
    try {
      const res = await authFetch("/api/cash-sessions?limit=20");
      const data = await res.json();
      setSessionHistory(data);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  }

  async function fetchExpenseCategories() {
    try {
      const res = await authFetch("/api/expense-categories");
      const data = await res.json();
      setExpenseCategories(data);
    } catch (error) {
      console.error("Error fetching expense categories:", error);
    }
  }

  async function handleCreateCategory() {
    if (!newCategoryName.trim()) {
      alert("Ingrese un nombre para la categoría");
      return;
    }
    
    const categoryType = movementType === 'ingreso' ? 'ingreso' : 'operativo';
    
    try {
      const res = await authFetch("/api/expense-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName.trim(), category_type: categoryType }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Error al crear categoría");
        return;
      }
      
      const newCat = await res.json();
      setExpenseCategories([...expenseCategories, newCat]);
      setSelectedCategory(newCat);
      setNewCategoryName("");
      setShowNewCategoryForm(false);
    } catch (error) {
      alert("Error de conexión");
    }
  }

  async function handleOpenSession() {
    try {
      const res = await authFetch("/api/cash-sessions/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opening_amount: openingAmount, notes: openingNotes || null }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Error al abrir caja");
        return;
      }
      
      setOpeningAmount(0);
      setOpeningNotes("");
      setShowOpenModal(false);
      fetchCurrentSession();
      fetchHistory();
    } catch (error) {
      alert("Error de conexión");
    }
  }

  async function handleCloseSession() {
    if (!currentSession) return;
    
    try {
      const res = await authFetch(`/api/cash-sessions/${currentSession.id}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ closing_amount: closingAmount, notes: closingNotes || null }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Error al cerrar caja");
        return;
      }
      
      setClosingAmount(0);
      setClosingNotes("");
      setShowCloseModal(false);
      fetchCurrentSession();
      fetchHistory();
    } catch (error) {
      alert("Error de conexión");
    }
  }

  async function handleAddMovement() {
    if (!currentSession) return;
    
    const amount = parseInt(movementAmount) || 0;
    if (amount <= 0) {
      alert("Ingrese un monto válido");
      return;
    }

    // Require a category for both ingreso and egreso
    if (!selectedCategory) {
      alert("Seleccione una categoría");
      return;
    }
    
    // Build description with category name
    let description = selectedCategory.name + (movementDescription ? ` - ${movementDescription}` : '');
    
    try {
      const res = await authFetch("/api/cash-movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: currentSession.id,
          movement_type: movementType,
          amount,
          description: description || null,
          invoice_number: movementType === 'egreso' ? (invoiceNumber || null) : null,
        }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Error al registrar movimiento");
        return;
      }
      
      setMovementAmount("");
      setMovementDescription("");
      setSelectedCategory(null);
      setInvoiceNumber("");
      setShowMovementModal(false);
      fetchCurrentSession();
    } catch (error) {
      alert("Error de conexión");
    }
  }

  // Calculate current totals
  const calculateCurrentCash = () => {
    if (!currentSession) return 0;
    let total = currentSession.opening_amount;
    for (const m of movements) {
      if (m.movement_type === 'venta_efectivo' || m.movement_type === 'ingreso') {
        total += m.amount;
      } else if (m.movement_type === 'retiro' || m.movement_type === 'egreso') {
        total -= m.amount;
      }
    }
    return total;
  };

  const totalIngresos = movements
    .filter(m => m.movement_type === 'venta_efectivo' || m.movement_type === 'ingreso')
    .reduce((sum, m) => sum + m.amount, 0);
    
  const totalEgresos = movements
    .filter(m => m.movement_type === 'retiro' || m.movement_type === 'egreso')
    .reduce((sum, m) => sum + m.amount, 0);

  if (loading) {
    return (
      <MainLayout title="Caja" subtitle="Apertura y cierre de caja">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yerba"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Caja" subtitle="Apertura y cierre de caja">
      <div className="space-y-6">
        {/* Current Session Status */}
        {currentSession ? (
          <Card className="p-6 border-yerba/30 bg-gradient-to-br from-yerba/5 to-transparent">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-yerba/20 flex items-center justify-center">
                  <LockOpen className="w-6 h-6 text-yerba" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-yerba">Caja Abierta</h2>
                  <p className="text-sm text-muted-foreground">
                    Abierta por {currentSession.user_name} • {formatDateTime(currentSession.opened_at)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => { setMovementType('ingreso'); setShowMovementModal(true); }}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" /> Ingreso
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => { setMovementType('egreso'); setShowMovementModal(true); }}
                  className="gap-2"
                >
                  <Minus className="w-4 h-4" /> Egreso
                </Button>
                <Button 
                  onClick={() => setShowCloseModal(true)}
                  className="gap-2 bg-wood hover:bg-wood/90"
                >
                  <Lock className="w-4 h-4" /> Cerrar Caja
                </Button>
              </div>
            </div>

            {/* Session Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="p-4 rounded-lg bg-background">
                <p className="text-sm text-muted-foreground">Apertura</p>
                <p className="text-xl font-bold">{formatCurrency(currentSession.opening_amount)}</p>
              </div>
              <div className="p-4 rounded-lg bg-green-500/10">
                <p className="text-sm text-green-600">Ingresos</p>
                <p className="text-xl font-bold text-green-600">+{formatCurrency(totalIngresos)}</p>
              </div>
              <div className="p-4 rounded-lg bg-red-500/10">
                <p className="text-sm text-red-600">Egresos</p>
                <p className="text-xl font-bold text-red-600">-{formatCurrency(totalEgresos)}</p>
              </div>
              <div className="p-4 rounded-lg bg-yerba/10">
                <p className="text-sm text-yerba">Efectivo Esperado</p>
                <p className="text-xl font-bold text-yerba">{formatCurrency(calculateCurrentCash())}</p>
              </div>
            </div>

            {/* Movements List */}
            {movements.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold mb-3">Movimientos del Turno</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {movements.map((m) => (
                    <div 
                      key={m.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-background border border-border/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          {movementTypeIcons[m.movement_type]}
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {movementTypeLabels[m.movement_type] || m.movement_type}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatTime(m.created_at)}
                            {m.description && ` • ${m.description}`}
                          </p>
                        </div>
                      </div>
                      <p className={`font-semibold ${
                        (m.movement_type === 'retiro' || m.movement_type === 'egreso') ? 'text-red-500' : 'text-green-500'
                      }`}>
                        {(m.movement_type === 'retiro' || m.movement_type === 'egreso') ? '-' : '+'}{formatCurrency(m.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        ) : (
          <Card className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold mb-2">Caja Cerrada</h2>
            <p className="text-muted-foreground mb-6">
              No hay una caja abierta. Inicie un nuevo turno para comenzar a registrar ventas.
            </p>
            <Button 
              onClick={() => setShowOpenModal(true)}
              className="gap-2 bg-yerba hover:bg-yerba/90"
              size="lg"
            >
              <LockOpen className="w-5 h-5" /> Abrir Caja
            </Button>
          </Card>
        )}

        {/* Session History */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <History className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold text-lg">Historial de Cajas</h3>
          </div>
          
          {sessionHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Fecha</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Usuario</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Apertura</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Cierre</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Diferencia</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {sessionHistory.map((s) => (
                    <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-3 px-4 text-sm">{formatDateTime(s.opened_at)}</td>
                      <td className="py-3 px-4 text-sm">{s.user_name}</td>
                      <td className="py-3 px-4 text-sm text-right">{formatCurrency(s.opening_amount)}</td>
                      <td className="py-3 px-4 text-sm text-right">
                        {s.closing_amount !== null ? formatCurrency(s.closing_amount) : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-right">
                        {s.difference !== null ? (
                          <span className={
                            s.difference === 0 ? 'text-green-500' : 
                            s.difference > 0 ? 'text-blue-500' : 'text-red-500'
                          }>
                            {s.difference > 0 ? '+' : ''}{formatCurrency(s.difference)}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {s.status === 'open' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-yerba/10 text-yerba">
                            <LockOpen className="w-3 h-3" /> Abierta
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground">
                            <Lock className="w-3 h-3" /> Cerrada
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay historial de cajas
            </div>
          )}
        </Card>
      </div>

      {/* Open Session Modal */}
      {showOpenModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <LockOpen className="w-5 h-5 text-yerba" /> Abrir Caja - Conteo Inicial
            </h3>
            <div className="space-y-4">
              <CashCounter 
                onChange={handleOpeningAmountChange} 
              />
              <div>
                <Label>Notas (opcional)</Label>
                <Textarea
                  placeholder="Observaciones al abrir..."
                  value={openingNotes}
                  onChange={(e) => setOpeningNotes(e.target.value)}
                  className="mt-1"
                  rows={2}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowOpenModal(false)}>Cancelar</Button>
              <Button onClick={handleOpenSession} className="bg-yerba hover:bg-yerba/90">
                Abrir Caja
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Close Session Modal */}
      {showCloseModal && currentSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-wood" /> Cerrar Caja - Conteo Final
            </h3>
            
            <div className="p-4 rounded-lg bg-yerba/10 border border-yerba/30 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Efectivo esperado:</span>
                <span className="font-bold text-yerba text-lg">{formatCurrency(calculateCurrentCash())}</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <CashCounter 
                onChange={handleClosingAmountChange} 
              />
              
              {closingAmount > 0 && (
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Diferencia:</span>
                    <span className={`font-bold ${
                      closingAmount - calculateCurrentCash() === 0 ? 'text-green-500' :
                      closingAmount - calculateCurrentCash() > 0 ? 'text-blue-500' : 
                      'text-red-500'
                    }`}>
                      {closingAmount - calculateCurrentCash() > 0 ? '+' : ''}
                      {formatCurrency(closingAmount - calculateCurrentCash())}
                    </span>
                  </div>
                </div>
              )}
              
              <div>
                <Label>Notas (opcional)</Label>
                <Textarea
                  placeholder="Observaciones al cerrar..."
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  className="mt-1"
                  rows={2}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowCloseModal(false)}>Cancelar</Button>
              <Button onClick={handleCloseSession} className="bg-wood hover:bg-wood/90">
                Cerrar Caja
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Add Movement Modal */}
      {showMovementModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              {movementType === 'ingreso' ? (
                <><Plus className="w-5 h-5 text-blue-500" /> Registrar Ingreso</>
              ) : (
                <><Minus className="w-5 h-5 text-red-500" /> Registrar Egreso</>
              )}
            </h3>
            <div className="space-y-4">
              {/* Category Selection */}
              <div>
                <Label className="mb-2 block">
                  {movementType === 'ingreso' ? 'Tipo de Ingreso' : 'Categoría de Gasto'}
                </Label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                  {expenseCategories
                    .filter(cat => 
                      movementType === 'ingreso' 
                        ? cat.category_type === 'ingreso' 
                        : cat.category_type !== 'ingreso'
                    )
                    .map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`p-3 text-sm rounded-lg border text-left transition-all ${
                          selectedCategory?.id === cat.id
                            ? movementType === 'ingreso'
                              ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                              : 'border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                            : 'border-border hover:bg-muted'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))
                  }
                  {/* Add new category button */}
                  <button
                    type="button"
                    onClick={() => setShowNewCategoryForm(true)}
                    className="p-3 text-sm rounded-lg border border-dashed border-muted-foreground/50 text-muted-foreground hover:bg-muted hover:border-muted-foreground transition-all flex items-center justify-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Nueva
                  </button>
                </div>
                
                {/* New category inline form */}
                {showNewCategoryForm && (
                  <div className="mt-3 p-3 rounded-lg border border-yerba/30 bg-yerba/5">
                    <Label className="text-sm mb-1 block">Nueva categoría</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nombre de la categoría"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
                        className="flex-1"
                        autoFocus
                      />
                      <Button 
                        size="sm" 
                        onClick={handleCreateCategory}
                        className="bg-yerba hover:bg-yerba/90"
                      >
                        Crear
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => { setShowNewCategoryForm(false); setNewCategoryName(""); }}
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <Label>Monto</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={movementAmount}
                  onChange={(e) => setMovementAmount(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Descripción (opcional)</Label>
                <Input
                  placeholder="Detalle adicional..."
                  value={movementDescription}
                  onChange={(e) => setMovementDescription(e.target.value)}
                  className="mt-1"
                />
              </div>
              {movementType === 'egreso' && (
                <div>
                  <Label>Nº Nota/Factura (opcional)</Label>
                  <Input
                    placeholder="Ej: 001-001-0001234"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="mt-1"
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => { setShowMovementModal(false); setSelectedCategory(null); setShowNewCategoryForm(false); setNewCategoryName(""); setInvoiceNumber(""); }}>Cancelar</Button>
              <Button 
                onClick={handleAddMovement} 
                disabled={!selectedCategory}
                className={movementType === 'ingreso' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-red-500 hover:bg-red-600'}
              >
                Registrar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </MainLayout>
  );
}
