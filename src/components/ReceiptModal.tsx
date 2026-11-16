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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#261812]/55 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-modal-title"
    >
      <div className="w-full max-w-[400px] bg-[#FFFDF8] rounded-3xl shadow-2xl border border-[#DDD1BE] overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-2 border-b border-[#EAE0CE]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="receipt-modal-title"
                className="text-base font-bold text-[#261812]"
              >
                Digital Receipt
              </h2>
              <p className="text-xs text-[#665347]">
                Kanto Siomai Stall
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Dismiss receipt"
            className="min-h-[44px] min-w-[44px] -mr-2 -mt-2 rounded-xl text-[#665347] hover:text-[#261812] hover:bg-[#EFE7D8] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          <div className="bg-[#F7F2E8] border border-[#DDD1BE] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#665347] font-medium">Order #</span>
              <span className="font-mono-num font-bold text-[#261812] text-sm">
                {order.order_id}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#665347] font-medium">Date & Time</span>
              <span className="text-[#261812] font-medium tabular-nums">
                {formattedDate}
              </span>
            </div>

            <div className="border-t border-dashed border-[#CFC1AA] pt-3 space-y-2">
              {order.line_items && order.line_items.length > 0 ? (
                order.line_items.map((line, i) => (
                  <div
                    key={`${line.menu_item_id}-${i}`}
                    className="flex items-start justify-between gap-3 text-sm"
                  >
                    <div className="min-w-0">
                      <span className="font-semibold text-[#261812]">
                        {line.qty}x {line.name}
                      </span>
                      {line.unit_price > 0 && (
                        <span className="block text-[11px] text-[#665347] font-mono-num">
                          @ {formatPesoCompact(line.unit_price)}
                        </span>
                      )}
                    </div>
                    {line.line_total > 0 && (
                      <span className="font-mono-num font-semibold text-[#261812] shrink-0">
                        {formatPeso(line.line_total)}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#261812] font-medium">
                  {order.items}
                </p>
              )}
            </div>

            <div className="border-t border-dashed border-[#CFC1AA] pt-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#261812]">Total</span>
                <span className="font-mono-num text-xl font-extrabold text-[#261812]">
                  {formatPeso(order.total_amount)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-[#665347] font-medium">Payment Method</span>
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
                  <span className="text-[#665347] font-medium">GCash Ref #</span>
                  <span className="font-mono-num font-bold text-[#261812]">
                    {order.gcash_ref || '—'}
                  </span>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#665347] font-medium">Cash Tendered</span>
                    <span className="font-mono-num font-semibold text-[#261812]">
                      {formatPeso(order.amount_tendered)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#665347] font-medium">Change Due</span>
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
            className="w-full min-h-[48px] rounded-2xl bg-[#2C1B14] hover:bg-[#3D261D] text-[#FFFDF8] font-bold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
          >
            {isFromHistory ? 'Close Receipt' : 'Done / New Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
