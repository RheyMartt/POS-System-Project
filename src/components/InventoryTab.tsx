import { AlertTriangle, CheckCircle2, PackagePlus } from 'lucide-react';
import type { InventoryItem } from '../types/pos';
import { getStockStatus } from '../utils/posLogic';

interface InventoryTabProps {
  inventory: InventoryItem[];
  onOpenRestock: (item: InventoryItem) => void;
}

export function InventoryTab({ inventory, onOpenRestock }: InventoryTabProps) {
  const lowCount = inventory.filter(
    (item) => getStockStatus(item.stock, item.low_stock_alert) !== 'ok',
  ).length;

  return (
    <div className="pb-24 px-4 pt-4 space-y-4">
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#261812]">
            Inventory
          </h1>
          <p className="text-xs text-[#665347] mt-0.5">
            Countable stall stock · Auto-deducted per order
          </p>
        </div>
        <span className="text-xs font-semibold text-[#665347] whitespace-nowrap shrink-0 tabular-nums">
          {lowCount > 0 ? `${lowCount} low alert` : 'All stocked'}
        </span>
      </div>

      <div className="space-y-3">
        {inventory.map((item) => {
          const status = getStockStatus(item.stock, item.low_stock_alert);
          const ratio =
            item.low_stock_alert > 0
              ? Math.min(100, Math.round((item.stock / (item.low_stock_alert * 2)) * 100))
              : 100;

          return (
            <div
              key={item.item_id}
              data-testid={`inventory-card-${item.item_id}`}
              className="bg-[#FFFDF8] rounded-2xl border border-[#DDD1BE] p-4 shadow-2xs space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-bold text-[#261812]">
                      {item.name}
                    </h2>
                    <span className="font-mono-num text-xs font-medium text-[#756256]">
                      {item.item_id}
                    </span>
                  </div>
                  <p className="text-xs text-[#665347] mt-0.5 tabular-nums">
                    Low alert below {item.low_stock_alert} {item.unit}
                  </p>
                </div>

                {status === 'out' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold whitespace-nowrap shrink-0">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Out of Stock</span>
                  </span>
                )}
                {status === 'critical' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold whitespace-nowrap shrink-0">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Critical Low</span>
                  </span>
                )}
                {status === 'low' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold whitespace-nowrap shrink-0">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Low Stock</span>
                  </span>
                )}
                {status === 'ok' && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 whitespace-nowrap shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>In Stock</span>
                  </span>
                )}
              </div>

              <div className="w-full h-2 rounded-full bg-[#EFE7D8] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    status === 'out' || status === 'critical'
                      ? 'bg-rose-500'
                      : status === 'low'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                  }`}
                  style={{ width: `${ratio}%` }}
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-0.5">
                <div className="flex items-baseline gap-1.5">
                  <span
                    data-testid={`stock-count-${item.item_id}`}
                    className="font-mono-num text-2xl font-extrabold text-[#261812] tabular-nums"
                  >
                    {item.stock}
                  </span>
                  <span className="text-xs font-semibold text-[#665347]">
                    {item.unit}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenRestock(item)}
                  aria-label={`Restock ${item.name}`}
                  className="min-h-[44px] px-4 rounded-xl bg-[#2C1B14] hover:bg-[#3D261D] active:scale-[0.98] text-[#FFFDF8] text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
                >
                  <PackagePlus className="w-4 h-4" aria-hidden="true" />
                  <span>+ Restock</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
