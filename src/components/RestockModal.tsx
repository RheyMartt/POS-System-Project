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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="restock-modal-title"
    >
      <div className="w-full max-w-[440px] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
              <PackagePlus className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2
                id="restock-modal-title"
                className="text-base font-bold text-slate-900 truncate"
              >
                Restock {item.name}
              </h2>
              <p className="text-xs text-slate-500 font-mono-num">
                {item.item_id} · Current: {item.stock} {item.unit}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close restock modal"
            className="min-h-[44px] min-w-[44px] rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <span className="block text-xs font-semibold text-slate-600 mb-2">
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
                      ? 'bg-orange-50 border-orange-500 text-orange-700'
                      : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
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
              className="block text-xs font-semibold text-slate-600 mb-1.5"
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
              className="w-full h-12 px-3.5 rounded-xl border border-slate-300 text-slate-900 font-mono-num text-lg font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between text-xs">
            <span className="font-medium text-slate-600">New Stock Balance</span>
            <span className="font-mono-num text-sm font-bold text-slate-900 tabular-nums">
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
              className="flex-1 min-h-[48px] rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-sm hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 min-h-[48px] rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Confirm Restock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
