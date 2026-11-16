import { useState } from 'react';
import {
  AlertTriangle,
  CupSoda,
  Minus,
  ShoppingBag,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react';
import type { CartItem, InventoryItem, MenuItem } from '../types/pos';
import {
  computeMenuServingsAvailable,
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
}

function MenuImage({ item }: { item: MenuItem }) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-orange-50 via-amber-50 to-slate-100 flex flex-col items-center justify-center text-orange-700/70 p-2">
        {item.category === 'Drinks' ? (
          <CupSoda className="w-8 h-8 mb-1" aria-hidden="true" />
        ) : (
          <UtensilsCrossed className="w-8 h-8 mb-1" aria-hidden="true" />
        )}
        <span className="text-[11px] font-semibold text-center leading-tight">
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
}: PosTabProps) {
  const getQtyInCart = (id: string) =>
    cart.find((c) => c.menu_item_id === id)?.qty ?? 0;

  return (
    <div className={cartItemCount > 0 ? 'pb-36' : 'pb-24'}>
      <div className="px-4 pt-3.5 pb-2.5 flex items-center justify-between gap-2">
        <h1 className="text-lg font-extrabold tracking-tight text-slate-900">
          Quick Order
        </h1>
        <span className="text-xs font-semibold text-slate-500 whitespace-nowrap shrink-0">
          Tap tile to add
        </span>
      </div>

      <div className="px-4 grid grid-cols-2 gap-2.5">
        {menuItems.map((item, idx) => {
          const qtyInCart = getQtyInCart(item.id);
          const availableServings = computeMenuServingsAvailable(item, inventory);
          const isOut = availableServings <= 0;
          const isLow =
            !isOut &&
            item.deductions.some((d) => {
              const inv = inventory.find((i) => i.item_id === d.item_id);
              return inv ? inv.stock < inv.low_stock_alert : false;
            });
          const isWideTile = idx === menuItems.length - 1 && menuItems.length % 2 === 1;

          return (
            <div
              key={item.id}
              data-testid={`menu-card-${item.id}`}
              className={`relative rounded-2xl border transition-all overflow-hidden ${
                isWideTile ? 'col-span-2 flex flex-row items-center' : ''
              } ${
                qtyInCart > 0
                  ? 'bg-orange-50/50 border-orange-500 ring-2 ring-orange-500/20 shadow-sm'
                  : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
              }`}
            >
              <button
                type="button"
                onClick={() => onAddToCart(item)}
                disabled={isOut || qtyInCart >= availableServings}
                aria-label={`Add ${item.name} (${formatPesoCompact(item.price)}) to order`}
                className={`text-left active:scale-[0.98] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500 disabled:opacity-55 disabled:cursor-not-allowed ${
                  isWideTile
                    ? 'flex-1 min-w-0 flex flex-row items-center gap-3 p-2.5 min-h-[84px]'
                    : 'w-full flex flex-col p-2.5'
                }`}
              >
                <div
                  className={`relative rounded-xl bg-slate-100 overflow-hidden shrink-0 ${
                    isWideTile ? 'w-24 h-16' : 'w-full h-24'
                  }`}
                >
                  <MenuImage item={item} />
                  {qtyInCart > 0 && (
                    <span
                      aria-label={`${item.name} quantity in cart`}
                      className="absolute top-1.5 right-1.5 min-w-[28px] h-7 px-2 rounded-full bg-orange-600 text-white font-mono-num text-sm font-extrabold flex items-center justify-center shadow-md tabular-nums"
                    >
                      {qtyInCart}
                    </span>
                  )}
                </div>

                <div
                  className={
                    isWideTile
                      ? 'flex-1 min-w-0 flex items-center justify-between gap-2 pr-1'
                      : 'pt-2.5 flex flex-col gap-1'
                  }
                >
                  <h2 className="text-base font-extrabold text-slate-900 leading-tight truncate">
                    {item.name}
                  </h2>

                  <div
                    className={`flex items-baseline gap-2 ${
                      isWideTile ? 'flex-col items-end shrink-0' : 'justify-between mt-0.5'
                    }`}
                  >
                    <span className="font-mono-num text-lg font-extrabold text-orange-600 leading-none">
                      {formatPesoCompact(item.price)}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold whitespace-nowrap tabular-nums ${
                        isOut
                          ? 'text-rose-600'
                          : isLow
                            ? 'text-amber-700'
                            : 'text-slate-400'
                      }`}
                    >
                      {(isOut || isLow) && (
                        <AlertTriangle className="w-3 h-3 shrink-0" aria-hidden="true" />
                      )}
                      <span>
                        {isOut
                          ? 'Sold out'
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
                      ? 'mr-2.5 shrink-0 min-h-[44px] min-w-[44px] rounded-xl bg-white hover:bg-rose-50 active:scale-95 text-slate-800 hover:text-rose-600 border border-orange-200 shadow-xs flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500'
                      : 'absolute top-3.5 left-3.5 z-10 min-h-[44px] min-w-[44px] rounded-xl bg-white/95 hover:bg-rose-50 active:scale-95 text-slate-800 hover:text-rose-600 border border-slate-200 shadow-md flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500'
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
          className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-20 px-3 pb-2.5 pt-1 bg-gradient-to-t from-slate-100 via-slate-100/95 to-transparent"
        >
          <div className="bg-slate-900 text-white rounded-2xl p-2.5 pl-3.5 shadow-lg flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-4 h-4 text-white" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-300 font-medium whitespace-nowrap">
                  {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}
                </p>
                <p className="font-mono-num text-base font-bold text-white leading-tight">
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
                className="min-h-[44px] min-w-[44px] rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={onOpenCheckout}
                className="min-h-[44px] px-4 rounded-xl bg-orange-600 hover:bg-orange-500 active:scale-[0.98] text-white text-sm font-bold whitespace-nowrap shrink-0 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
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
