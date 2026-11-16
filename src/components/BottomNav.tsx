import { BarChart3, Package, Receipt, Store } from 'lucide-react';
import type { TabId } from '../types/pos';

interface BottomNavProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  lowStockCount: number;
}

const NAV_ITEMS: { id: TabId; label: string; icon: typeof Store }[] = [
  { id: 'pos', label: 'POS', icon: Store },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'expenses', label: 'Expenses', icon: Receipt },
  { id: 'sales', label: 'Sales', icon: BarChart3 },
];

export function BottomNav({
  activeTab,
  onSelectTab,
  lowStockCount,
}: BottomNavProps) {
  return (
    <nav
      aria-label="Primary navigation"
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-30 bg-[#FFFDF8]/95 backdrop-blur-md border-t border-[#DDD1BE] pb-safe"
    >
      <div role="tablist" className="grid grid-cols-4 h-16">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelectTab(item.id)}
              className={`relative min-h-[44px] flex flex-col items-center justify-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1D4ED8] ${
                isActive
                  ? 'text-[#1D4ED8]'
                  : 'text-[#665347] hover:text-[#261812]'
              }`}
            >
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-full bg-[#1D4ED8]"
                />
              )}
              <span className="relative inline-flex items-center justify-center">
                <Icon
                  className="w-5 h-5"
                  strokeWidth={isActive ? 2.4 : 1.9}
                  aria-hidden="true"
                />
                {item.id === 'inventory' && lowStockCount > 0 && (
                  <span
                    aria-label={`${lowStockCount} low stock`}
                    className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-amber-600 text-white text-[10px] font-bold leading-4 text-center tabular-nums"
                  >
                    {lowStockCount}
                  </span>
                )}
              </span>
              <span className="text-[11px] font-semibold tracking-tight whitespace-nowrap shrink-0">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
