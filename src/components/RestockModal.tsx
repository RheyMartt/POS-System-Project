import { useEffect, useState } from 'react';
import { PackagePlus, X } from 'lucide-react';
import type { InventoryItem } from '../types/pos';

interface RestockModalProps {
  item: InventoryItem | null;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirmRestock: (itemId: string, addQty: number) => void;
}

const PRESET_QTYS = [10, 25, 50, 100];

export function RestockModal({
  item,
  isSubmitting,
  onClose,
  onConfirmRestock,
}: RestockModalProps) {
  const [qtyInput, setQtyInput] = useState<string>('25');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setQtyInput('25');
      setError(null);
    }
  }, [item]);

  if (!item) return null;

  const parsedQty = parseInt(qtyInput, 10);
  const validQty = Number.isFinite(parsedQty) && parsedQty > 0 ? parsedQty : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validQty <= 0) {
      setError('Enter a restock quantity greater than 0.');
      return;
    }
    onConfirmRestock(item.item_id, validQty);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#261812]/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="restock-modal-title"
    >
      <div className="w-full max-w-[440px] bg-[#FFFDF8] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#DDD1BE] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#EAE0CE] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] text-[#1D4ED8] flex items-center justify-center shrink-0">
              <PackagePlus className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2
                id="restock-modal-title"
                className="text-base font-bold text-[#261812] truncate"
              >
                Restock {item.name}
              </h2>
              <p className="text-xs text-[#665347] font-mono-num">
                {item.item_id} · Current: {item.stock} {item.unit}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close restock modal"
            className="min-h-[44px] min-w-[44px] rounded-xl text-[#665347] hover:text-[#261812] hover:bg-[#EFE7D8] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <span className="block text-xs font-semibold text-[#665347] mb-2">
              Quick Add
            </span>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_QTYS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setQtyInput(String(preset));
                    setError(null);
                  }}
                  className={`min-h-[44px] rounded-xl border text-sm font-bold font-mono-num transition-colors ${
                    validQty === preset
                      ? 'bg-[#EFF6FF] border-[#1D4ED8] text-[#1E40AF]'
                      : 'bg-[#FFFDF8] border-[#DDD1BE] text-[#261812] hover:bg-[#F7F2E8]'
                  }`}
                >
                  +{preset}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="restock-qty-input"
              className="block text-xs font-semibold text-[#665347] mb-1.5"
            >
              Quantity to Add ({item.unit})
            </label>
            <input
              id="restock-qty-input"
              type="number"
              inputMode="numeric"
              min="1"
              step="1"
              value={qtyInput}
              onChange={(e) => {
                setQtyInput(e.target.value);
                setError(null);
              }}
              className="w-full h-12 px-3.5 rounded-xl border border-[#CFC1AA] bg-[#FFFDF8] text-[#261812] font-mono-num text-lg font-bold focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-[#1D4ED8]"
            />
          </div>

          <div className="bg-[#F7F2E8] border border-[#DDD1BE] rounded-xl px-4 py-3 flex items-center justify-between text-xs">
            <span className="font-medium text-[#665347]">New Stock Balance</span>
            <span className="font-mono-num text-sm font-bold text-[#261812] tabular-nums">
              {item.stock + validQty} {item.unit}
            </span>
          </div>

          {error && (
            <p role="alert" className="text-xs font-semibold text-rose-600">
              {error}
            </p>
          )}

          <div className="flex items-center gap-2 pt-1 pb-safe">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[48px] rounded-xl border border-[#DDD1BE] bg-[#FFFDF8] text-[#261812] font-semibold text-sm hover:bg-[#F7F2E8]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 min-h-[48px] rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-bold text-sm disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
            >
              {isSubmitting ? 'Saving...' : 'Confirm Restock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
