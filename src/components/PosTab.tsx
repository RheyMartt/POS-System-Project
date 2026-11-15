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
      <div className="px-4 pt-4 pb-3 flex items-baseline justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Stall Menu
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tap an item to add · Stock deducts automatically
          </p>
        </div>
        <span className="text-xs font-medium text-slate-500 whitespace-nowrap shrink-0 tabular-nums">
          {menuItems.length} items
        </span>
      </div>

      <div className="px-4 grid grid-cols-2 gap-3">
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
          const isWideAddOn = idx === menuItems.length - 1 && menuItems.length % 2 === 1;

          return (
            <div
              key={item.id}
              data-testid={`menu-card-${item.id}`}
              className={`bg-white rounded-2xl border transition-colors overflow-hidden flex ${
                isWideAddOn ? 'col-span-2 flex-row items-stretch' : 'flex-col'
              } ${
                qtyInCart > 0
                  ? 'border-orange-400 shadow-sm ring-1 ring-orange-200'
                  : 'border-slate-200 shadow-xs'
              }`}
            >
              <button
                type="button"
                onClick={() => onAddToCart(item)}
                disabled={isOut || qtyInCart >= availableServings}
                aria-label={`Add ${item.name} (${formatPesoCompact(item.price)}) to order`}
                className={`text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500 disabled:opacity-60 disabled:cursor-not-allowed ${
                  isWideAddOn
                    ? 'flex-1 flex flex-row items-center gap-3 p-2.5'
                    : 'flex-1 flex flex-col'
                }`}
              >
                <div
                  className={`relative bg-slate-100 overflow-hidden shrink-0 ${
                    isWideAddOn ? 'w-24 h-20 rounded-xl' : 'w-full aspect-[4/3]'
                  }`}
                >
                  <MenuImage item={item} />
                  {qtyInCart > 0 && (
                    <span className="absolute top-2 right-2 min-w-[26px] h-6 px-1.5 rounded-full bg-orange-600 text-white text-xs font-bold flex items-center justify-center shadow-sm tabular-nums">
                      {qtyInCart}
                    </span>
                  )}
                </div>

                <div className={isWideAddOn ? 'flex-1 min-w-0 py-0.5' : 'p-3 flex-1 flex flex-col justify-between'}>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 leading-snug">
                      {item.name}
                    </h2>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                      {item.subtitle}
                    </p>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between gap-2">
                    <span className="font-mono-num text-base font-bold text-orange-600">
                      {formatPesoCompact(item.price)}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold whitespace-nowrap tabular-nums ${
                        isOut
                          ? 'text-rose-600'
                          : isLow
                            ? 'text-amber-700'
                            : 'text-slate-500'
                      }`}
                    >
                      {(isOut || isLow) && (
                        <AlertTriangle className="w-3 h-3 shrink-0" aria-hidden="true" />
                      )}
                      <span>
                        {isOut
                          ? 'Out of stock'
                          : isLow
                            ? `Low · ${availableServings}`
                            : `${availableServings} left`}
                      </span>
                    </span>
                  </div>
                </div>
              </button>

              {qtyInCart > 0 ? (
                <div
                  className={`flex items-center justify-between gap-1 bg-orange-50/80 border-orange-100 ${
                    isWideAddOn
                      ? 'flex-col justify-center px-2 py-2 border-l'
                      : 'px-2.5 py-1.5 border-t'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onDecrementCart(item.id)}
                    aria-label={`Remove one ${item.name}`}
                    className="min-h-[40px] min-w-[40px] rounded-xl bg-white border border-orange-200 text-slate-700 hover:bg-orange-100 active:scale-95 flex items-center justify-center transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                  >
                    <Minus className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <span
                    aria-label={`${item.name} quantity in cart`}
                    className="font-mono-num text-sm font-bold text-slate-900 px-1.5 tabular-nums"
                  >
                    {qtyInCart}
                  </span>
                  <button
                    type="button"
                    onClick={() => onAddToCart(item)}
                    disabled={qtyInCart >= availableServings}
                    aria-label={`Add one more ${item.name}`}
                    className="min-h-[40px] min-w-[40px] rounded-xl bg-orange-600 text-white hover:bg-orange-700 active:scale-95 flex items-center justify-center transition-transform disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <div
                  className={`flex items-center justify-center border-slate-100 bg-slate-50/60 ${
                    isWideAddOn ? 'px-2.5 py-2 border-l' : 'px-2.5 py-1.5 border-t'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onAddToCart(item)}
                    disabled={isOut}
                    aria-label={`Quick add ${item.name}`}
                    className="w-full min-h-[40px] px-3 rounded-xl bg-white border border-slate-200 hover:border-orange-300 hover:bg-orange-50 text-slate-800 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-45 disabled:cursor-not-allowed whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                  >
                    <Plus className="w-3.5 h-3.5 text-orange-600" aria-hidden="true" />
                    <span>{isOut ? 'Sold Out' : 'Add'}</span>
                  </button>
                </div>
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
