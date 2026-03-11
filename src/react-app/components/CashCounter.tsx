import { useState, useEffect } from "react";
import { Input } from "@/react-app/components/ui/input";
import { formatCurrency } from "@/data/products";

// Paraguayan Guaraní denominations
const DENOMINATIONS = [
  { value: 100000, label: "100.000", type: "bill" },
  { value: 50000, label: "50.000", type: "bill" },
  { value: 20000, label: "20.000", type: "bill" },
  { value: 10000, label: "10.000", type: "bill" },
  { value: 5000, label: "5.000", type: "bill" },
  { value: 2000, label: "2.000", type: "bill" },
  { value: 1000, label: "1.000", type: "coin" },
  { value: 500, label: "500", type: "coin" },
  { value: 100, label: "100", type: "coin" },
  { value: 50, label: "50", type: "coin" },
];

export interface DenominationCount {
  [value: number]: number;
}

interface CashCounterProps {
  onChange: (total: number, counts: DenominationCount) => void;
  initialCounts?: DenominationCount;
}

export default function CashCounter({ onChange, initialCounts }: CashCounterProps) {
  const [counts, setCounts] = useState<DenominationCount>(() => {
    if (initialCounts) return initialCounts;
    const initial: DenominationCount = {};
    DENOMINATIONS.forEach(d => { initial[d.value] = 0; });
    return initial;
  });

  useEffect(() => {
    const total = DENOMINATIONS.reduce((sum, d) => sum + (counts[d.value] || 0) * d.value, 0);
    onChange(total, counts);
  }, [counts, onChange]);

  const handleCountChange = (value: number, count: string) => {
    const numCount = parseInt(count) || 0;
    setCounts(prev => ({ ...prev, [value]: Math.max(0, numCount) }));
  };

  const getSubtotal = (value: number) => (counts[value] || 0) * value;

  const bills = DENOMINATIONS.filter(d => d.type === "bill");
  const coins = DENOMINATIONS.filter(d => d.type === "coin");

  const totalBills = bills.reduce((sum, d) => sum + getSubtotal(d.value), 0);
  const totalCoins = coins.reduce((sum, d) => sum + getSubtotal(d.value), 0);
  const grandTotal = totalBills + totalCoins;

  return (
    <div className="space-y-4">
      {/* Bills */}
      <div>
        <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
          <span className="w-4 h-3 bg-yerba/30 rounded-sm"></span>
          Billetes
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {bills.map(d => (
            <div 
              key={d.value} 
              className="flex items-center gap-2 p-2 rounded-lg bg-yerba/5 border border-yerba/20"
            >
              <span className="text-sm font-medium w-16 text-yerba">₲ {d.label}</span>
              <span className="text-muted-foreground">×</span>
              <Input
                type="number"
                min="0"
                value={counts[d.value] || ""}
                onChange={(e) => handleCountChange(d.value, e.target.value)}
                className="w-16 h-8 text-center p-1"
                placeholder="0"
              />
              <span className="text-xs text-muted-foreground ml-auto">
                {getSubtotal(d.value) > 0 && formatCurrency(getSubtotal(d.value))}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 text-right text-sm">
          <span className="text-muted-foreground">Subtotal billetes: </span>
          <span className="font-semibold text-yerba">{formatCurrency(totalBills)}</span>
        </div>
      </div>

      {/* Coins */}
      <div>
        <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
          <span className="w-3 h-3 bg-gold/50 rounded-full"></span>
          Monedas
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {coins.map(d => (
            <div 
              key={d.value} 
              className="flex items-center gap-2 p-2 rounded-lg bg-gold/5 border border-gold/20"
            >
              <span className="text-sm font-medium w-16 text-amber-700">₲ {d.label}</span>
              <span className="text-muted-foreground">×</span>
              <Input
                type="number"
                min="0"
                value={counts[d.value] || ""}
                onChange={(e) => handleCountChange(d.value, e.target.value)}
                className="w-16 h-8 text-center p-1"
                placeholder="0"
              />
              <span className="text-xs text-muted-foreground ml-auto">
                {getSubtotal(d.value) > 0 && formatCurrency(getSubtotal(d.value))}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 text-right text-sm">
          <span className="text-muted-foreground">Subtotal monedas: </span>
          <span className="font-semibold text-amber-700">{formatCurrency(totalCoins)}</span>
        </div>
      </div>

      {/* Grand Total */}
      <div className="p-3 rounded-lg bg-wood/10 border border-wood/30">
        <div className="flex justify-between items-center">
          <span className="font-semibold">TOTAL CONTADO</span>
          <span className="text-xl font-bold text-wood">{formatCurrency(grandTotal)}</span>
        </div>
      </div>
    </div>
  );
}
