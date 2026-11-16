import { useState } from 'react';
import {
  AlertTriangle,
  CupSoda,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  UtensilsCrossed,
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

function MenuImage({ item }: { item: MenuItem }) {
  const [hasError, setHasError] = useState(false);

  if (!item.image || hasError) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-[#EFE7D8] via-[#F7F2E8] to-[#DBEAFE] flex flex-col items-center justify-center text-[#261812] p-2">
        {item.category === 'Drinks' ? (
          <CupSoda className="w-7 h-7 mb-1 text-[#1D4ED8]" aria-hidden="true" />
        ) : (
          <UtensilsCrossed className="w-7 h-7 mb-1 text-[#1D4ED8]" aria-hidden="true" />
        )}
        <span className="text-[11px] font-semibold text-center leading-tight line-clamp-2">
          {item.name}
        </span>
      </div>
    );
  }

  return (
    <img
      src={item.image}
      alt={item.name}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className="w-full h-full object-cover"
    />
  );
}

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
  const getQtyInCart = (id: string) =>
    cart.find((c) => c.menu_item_id === id)?.qty ?? 0;

  return (
    <div className={cartItemCount > 0 ? 'pb-36' : 'pb-24'}>
      <div className="px-4 pt-3.5 pb-2.5 flex items-center justify-between gap-2">
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

      <div className="px-4 grid grid-cols-2 gap-2.5">
        {menuItems.map((item, idx) => {
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
          const isWideTile = idx === menuItems.length - 1 && menuItems.length % 2 === 1;
          const unitMargin = computeUnitMargin(item.price, item.cost ?? 0);

          return (
            <div
              key={item.id}
              data-testid={`menu-card-${item.id}`}
              className={`relative rounded-2xl border transition-all overflow-hidden ${
                isWideTile ? 'col-span-2 flex flex-row items-center' : ''
              } ${
                qtyInCart > 0
                  ? 'bg-[#EFF6FF]/65 border-[#1D4ED8] ring-2 ring-[#1D4ED8]/20 shadow-sm'
                  : 'bg-[#FFFDF8] border-[#DDD1BE] shadow-xs hover:border-[#C5B69F]'
              }`}
            >
              <button
                type="button"
                onClick={() => onAddToCart(item)}
                disabled={isOut || (!isUnlimited && qtyInCart >= availableServings)}
                aria-label={`Add ${item.name} (${formatPesoCompact(item.price)}) to order`}
                className={`text-left active:scale-[0.98] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1D4ED8] disabled:opacity-55 disabled:cursor-not-allowed ${
                  isWideTile
                    ? 'flex-1 min-w-0 flex flex-row items-center gap-3 p-2.5 min-h-[84px]'
                    : 'w-full flex flex-col p-2.5'
                }`}
              >
                <div
                  className={`relative rounded-xl bg-[#EFE7D8] overflow-hidden shrink-0 ${
                    isWideTile ? 'w-24 h-16' : 'w-full h-24'
                  }`}
                >
                  <MenuImage item={item} />
                  {qtyInCart > 0 && (
                    <span
                      aria-label={`${item.name} quantity in cart`}
                      className="absolute top-1.5 right-1.5 min-w-[28px] h-7 px-2 rounded-full bg-[#1D4ED8] text-white font-mono-num text-sm font-extrabold flex items-center justify-center shadow-md tabular-nums"
                    >
                      {qtyInCart}
                    </span>
                  )}
                </div>

                <div
                  className={
                    isWideTile
                      ? 'flex-1 min-w-0 flex items-center justify-between gap-2 pr-1'
                      : 'pt-2 flex flex-col gap-1'
                  }
                >
                  <div className="min-w-0 flex flex-col gap-0.5">
                    <h2 className="text-base font-extrabold text-[#261812] leading-tight truncate">
                      {item.name}
                    </h2>
                    <span
                      data-testid={`margin-badge-${item.id}`}
                      className={`inline-flex items-center self-start px-1.5 py-0.5 rounded-md text-[10px] font-bold font-mono-num tabular-nums ${
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

                  <div
                    className={`flex items-baseline gap-2 ${
                      isWideTile ? 'flex-col items-end shrink-0' : 'justify-between mt-0.5'
                    }`}
                  >
                    <span className="font-mono-num text-lg font-extrabold text-[#1D4ED8] leading-none">
                      {formatPesoCompact(item.price)}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold whitespace-nowrap tabular-nums ${
                        isOut
                          ? 'text-rose-700'
                          : isLow
                            ? 'text-amber-800'
                            : 'text-[#665347]'
                      }`}
                    >
                      {(isOut || isLow) && (
                        <AlertTriangle className="w-3 h-3 shrink-0" aria-hidden="true" />
                      )}
                      <span>
                        {isOut
                          ? 'Sold out'
                          : isUnlimited
                            ? 'Open stock'
                            : isLow
                              ? `Low · ${availableServings}`
                              : `${availableServings} left`}
                      </span>
                    </span>
                  </div>
                </div>
              </button>

              {qtyInCart > 0 && (
                <button
                  type="button"
                  onClick={() => onDecrementCart(item.id)}
                  aria-label={`Remove one ${item.name}`}
                  title={`Remove one ${item.name}`}
                  className={
                    isWideTile
                      ? 'mr-2.5 shrink-0 min-h-[44px] min-w-[44px] rounded-xl bg-[#FFFDF8] hover:bg-rose-50 active:scale-95 text-[#261812] hover:text-rose-700 border border-[#93C5FD] shadow-xs flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]'
                      : 'absolute top-3.5 left-3.5 z-10 min-h-[44px] min-w-[44px] rounded-xl bg-[#FFFDF8]/95 hover:bg-rose-50 active:scale-95 text-[#261812] hover:text-rose-700 border border-[#DDD1BE] shadow-md flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]'
                  }
                >
                  <Minus className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
                </button>
              )}
            </div>
          );
        })}
      </div>

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
