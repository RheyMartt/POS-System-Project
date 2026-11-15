import { CheckCircle2, X } from 'lucide-react';
import type { OrderRecord } from '../types/pos';
import { formatPeso, formatPesoCompact } from '../utils/posLogic';

interface ReceiptModalProps {
  order: OrderRecord | null;
  isFromHistory?: boolean;
  onClose: () => void;
}

export function ReceiptModal({
  order,
  isFromHistory = false,
  onClose,
}: ReceiptModalProps) {
  if (!order) return null;

  const formattedDate = (() => {
    const d = new Date(order.created_at);
    if (Number.isNaN(d.getTime())) return order.created_at;
    return d.toLocaleString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  })();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/55 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-modal-title"
    >
      <div className="w-full max-w-[400px] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-2 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="receipt-modal-title"
                className="text-base font-bold text-slate-900"
              >
                Digital Receipt
              </h2>
              <p className="text-xs text-slate-500">
                Kanto Siomai Stall
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Dismiss receipt"
            className="min-h-[44px] min-w-[44px] -mr-2 -mt-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Order #</span>
              <span className="font-mono-num font-bold text-slate-900 text-sm">
                {order.order_id}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Date & Time</span>
              <span className="text-slate-700 font-medium tabular-nums">
                {formattedDate}
              </span>
            </div>

            <div className="border-t border-dashed border-slate-300 pt-3 space-y-2">
              {order.line_items && order.line_items.length > 0 ? (
                order.line_items.map((line, i) => (
                  <div
                    key={`${line.menu_item_id}-${i}`}
                    className="flex items-start justify-between gap-3 text-sm"
                  >
                    <div className="min-w-0">
                      <span className="font-semibold text-slate-900">
                        {line.qty}x {line.name}
                      </span>
                      {line.unit_price > 0 && (
                        <span className="block text-[11px] text-slate-500 font-mono-num">
                          @ {formatPesoCompact(line.unit_price)}
                        </span>
                      )}
                    </div>
                    {line.line_total > 0 && (
                      <span className="font-mono-num font-semibold text-slate-900 shrink-0">
                        {formatPeso(line.line_total)}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-800 font-medium">
                  {order.items}
                </p>
              )}
            </div>

            <div className="border-t border-dashed border-slate-300 pt-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">Total</span>
                <span className="font-mono-num text-xl font-extrabold text-slate-900">
                  {formatPeso(order.total_amount)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500 font-medium">Payment Method</span>
                <span
                  className={`font-bold ${
                    order.payment_method === 'GCash'
                      ? 'text-[#007DFE]'
                      : 'text-emerald-700'
                  }`}
                >
                  {order.payment_method}
                </span>
              </div>

              {order.payment_method === 'GCash' ? (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">GCash Ref #</span>
                  <span className="font-mono-num font-bold text-slate-900">
                    {order.gcash_ref || '—'}
                  </span>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Cash Tendered</span>
                    <span className="font-mono-num font-semibold text-slate-800">
                      {formatPeso(order.amount_tendered)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Change Due</span>
                    <span className="font-mono-num font-bold text-emerald-700">
                      {formatPeso(order.change_due)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="px-5 pb-5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[48px] rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            {isFromHistory ? 'Close Receipt' : 'Done / New Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
