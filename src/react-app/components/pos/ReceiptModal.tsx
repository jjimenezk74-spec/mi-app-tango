import { useState } from "react";
import {
  Dialog,
  DialogContent,
} from "@/react-app/components/ui/dialog";
import { Button } from "@/react-app/components/ui/button";
import { formatCurrency } from "@/data/products";
import { Printer, X, Check, FileText, Receipt } from "lucide-react";
import { cn } from "@/react-app/lib/utils";
import type { Product } from "@/data/products";

interface CartItem {
  product: Product;
  quantity: number;
}

type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia' | 'billetera';
type DocumentType = 'ticket' | 'factura';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: {
    items: CartItem[];
    subtotal: number;
    iva: number;
    total: number;
    paymentMethod: PaymentMethod;
    cashReceived?: number;
    change?: number;
    timestamp: Date;
    receiptNumber?: string;
    customer?: {
      id: number;
      name: string;
      ruc_ci: string | null;
      phone: string | null;
      address: string | null;
    } | null;
  };
  isReprint?: boolean;
}

const paymentLabels: Record<PaymentMethod, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  billetera: 'Billetera Electrónica',
};

export default function ReceiptModal({ isOpen, onClose, sale, isReprint = false }: ReceiptModalProps) {
  const [documentType, setDocumentType] = useState<DocumentType>('ticket');
  const receiptNumber = sale.receiptNumber || `R-${sale.timestamp.getTime().toString().slice(-8)}`;
  const isFactura = documentType === 'factura';

  const generateReceiptHTML = () => {
    const itemsHTML = sale.items.map(item => {
      if (isFactura) {
        return `
          <div style="display:flex;font-size:11px;margin-bottom:4px;">
            <span style="flex:1;color:#111827;">${item.product.name}</span>
            <span style="width:40px;text-align:center;color:#6b7280;">${item.quantity}</span>
            <span style="width:70px;text-align:right;color:#6b7280;">${formatCurrency(item.product.salePrice)}</span>
            <span style="width:70px;text-align:right;font-weight:500;color:#111827;">${formatCurrency(item.product.salePrice * item.quantity)}</span>
          </div>
        `;
      }
      return `
        <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px;">
          <span><span style="color:#6b7280;">${item.quantity}x </span><span style="color:#111827;">${item.product.name}</span></span>
          <span style="font-weight:500;color:#111827;">${formatCurrency(item.product.salePrice * item.quantity)}</span>
        </div>
      `;
    }).join('');

    const customerHTML = sale.customer ? `
      <div style="margin-top:4px;">
        <p style="font-weight:500;color:#111827;">${sale.customer.name}</p>
        ${sale.customer.ruc_ci ? `<p style="color:#6b7280;">RUC/CI: ${sale.customer.ruc_ci}</p>` : ''}
        ${isFactura && sale.customer.phone ? `<p style="color:#6b7280;">Tel: ${sale.customer.phone}</p>` : ''}
        ${isFactura && sale.customer.address ? `<p style="color:#6b7280;">Dir: ${sale.customer.address}</p>` : ''}
      </div>
    ` : '<span style="font-weight:500;color:#111827;margin-left:4px;">Consumidor Final</span>';

    const cashPaymentHTML = sale.paymentMethod === 'efectivo' && sale.cashReceived ? `
      <div style="display:flex;justify-content:space-between;font-size:12px;">
        <span style="color:#6b7280;">Recibido</span>
        <span style="color:#111827;">${formatCurrency(sale.cashReceived)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:500;">
        <span style="color:#15803d;">Vuelto</span>
        <span style="color:#15803d;">${formatCurrency(sale.change || 0)}</span>
      </div>
    ` : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${isFactura ? 'Factura' : 'Ticket'} - ${receiptNumber}</title>
        <style>
          @page { size: 80mm auto; margin: 2mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: Arial, sans-serif; 
            width: 76mm; 
            padding: 2mm;
            font-size: 12px;
            line-height: 1.4;
            color: #111827;
          }
          .divider { 
            border-bottom: 1px dashed #d1d5db; 
            margin: 8px 0; 
            padding-bottom: 8px; 
          }
        </style>
      </head>
      <body>
        <div style="text-align:center;" class="divider">
          <h1 style="font-size:18px;font-weight:bold;margin-bottom:4px;">Tango & Tereré Shop</h1>
          ${isFactura ? `
            <p style="font-size:10px;color:#6b7280;">Asunción, Paraguay</p>
            <p style="font-size:10px;color:#6b7280;">Tel: (021) 555-0123</p>
            <p style="font-size:10px;color:#6b7280;">RUC: 80000000-0</p>
          ` : ''}
          <div style="margin-top:8px;padding-top:8px;border-top:1px solid #e5e7eb;">
            <p style="font-size:13px;font-weight:bold;">${isFactura ? 'FACTURA' : 'TICKET DE VENTA'}</p>
            <p style="font-size:10px;color:#6b7280;">Nº: ${receiptNumber}</p>
            <p style="font-size:10px;color:#6b7280;">Fecha: ${sale.timestamp.toLocaleDateString('es-PY')} - ${sale.timestamp.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>

        <div class="divider" style="font-size:12px;">
          <span style="color:#6b7280;font-weight:500;">Cliente:</span>
          ${customerHTML}
        </div>

        <div class="divider">
          ${isFactura ? `
            <div style="display:flex;font-size:10px;color:#6b7280;font-weight:500;margin-bottom:4px;padding-bottom:4px;border-bottom:1px solid #e5e7eb;">
              <span style="flex:1;">Descripción</span>
              <span style="width:40px;text-align:center;">Cant.</span>
              <span style="width:70px;text-align:right;">P. Unit.</span>
              <span style="width:70px;text-align:right;">Total</span>
            </div>
          ` : ''}
          ${itemsHTML}
        </div>

        <div class="divider">
          <div style="display:flex;justify-content:space-between;font-size:12px;">
            <span style="color:#6b7280;">Subtotal</span>
            <span style="color:#111827;">${formatCurrency(sale.subtotal)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:12px;">
            <span style="color:#6b7280;">IVA (10%)</span>
            <span style="color:#111827;">${formatCurrency(sale.iva)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:bold;padding-top:8px;">
            <span style="color:#111827;">TOTAL</span>
            <span style="color:#15803d;">${formatCurrency(sale.total)}</span>
          </div>
        </div>

        <div style="margin-bottom:16px;">
          <div style="display:flex;justify-content:space-between;font-size:12px;">
            <span style="color:#6b7280;">Método de Pago</span>
            <span style="font-weight:500;color:#111827;">${paymentLabels[sale.paymentMethod]}</span>
          </div>
          ${cashPaymentHTML}
        </div>

        <div style="text-align:center;font-size:12px;color:#6b7280;">
          ${isFactura ? `
            <p style="font-size:10px;">Este documento es válido como comprobante de pago.</p>
            <p style="font-size:10px;margin-top:4px;">Conserve su factura para cualquier reclamo.</p>
          ` : `
            <p>¡Gracias por su compra!</p>
            <p style="font-size:10px;margin-top:4px;">Vuelva pronto 🧉</p>
          `}
        </div>
      </body>
      </html>
    `;
  };

  const handlePrint = () => {
    // Create hidden iframe for direct printing (no preview window)
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.style.left = '-9999px';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(generateReceiptHTML());
      iframeDoc.close();
      
      // Wait for content to render, then open print dialog directly
      setTimeout(() => {
        iframe.contentWindow?.print();
        // Remove iframe after printing
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 500);
      }, 100);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* Success Header - Screen only */}
        <div className={cn(
          "p-6 text-center text-white no-print",
          isReprint ? "bg-wood" : "bg-yerba"
        )}>
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
            <Check className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold">
            {isReprint ? "Reimprimir Comprobante" : "¡Venta Completada!"}
          </h2>
          <p className="text-white/80 text-sm">{sale.timestamp.toLocaleString('es-PY')}</p>
        </div>

        {/* Document Type Selector - Screen only */}
        <div className="p-4 border-b border-border no-print">
          <p className="text-sm font-medium mb-2 text-center">Tipo de Comprobante</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setDocumentType('ticket')}
              className={cn(
                "flex items-center justify-center gap-2 p-3 rounded-lg border transition-all",
                documentType === 'ticket'
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/50"
              )}
            >
              <Receipt className="w-5 h-5" />
              <span className="font-medium">Ticket</span>
            </button>
            <button
              onClick={() => setDocumentType('factura')}
              className={cn(
                "flex items-center justify-center gap-2 p-3 rounded-lg border transition-all",
                documentType === 'factura'
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/50"
              )}
            >
              <FileText className="w-5 h-5" />
              <span className="font-medium">Factura</span>
            </button>
          </div>
        </div>

        {/* Receipt Content - This is what prints */}
        <div className="p-6 receipt-print-area bg-white max-h-[50vh] overflow-y-auto">
          {/* Store Header */}
          <div className="text-center mb-4 pb-4 border-b border-dashed border-gray-300">
            <h3 className="font-display font-bold text-xl text-gray-900">Tango & Tereré Shop</h3>
            {isFactura && (
              <>
                <p className="text-xs text-gray-500 mt-1">Asunción, Paraguay</p>
                <p className="text-xs text-gray-500">Tel: (021) 555-0123</p>
                <p className="text-xs text-gray-500">RUC: 80000000-0</p>
              </>
            )}
            <div className="mt-3 pt-2 border-t border-gray-200">
              <p className="text-sm font-bold text-gray-900">
                {isFactura ? "FACTURA" : "TICKET DE VENTA"}
              </p>
              <p className="text-xs text-gray-500">Nº: {receiptNumber}</p>
              <p className="text-xs text-gray-500">
                Fecha: {sale.timestamp.toLocaleDateString('es-PY')} - {sale.timestamp.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="mb-4 pb-4 border-b border-dashed border-gray-300 text-sm">
            <span className="text-gray-500 font-medium">Cliente:</span>
            {sale.customer ? (
              <div className="mt-1">
                <p className="font-medium text-gray-900">{sale.customer.name}</p>
                {sale.customer.ruc_ci && <p className="text-gray-500">RUC/CI: {sale.customer.ruc_ci}</p>}
                {isFactura && sale.customer.phone && <p className="text-gray-500">Tel: {sale.customer.phone}</p>}
                {isFactura && sale.customer.address && <p className="text-gray-500">Dir: {sale.customer.address}</p>}
              </div>
            ) : (
              <span className="font-medium text-gray-900 ml-1">Consumidor Final</span>
            )}
          </div>

          {/* Items */}
          <div className="mb-4 pb-4 border-b border-dashed border-gray-300">
            {isFactura && (
              <div className="flex text-xs text-gray-500 font-medium mb-2 pb-1 border-b border-gray-200">
                <span className="flex-1">Descripción</span>
                <span className="w-12 text-center">Cant.</span>
                <span className="w-20 text-right">P. Unit.</span>
                <span className="w-20 text-right">Total</span>
              </div>
            )}
            <div className="space-y-2">
              {sale.items.map((item) => (
                <div key={item.product.id} className="flex text-sm">
                  {isFactura ? (
                    <>
                      <span className="flex-1 text-gray-900">{item.product.name}</span>
                      <span className="w-12 text-center text-gray-500">{item.quantity}</span>
                      <span className="w-20 text-right text-gray-500">{formatCurrency(item.product.salePrice)}</span>
                      <span className="w-20 text-right font-medium text-gray-900">
                        {formatCurrency(item.product.salePrice * item.quantity)}
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="flex-1">
                        <span className="text-gray-500">{item.quantity}x </span>
                        <span className="text-gray-900">{item.product.name}</span>
                      </div>
                      <span className="font-medium text-gray-900 ml-2">
                        {formatCurrency(item.product.salePrice * item.quantity)}
                      </span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-1 mb-4 pb-4 border-b border-dashed border-gray-300">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-gray-900">{formatCurrency(sale.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">IVA (10%)</span>
              <span className="text-gray-900">{formatCurrency(sale.iva)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2">
              <span className="text-gray-900">TOTAL</span>
              <span className="text-green-700">{formatCurrency(sale.total)}</span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="space-y-1 text-sm mb-6">
            <div className="flex justify-between">
              <span className="text-gray-500">Método de Pago</span>
              <span className="font-medium text-gray-900">{paymentLabels[sale.paymentMethod]}</span>
            </div>
            {sale.paymentMethod === 'efectivo' && sale.cashReceived && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-500">Recibido</span>
                  <span className="text-gray-900">{formatCurrency(sale.cashReceived)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-green-700">Vuelto</span>
                  <span className="text-green-700">{formatCurrency(sale.change || 0)}</span>
                </div>
              </>
            )}
          </div>

          {/* Thank You / Legal */}
          <div className="text-center text-sm text-gray-500">
            {isFactura ? (
              <>
                <p className="text-xs">Este documento es válido como comprobante de pago.</p>
                <p className="text-xs mt-1">Conserve su factura para cualquier reclamo.</p>
              </>
            ) : (
              <>
                <p>¡Gracias por su compra!</p>
                <p className="text-xs mt-1">Vuelva pronto 🧉</p>
              </>
            )}
          </div>
        </div>

        {/* Actions - Screen only */}
        <div className="p-4 border-t border-border no-print">
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              <X className="w-4 h-4 mr-2" />
              Cerrar
            </Button>
            <Button onClick={handlePrint} className="flex-1">
              <Printer className="w-4 h-4 mr-2" />
              Imprimir {isFactura ? "Factura" : "Ticket"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
