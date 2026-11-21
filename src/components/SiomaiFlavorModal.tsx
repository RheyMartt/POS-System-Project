import { X } from 'lucide-react';
import type { InventoryItem, MenuItem } from '../types/pos';
import { formatPesoCompact } from '../utils/posLogic';

export interface SiomaiFlavorOption {
  inv_id: string;
  name: string;
  shortName: string;
}

export const SIOMAI_FLAVOR_OPTIONS: SiomaiFlavorOption[] = [
  { inv_id: 'INV-1', name: 'Pork Siomai', shortName: 'Pork' },
  { inv_id: 'INV-2', name: 'Beef Siomai', shortName: 'Beef' },
  { inv_id: 'INV-3', name: 'Chicken Siomai', shortName: 'Chicken' },
  { inv_id: 'INV-4', name: 'Japanese Siomai', shortName: 'Japanese' },
  { inv_id: 'INV-5', name: 'Gyoza', shortName: 'Gyoza' },
];

interface SiomaiFlavorModalProps {
  item: MenuItem | null;
  inventory: InventoryItem[];
  onClose: () => void;
  onSelectFlavor: (item: MenuItem, flavor: SiomaiFlavorOption) => void;
}

export function SiomaiFlavorModal({
  item,
  inventory,
  onClose,
  onSelectFlavor,
}: SiomaiFlavorModalProps) {
  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#261812]/55 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="siomai-flavor-modal-title"
    >
      <div className="w-full max-w-[440px] bg-[#FFFDF8] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#DDD1BE] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#DDD1BE] flex items-center justify-between gap-2 shrink-0">
          <div>
            <h2
              id="siomai-flavor-modal-title"
              className="text-base font-extrabold text-[#261812]"
            >
              Choose Siomai Flavor
            </h2>
            <p className="text-xs text-[#665347] mt-0.5">
              Select 4 pcs siomai for{' '}
              <strong className="text-[#261812]">{item.name}</strong> (
              {formatPesoCompact(item.price)})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close flavor selector"
            className="min-h-[44px] min-w-[44px] rounded-xl text-[#665347] hover:text-[#261812] hover:bg-[#EFE7D8] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Flavors List */}
        <div className="p-4 space-y-2.5 max-h-[70vh] overflow-y-auto pb-safe">
          {SIOMAI_FLAVOR_OPTIONS.map((flavor) => {
            const inv = inventory.find((i) => i.item_id === flavor.inv_id);
            const stock = inv ? Math.max(0, inv.stock) : 0;
            const servings = Math.floor(stock / 4);
            const isOutOfStock = stock < 4;

            return (
              <button
                key={flavor.inv_id}
                type="button"
                disabled={isOutOfStock}
                onClick={() => onSelectFlavor(item, flavor)}
                className={`w-full min-h-[56px] px-4 py-3 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] ${
                  isOutOfStock
                    ? 'bg-[#F7F2E8] border-[#E2D6C3] text-[#A39284] cursor-not-allowed opacity-60'
                    : 'bg-[#FFFDF8] border-[#DDD1BE] hover:border-[#1D4ED8] hover:bg-[#EFF6FF] text-[#261812] shadow-2xs'
                }`}
              >
                <div>
                  <p className="text-sm font-extrabold text-[#261812]">
                    {flavor.name}
                  </p>
                  <p className="text-[11px] text-[#665347] font-medium">
                    4 pcs per order
                  </p>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold tabular-nums border ${
                    isOutOfStock
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : servings <= 5
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-[#EFE7D8] text-[#261812] border-[#DDD1BE]'
                  }`}
                >
                  {isOutOfStock
                    ? 'Out of stock'
                    : `${stock} pcs left (${servings} servings)`}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
