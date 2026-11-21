import { useState } from 'react';
import {
  AlertTriangle,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import type { CartItem, InventoryItem, MenuItem } from '../types/pos';
import {
  computeMenuServingsAvailable,
  computeUnitMargin,
  formatPeso,
  formatPesoCompact,
} from '../utils/posLogic';

interface PosTabProps {
  menuItems: MenuItem[];
  inventory: InventoryItem[];
  cart: CartItem[];
  cartItemCount: number;
  cartTotalAmount: number;
  onAddToCart: (item: MenuItem) => void;
  onDecrementCart: (menuItemId: string) => void;
  onClearCart: () => void;
  onOpenCheckout: () => void;
  onOpenAddItem: () => void;
}

const CATEGORY_PILLS = [
  'All',
  'Promos',
  'Siomai',
  'Shawarma',
  'Noodles',
  'Snacks',
  'Milktea',
];

export function PosTab({
  menuItems,
  inventory,
  cart,
  cartItemCount,
  cartTotalAmount,
  onAddToCart,
  onDecrementCart,
  onClearCart,
  onOpenCheckout,
  onOpenAddItem,
}: PosTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const getQtyInCart = (id: string) =>
    cart
      .filter((c) => c.menu_item_id === id || c.menu_item_id.startsWith(`${id}-`))
      .reduce((sum, c) => sum + c.qty, 0);

  const filteredMenuItems =
    selectedCategory === 'All'
      ? menuItems
      : menuItems.filter((item) => item.category === selectedCategory);

  return (
    <div className={cartItemCount > 0 ? 'pb-36' : 'pb-24'}>
      {/* Top Header Row */}
      <div className="px-4 pt-3.5 pb-2 flex items-center justify-between gap-2">
        <h1 className="text-lg font-extrabold tracking-tight text-[#261812]">
          Quick Order
        </h1>
        <button
          type="button"
          onClick={onOpenAddItem}
          className="min-h-[44px] px-3.5 rounded-xl border border-[#DDD1BE] bg-[#FFFDF8] hover:bg-[#EFE7D8] active:scale-[0.98] text-[#261812] text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-2xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
        >
          <Plus className="w-4 h-4 text-[#1D4ED8]" aria-hidden="true" />
          <span>Add Item</span>
        </button>
      </div>

      {/* Category Filter Pills (Horizontal Scroll) */}
      <div className="px-4 pb-3 overflow-x-auto flex items-center gap-2">
        {CATEGORY_PILLS.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`min-h-[38px] px-3.5 rounded-full text-xs font-bold whitespace-nowrap transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] ${
                isActive
                  ? 'bg-[#1D4ED8] text-white shadow-xs'
                  : 'bg-[#FFFDF8] text-[#665347] border border-[#DDD1BE] hover:bg-[#EFE7D8] hover:text-[#261812]'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Menu Item Grid - Large Text-Only Thumb Buttons */}
      <div className="px-4 grid grid-cols-2 gap-2.5">
        {filteredMenuItems.map((item) => {
          const qtyInCart = getQtyInCart(item.id);
          const availableServings = computeMenuServingsAvailable(item, inventory);
          const isUnlimited = !Number.isFinite(availableServings);
          const isOut = !isUnlimited && availableServings <= 0;
          const isLow =
            !isUnlimited &&
            !isOut &&
            item.deductions.some((d) => {
              const inv = inventory.find((i) => i.item_id === d.item_id);
              return inv ? inv.stock < inv.low_stock_alert : false;
            });
          const unitMargin = computeUnitMargin(item.price, item.cost ?? 0);
          const isPromo = item.category === 'Promos';

          return (
            <div
              key={item.id}
              data-testid={`menu-card-${item.id}`}
              className={`relative rounded-2xl border transition-all overflow-hidden flex flex-col justify-between ${
                qtyInCart > 0
                  ? 'bg-[#EFF6FF] border-[#1D4ED8] ring-2 ring-[#1D4ED8]/25 shadow-sm'
                  : isPromo
                    ? 'bg-[#FFFDF8] border-[#3B82F6]/60 shadow-2xs hover:border-[#1D4ED8] ring-1 ring-[#1D4ED8]/10'
                    : 'bg-[#FFFDF8] border-[#DDD1BE] shadow-2xs hover:border-[#C5B69F]'
              }`}
            >
              <button
                type="button"
                onClick={() => onAddToCart(item)}
                disabled={isOut || (!isUnlimited && qtyInCart >= availableServings)}
                aria-label={`Add ${item.name} (${formatPesoCompact(item.price)}) to order`}
                className="w-full text-left p-3.5 min-h-[88px] flex flex-col justify-between gap-2.5 active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1D4ED8] disabled:opacity-55 disabled:cursor-not-allowed"
              >
                {/* Header: Name + Margin + Optional Promo Badge */}
                <div className="min-w-0 pr-6">
                  {isPromo && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#1E40AF] bg-[#DBEAFE] border border-[#BFDBFE] px-2 py-0.5 rounded-full uppercase tracking-wider mb-1.5 self-start">
                      PROMO COMBO
                    </span>
                  )}
                  <h2 className="text-sm sm:text-base font-extrabold text-[#261812] leading-snug line-clamp-2">
                    {item.name}
                  </h2>
                  <span
                    data-testid={`margin-badge-${item.id}`}
                    className={`inline-flex items-center mt-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold font-mono-num tabular-nums ${
                      unitMargin > 0
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                        : unitMargin < 0
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-[#EFE7D8] text-[#665347]'
                    }`}
                  >
                    {unitMargin >= 0 ? `+${formatPesoCompact(unitMargin)}` : formatPesoCompact(unitMargin)} margin
                  </span>
                </div>

                {/* Footer: Price + Stock Badge */}
                <div className="flex items-end justify-between gap-1 pt-1.5 border-t border-[#F0E6D6]/80 mt-auto">
                  <span className="font-mono-num text-base sm:text-lg font-extrabold text-[#1D4ED8] leading-none">
                    {formatPesoCompact(item.price)}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap tabular-nums border ${
                      isOut
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : isLow
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-[#F2ECE0] text-[#665347] border-[#E2D6C3]'
                    }`}
                  >
                    {(isOut || isLow) && (
                      <AlertTriangle className="w-3 h-3 shrink-0" aria-hidden="true" />
                    )}
                    <span>
                      {isOut
                        ? 'Out of stock'
                        : isUnlimited
                          ? 'Open stock'
                          : isLow
                            ? `Low · ${availableServings}`
                            : `${availableServings} left`}
                    </span>
                  </span>
                </div>
              </button>

              {/* In-Cart Quantity Badge + Decrement Button */}
              {qtyInCart > 0 && (
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                  <span
                    aria-label={`${item.name} quantity in cart`}
                    className="min-w-[26px] h-6 px-1.5 rounded-full bg-[#1D4ED8] text-white font-mono-num text-xs font-extrabold flex items-center justify-center shadow-sm tabular-nums"
                  >
                    {qtyInCart}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDecrementCart(item.id);
                    }}
                    aria-label={`Remove one ${item.name}`}
                    title={`Remove one ${item.name}`}
                    className="w-7 h-7 rounded-full bg-[#FFFDF8] hover:bg-rose-50 active:scale-90 text-[#261812] hover:text-rose-700 border border-[#93C5FD] shadow-xs flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
                  >
                    <Minus className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty Filter State */}
      {filteredMenuItems.length === 0 && (
        <div className="px-4 py-12 text-center text-[#665347]">
          <p className="text-sm font-semibold">
            No menu items in category "{selectedCategory}"
          </p>
          <button
            type="button"
            onClick={() => setSelectedCategory('All')}
            className="mt-3 text-xs font-bold text-[#1D4ED8] underline"
          >
            Show all items
          </button>
        </div>
      )}

      {/* Floating Checkout Bar */}
      {cartItemCount > 0 && (
        <div
          data-testid="sticky-cart-bar"
          className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 w-full max-w-[480px] z-20 px-3 pb-2.5 pt-1 bg-gradient-to-t from-[#F7F2E8] via-[#F7F2E8]/95 to-transparent"
        >
          <div className="bg-[#2C1B14] text-[#FFFDF8] rounded-2xl p-2.5 pl-3.5 shadow-lg flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#1D4ED8] flex items-center justify-center shrink-0">
                <ShoppingBag className="w-4 h-4 text-white" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-[#D6C7B4] font-medium whitespace-nowrap">
                  {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}
                </p>
                <p className="font-mono-num text-base font-bold text-[#FFFDF8] leading-tight">
                  {formatPeso(cartTotalAmount)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={onClearCart}
                aria-label="Clear cart"
                title="Clear cart"
                className="min-h-[44px] min-w-[44px] rounded-xl text-[#D6C7B4] hover:text-[#FFFDF8] hover:bg-[#3D261D] flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA]"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={onOpenCheckout}
                className="min-h-[44px] px-4 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] active:scale-[0.98] text-white text-sm font-bold whitespace-nowrap shrink-0 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA]"
              >
                Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
