import { useEffect, useState } from 'react';
import { Banknote, Minus, Plus, Smartphone, X } from 'lucide-react';
import type { CartItem, PaymentMethod } from '../types/pos';
import {
  formatPeso,
  formatPesoCompact,
  getQuickCashOptions,
  validateCheckout,
} from '../utils/posLogic';

interface CheckoutDrawerProps {
  isOpen: boolean;
  cart: CartItem[];
  totalAmount: number;
  isSubmitting: boolean;
  onClose: () => void;
  onIncrementItem: (menuItemId: string) => void;
  onDecrementItem: (menuItemId: string) => void;
  onCompleteOrder: (details: {
    paymentMethod: PaymentMethod;
    amountTendered: number;
    changeDue: number;
    gcashRef: string;
  }) => void;
}

export function CheckoutDrawer({
  isOpen,
  cart,
  totalAmount,
  isSubmitting,
  onClose,
  onIncrementItem,
  onDecrementItem,
  onCompleteOrder,
}: CheckoutDrawerProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [cashInput, setCashInput] = useState<string>('');
  const [gcashRef, setGcashRef] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPaymentMethod('Cash');
      setCashInput(totalAmount > 0 ? String(totalAmount) : '');
      setGcashRef('');
      setValidationError(null);
    }
  }, [isOpen, totalAmount]);

  if (!isOpen) return null;

  const parsedTendered = parseFloat(cashInput);
  const amountTendered =
    paymentMethod === 'GCash'
      ? totalAmount
      : Number.isFinite(parsedTendered)
        ? parsedTendered
        : 0;

  const check = validateCheckout({
    totalAmount,
    paymentMethod,
    amountTendered,
    gcashRef,
  });

  const quickCashOptions = getQuickCashOptions(totalAmount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = validateCheckout({
      totalAmount,
      paymentMethod,
      amountTendered,
      gcashRef,
    });

    if (!res.valid) {
      setValidationError(res.error ?? 'Please check payment details.');
      return;
    }

    setValidationError(null);
    onCompleteOrder({
      paymentMethod,
      amountTendered,
      changeDue: res.changeDue,
      gcashRef: paymentMethod === 'GCash' ? gcashRef.trim() : '',
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-drawer-title"
    >
      <div className="w-full max-w-[480px] max-h-[90vh] bg-white rounded-t-3xl shadow-2xl flex flex-col overflow-hidden">
        <div className="pt-3 pb-1 flex justify-center shrink-0">
          <span className="w-10 h-1.5 rounded-full bg-slate-300" aria-hidden="true" />
        </div>

        <div className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <h2
              id="checkout-drawer-title"
              className="text-lg font-bold text-slate-900"
            >
              Checkout
            </h2>
            <p className="text-xs text-slate-500">
              Review items and collect payment
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close checkout"
            className="min-h-[44px] min-w-[44px] rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl px-3">
              {cart.map((item) => (
                <div
                  key={item.menu_item_id}
                  className="py-2.5 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-500 font-mono-num">
                      {formatPesoCompact(item.unit_price)} each
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                      <button
                        type="button"
                        onClick={() => onDecrementItem(item.menu_item_id)}
                        aria-label={`Decrease ${item.name} quantity`}
                        className="w-8 h-8 rounded-lg bg-white text-slate-700 hover:bg-slate-50 flex items-center justify-center shadow-2xs"
                      >
                        <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                      <span className="font-mono-num text-xs font-bold w-6 text-center tabular-nums">
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => onIncrementItem(item.menu_item_id)}
                        aria-label={`Increase ${item.name} quantity`}
                        className="w-8 h-8 rounded-lg bg-white text-slate-700 hover:bg-slate-50 flex items-center justify-center shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                    <span className="font-mono-num text-sm font-bold text-slate-900 w-16 text-right">
                      {formatPesoCompact(item.unit_price * item.qty)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">
                Total Amount
              </span>
              <span className="font-mono-num text-2xl font-extrabold text-slate-900">
                {formatPeso(totalAmount)}
              </span>
            </div>

            <div>
              <span className="block text-xs font-semibold text-slate-600 mb-2">
                Payment Method
              </span>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('Cash');
                    setValidationError(null);
                  }}
                  aria-pressed={paymentMethod === 'Cash'}
                  className={`min-h-[44px] rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${
                    paymentMethod === 'Cash'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Banknote className="w-4 h-4" aria-hidden="true" />
                  <span>Cash</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('GCash');
                    setValidationError(null);
                  }}
                  aria-pressed={paymentMethod === 'GCash'}
                  className={`min-h-[44px] rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${
                    paymentMethod === 'GCash'
                      ? 'bg-[#007DFE] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Smartphone className="w-4 h-4" aria-hidden="true" />
                  <span>GCash</span>
                </button>
              </div>
            </div>

            {paymentMethod === 'Cash' ? (
              <div className="space-y-3">
                <div>
                  <span className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Quick Cash
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {quickCashOptions.map((amt) => {
                      const isSelected = Number(cashInput) === amt;
                      return (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => {
                            setCashInput(String(amt));
                            setValidationError(null);
                          }}
                          className={`min-h-[44px] rounded-xl border text-xs font-bold font-mono-num transition-colors whitespace-nowrap ${
                            isSelected
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                              : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                          }`}
                        >
                          {amt === totalAmount
                            ? 'Exact'
                            : formatPesoCompact(amt)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="cash-tendered"
                    className="block text-xs font-semibold text-slate-600 mb-1.5"
                  >
                    Cash Tendered (₱)
                  </label>
                  <input
                    id="cash-tendered"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    value={cashInput}
                    onChange={(e) => {
                      setCashInput(e.target.value);
                      setValidationError(null);
                    }}
                    placeholder="Enter cash received"
                    className="w-full h-12 px-3.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-mono-num text-base font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div
                  className={`rounded-2xl px-4 py-3 border flex items-center justify-between ${
                    amountTendered >= totalAmount
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  <span className="text-sm font-semibold">
                    {amountTendered >= totalAmount
                      ? 'Change Due'
                      : 'Insufficient Cash'}
                  </span>
                  <span className="font-mono-num text-lg font-extrabold">
                    {amountTendered >= totalAmount
                      ? formatPeso(check.changeDue)
                      : formatPeso(amountTendered - totalAmount)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label
                  htmlFor="gcash-ref"
                  className="block text-xs font-semibold text-slate-600"
                >
                  GCash Reference Number <span className="text-rose-600">*</span>
                </label>
                <input
                  id="gcash-ref"
                  type="text"
                  value={gcashRef}
                  onChange={(e) => {
                    setGcashRef(e.target.value);
                    setValidationError(null);
                  }}
                  placeholder="Enter last 6–13 digits of GCash Ref #"
                  autoComplete="off"
                  className="w-full h-12 px-3.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-mono-num text-base font-semibold focus:outline-none focus:ring-2 focus:ring-[#007DFE] focus:border-[#007DFE]"
                />
                <p className="text-xs text-slate-500">
                  Verify customer confirmation screen before completing order.
                </p>
              </div>
            )}

            {validationError && (
              <div
                role="alert"
                className="rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs font-semibold text-rose-700"
              >
                {validationError}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-200 bg-white shrink-0 pb-safe">
            <button
              type="submit"
              disabled={isSubmitting || cart.length === 0}
              className="w-full min-h-[48px] rounded-2xl bg-orange-600 hover:bg-orange-700 active:scale-[0.99] text-white font-bold text-base shadow-sm transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              {isSubmitting
                ? 'Completing Order...'
                : `Complete Order · ${formatPeso(totalAmount)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
