import { useEffect, useState } from 'react';
import { PackagePlus, Plus, Trash2, X } from 'lucide-react';
import { MENU_CATEGORIES } from '../data/menuAndSeed';
import type {
  InventoryDeduction,
  InventoryItem,
  MenuCategory,
} from '../types/pos';
import { computeUnitMargin, formatPeso } from '../utils/posLogic';

export type InventoryLinkMode = 'none' | 'existing' | 'new';

export interface NewItemFormSubmission {
  name: string;
  price: number;
  cost: number;
  category: MenuCategory | string;
  linkingMode: InventoryLinkMode;
  deductions: InventoryDeduction[];
  newInventory: {
    name: string;
    unit: string;
    stock: number;
    low_stock_alert: number;
    deduct_qty: number;
  } | null;
}

interface AddItemModalProps {
  isOpen: boolean;
  inventory: InventoryItem[];
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (data: NewItemFormSubmission) => Promise<void> | void;
}

interface ExistingLinkRow {
  rowId: number;
  item_id: string;
  qty: string;
}

export function AddItemModal({
  isOpen,
  inventory,
  isSubmitting,
  onClose,
  onSubmit,
}: AddItemModalProps) {
  const [name, setName] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [costInput, setCostInput] = useState('');
  const [category, setCategory] = useState<MenuCategory>('Food');
  const [linkingMode, setLinkingMode] = useState<InventoryLinkMode>('none');

  const [existingRows, setExistingRows] = useState<ExistingLinkRow[]>([
    { rowId: 1, item_id: inventory[0]?.item_id ?? '', qty: '1' },
  ]);
  const [nextRowId, setNextRowId] = useState(2);

  const [newStockName, setNewStockName] = useState('');
  const [newStockUnit, setNewStockUnit] = useState('pcs');
  const [newStockQty, setNewStockQty] = useState('30');
  const [newLowAlert, setNewLowAlert] = useState('10');
  const [newDeductQty, setNewDeductQty] = useState('1');

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setPriceInput('');
      setCostInput('');
      setCategory('Food');
      setLinkingMode('none');
      setExistingRows([
        { rowId: 1, item_id: inventory[0]?.item_id ?? '', qty: '1' },
      ]);
      setNextRowId(2);
      setNewStockName('');
      setNewStockUnit('pcs');
      setNewStockQty('30');
      setNewLowAlert('10');
      setNewDeductQty('1');
      setError(null);
    }
  }, [isOpen, inventory]);

  if (!isOpen) return null;

  const parsedPrice = parseFloat(priceInput);
  const parsedCost = costInput.trim() === '' ? 0 : parseFloat(costInput);
  const safePrice = Number.isFinite(parsedPrice) ? parsedPrice : 0;
  const safeCost = Number.isFinite(parsedCost) ? parsedCost : 0;
  const estimatedProfit = computeUnitMargin(safePrice, safeCost);
  const marginPct =
    safePrice > 0 ? Math.round((estimatedProfit / safePrice) * 100) : 0;

  const handleAddExistingRow = () => {
    const usedIds = new Set(existingRows.map((r) => r.item_id));
    const unused = inventory.find((inv) => !usedIds.has(inv.item_id));
    setExistingRows((prev) => [
      ...prev,
      {
        rowId: nextRowId,
        item_id: unused?.item_id ?? inventory[0]?.item_id ?? '',
        qty: '1',
      },
    ]);
    setNextRowId((n) => n + 1);
    setError(null);
  };

  const handleRemoveExistingRow = (rowId: number) => {
    setExistingRows((prev) => prev.filter((r) => r.rowId !== rowId));
    setError(null);
  };

  const handleUpdateExistingRow = (
    rowId: number,
    patch: Partial<Pick<ExistingLinkRow, 'item_id' | 'qty'>>,
  ) => {
    setExistingRows((prev) =>
      prev.map((r) => (r.rowId === rowId ? { ...r, ...patch } : r)),
    );
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Enter an item name.');
      return;
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setError('Enter a selling price greater than ₱0.');
      return;
    }
    if (!Number.isFinite(parsedCost) || parsedCost < 0) {
      setError('Estimated unit cost cannot be negative.');
      return;
    }

    if (linkingMode === 'existing') {
      if (inventory.length === 0) {
        setError('No existing inventory items yet. Choose "Create new" instead.');
        return;
      }
      const aggregated = new Map<string, number>();
      for (const row of existingRows) {
        const qty = parseInt(row.qty, 10);
        if (!row.item_id || !Number.isFinite(qty) || qty <= 0) {
          setError('Select an inventory item and enter a valid qty (> 0) for every link.');
          return;
        }
        aggregated.set(row.item_id, (aggregated.get(row.item_id) ?? 0) + qty);
      }
      const deductions: InventoryDeduction[] = Array.from(
        aggregated.entries(),
      ).map(([item_id, qty]) => ({ item_id, qty }));

      if (deductions.length === 0) {
        setError('Add at least one inventory stock link.');
        return;
      }

      setError(null);
      await onSubmit({
        name: trimmedName,
        price: Math.round(parsedPrice * 100) / 100,
        cost: Math.round(parsedCost * 100) / 100,
        category,
        linkingMode: 'existing',
        deductions,
        newInventory: null,
      });
      return;
    }

    if (linkingMode === 'new') {
      const trimmedStockName = newStockName.trim();
      const stockQty = parseInt(newStockQty, 10);
      const lowAlert = parseInt(newLowAlert, 10);
      const deductQty = parseInt(newDeductQty, 10);

      if (!trimmedStockName) {
        setError('Enter a name for the new countable inventory item.');
        return;
      }
      if (!Number.isFinite(stockQty) || stockQty < 0) {
        setError('Enter a valid initial stock quantity (0 or more).');
        return;
      }
      if (!Number.isFinite(lowAlert) || lowAlert < 0) {
        setError('Enter a valid low stock alert threshold (0 or more).');
        return;
      }
      if (!Number.isFinite(deductQty) || deductQty <= 0) {
        setError('Qty deducted per order must be at least 1.');
        return;
      }

      setError(null);
      await onSubmit({
        name: trimmedName,
        price: Math.round(parsedPrice * 100) / 100,
        cost: Math.round(parsedCost * 100) / 100,
        category,
        linkingMode: 'new',
        deductions: [],
        newInventory: {
          name: trimmedStockName,
          unit: newStockUnit.trim() || 'pcs',
          stock: stockQty,
          low_stock_alert: lowAlert,
          deduct_qty: deductQty,
        },
      });
      return;
    }

    setError(null);
    await onSubmit({
      name: trimmedName,
      price: Math.round(parsedPrice * 100) / 100,
      cost: Math.round(parsedCost * 100) / 100,
      category,
      linkingMode: 'none',
      deductions: [],
      newInventory: null,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#261812]/55 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-item-modal-title"
    >
      <div className="w-full max-w-[460px] max-h-[92vh] bg-[#FFFDF8] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#DDD1BE] flex flex-col overflow-hidden">
        <div className="pt-3 pb-1 flex justify-center shrink-0 sm:hidden">
          <span className="w-10 h-1.5 rounded-full bg-[#D4C8B3]" aria-hidden="true" />
        </div>

        <div className="px-5 py-3.5 border-b border-[#DDD1BE] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] text-[#1D4ED8] flex items-center justify-center shrink-0">
              <PackagePlus className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2
                id="add-item-modal-title"
                className="text-base font-bold text-[#261812]"
              >
                Add Menu Item
              </h2>
              <p className="text-xs text-[#665347]">
                Set pricing, unit cost & stock tracking
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close add item modal"
            className="min-h-[44px] min-w-[44px] rounded-xl text-[#665347] hover:text-[#261812] hover:bg-[#EFE7D8] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            <div>
              <label
                htmlFor="new-item-name"
                className="block text-xs font-semibold text-[#665347] mb-1"
              >
                Item Name <span className="text-rose-600">*</span>
              </label>
              <input
                id="new-item-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                placeholder="e.g. Pork Siomai 6 pcs, Buko Juice"
                className="w-full h-11 px-3 rounded-xl border border-[#CFC1AA] bg-[#FFFDF8] text-sm font-medium text-[#261812] placeholder:text-[#8C7A6B] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-[#1D4ED8]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="new-item-price"
                  className="block text-xs font-semibold text-[#665347] mb-1"
                >
                  Selling Price (₱) <span className="text-rose-600">*</span>
                </label>
                <input
                  id="new-item-price"
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  step="any"
                  value={priceInput}
                  onChange={(e) => {
                    setPriceInput(e.target.value);
                    setError(null);
                  }}
                  placeholder="0.00"
                  className="w-full h-11 px-3 rounded-xl border border-[#CFC1AA] bg-[#FFFDF8] font-mono-num text-sm font-bold text-[#261812] placeholder:text-[#8C7A6B] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-[#1D4ED8]"
                />
              </div>

              <div>
                <label
                  htmlFor="new-item-cost"
                  className="block text-xs font-semibold text-[#665347] mb-1"
                >
                  Estimated Unit Cost (₱)
                </label>
                <input
                  id="new-item-cost"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  value={costInput}
                  onChange={(e) => {
                    setCostInput(e.target.value);
                    setError(null);
                  }}
                  placeholder="0.00"
                  className="w-full h-11 px-3 rounded-xl border border-[#CFC1AA] bg-[#FFFDF8] font-mono-num text-sm font-bold text-[#261812] placeholder:text-[#8C7A6B] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-[#1D4ED8]"
                />
              </div>
            </div>

            <div
              data-testid="estimated-profit-preview"
              className="rounded-xl bg-[#F7F2E8] border border-[#DDD1BE] px-3.5 py-2.5 flex items-center justify-between gap-2"
            >
              <span className="text-xs font-semibold text-[#665347]">
                Estimated Profit (Price − Cost)
              </span>
              <span
                className={`font-mono-num text-sm font-extrabold tabular-nums ${
                  estimatedProfit > 0
                    ? 'text-emerald-700'
                    : estimatedProfit < 0
                      ? 'text-rose-700'
                      : 'text-[#261812]'
                }`}
              >
                {formatPeso(estimatedProfit)}
                {safePrice > 0 ? ` (${marginPct}%)` : ''}
              </span>
            </div>

            <div>
              <span className="block text-xs font-semibold text-[#665347] mb-1.5">
                Category
              </span>
              <div className="grid grid-cols-4 gap-1 p-1 bg-[#EFE7D8] rounded-xl">
                {MENU_CATEGORIES.map((cat) => {
                  const active = category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setCategory(cat as MenuCategory)}
                      className={`min-h-[44px] rounded-lg text-xs font-bold transition-colors whitespace-nowrap px-1 ${
                        active
                          ? 'bg-[#FFFDF8] text-[#1D4ED8] shadow-2xs'
                          : 'text-[#665347] hover:text-[#261812]'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2.5 pt-1 border-t border-[#EAE0CE]">
              <span className="block text-xs font-bold text-[#261812]">
                Countable Inventory Linking
              </span>

              <div
                role="radiogroup"
                aria-label="Countable Inventory Linking"
                className="grid grid-cols-3 gap-1.5"
              >
                {(
                  [
                    { id: 'none', label: 'No tracking' },
                    { id: 'existing', label: 'Link existing' },
                    { id: 'new', label: 'Create new' },
                  ] as const
                ).map((opt) => {
                  const selected = linkingMode === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => {
                        setLinkingMode(opt.id);
                        setError(null);
                      }}
                      className={`min-h-[44px] px-2 rounded-xl border text-xs font-bold transition-colors whitespace-nowrap ${
                        selected
                          ? 'bg-[#EFF6FF] border-[#1D4ED8] text-[#1E40AF]'
                          : 'bg-[#FFFDF8] border-[#DDD1BE] text-[#665347] hover:text-[#261812] hover:bg-[#F7F2E8]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {linkingMode === 'none' && (
                <p className="text-xs text-[#665347] bg-[#F7F2E8] border border-[#DDD1BE] rounded-xl px-3 py-2.5">
                  No stock tracking needed. This item will stay open for orders
                  without deducting inventory.
                </p>
              )}

              {linkingMode === 'existing' && (
                <div className="space-y-2.5 bg-[#F7F2E8] border border-[#DDD1BE] rounded-2xl p-3">
                  {inventory.length === 0 ? (
                    <p className="text-xs text-[#665347]">
                      No inventory items available yet. Switch to “Create new” to
                      add one.
                    </p>
                  ) : (
                    <>
                      {existingRows.map((row, idx) => (
                        <div
                          key={row.rowId}
                          className="flex items-end gap-2"
                        >
                          <div className="flex-1 min-w-0">
                            <label
                              htmlFor={`existing-inv-select-${row.rowId}`}
                              className="block text-[11px] font-semibold text-[#665347] mb-1"
                            >
                              {idx === 0 ? 'Inventory Item' : `Linked Stock #${idx + 1}`}
                            </label>
                            <select
                              id={`existing-inv-select-${row.rowId}`}
                              value={row.item_id}
                              onChange={(e) =>
                                handleUpdateExistingRow(row.rowId, {
                                  item_id: e.target.value,
                                })
                              }
                              className="w-full h-11 px-2.5 rounded-xl border border-[#CFC1AA] bg-[#FFFDF8] text-xs font-semibold text-[#261812] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                            >
                              {inventory.map((inv) => (
                                <option key={inv.item_id} value={inv.item_id}>
                                  {inv.name} ({inv.stock} {inv.unit})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="w-20 shrink-0">
                            <label
                              htmlFor={`existing-inv-qty-${row.rowId}`}
                              className="block text-[11px] font-semibold text-[#665347] mb-1"
                            >
                              Qty / order
                            </label>
                            <input
                              id={`existing-inv-qty-${row.rowId}`}
                              type="number"
                              inputMode="numeric"
                              min="1"
                              step="1"
                              value={row.qty}
                              onChange={(e) =>
                                handleUpdateExistingRow(row.rowId, {
                                  qty: e.target.value,
                                })
                              }
                              className="w-full h-11 px-2.5 rounded-xl border border-[#CFC1AA] bg-[#FFFDF8] font-mono-num text-sm font-bold text-[#261812] text-center focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                            />
                          </div>

                          {existingRows.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveExistingRow(row.rowId)}
                              aria-label={`Remove stock link ${idx + 1}`}
                              className="min-h-[44px] min-w-[44px] rounded-xl border border-[#DDD1BE] bg-[#FFFDF8] text-[#665347] hover:text-rose-700 hover:bg-rose-50 flex items-center justify-center shrink-0"
                            >
                              <Trash2 className="w-4 h-4" aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={handleAddExistingRow}
                        className="w-full min-h-[44px] rounded-xl border border-dashed border-[#B7A68E] bg-[#FFFDF8] hover:bg-[#EFE7D8] text-xs font-bold text-[#1D4ED8] inline-flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Add Another Stock Link</span>
                      </button>
                    </>
                  )}
                </div>
              )}

              {linkingMode === 'new' && (
                <div className="space-y-3 bg-[#F7F2E8] border border-[#DDD1BE] rounded-2xl p-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label
                        htmlFor="new-stock-name"
                        className="block text-[11px] font-semibold text-[#665347] mb-1"
                      >
                        New Stock Name <span className="text-rose-600">*</span>
                      </label>
                      <input
                        id="new-stock-name"
                        type="text"
                        value={newStockName}
                        onChange={(e) => {
                          setNewStockName(e.target.value);
                          setError(null);
                        }}
                        placeholder="e.g. Buko Cups"
                        className="w-full h-11 px-3 rounded-xl border border-[#CFC1AA] bg-[#FFFDF8] text-xs font-semibold text-[#261812] placeholder:text-[#8C7A6B] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="new-stock-unit"
                        className="block text-[11px] font-semibold text-[#665347] mb-1"
                      >
                        Unit
                      </label>
                      <input
                        id="new-stock-unit"
                        type="text"
                        value={newStockUnit}
                        onChange={(e) => setNewStockUnit(e.target.value)}
                        placeholder="pcs"
                        className="w-full h-11 px-2.5 rounded-xl border border-[#CFC1AA] bg-[#FFFDF8] text-xs font-semibold text-[#261812] placeholder:text-[#8C7A6B] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label
                        htmlFor="new-stock-qty"
                        className="block text-[11px] font-semibold text-[#665347] mb-1"
                      >
                        Initial Stock
                      </label>
                      <input
                        id="new-stock-qty"
                        type="number"
                        inputMode="numeric"
                        min="0"
                        step="1"
                        value={newStockQty}
                        onChange={(e) => {
                          setNewStockQty(e.target.value);
                          setError(null);
                        }}
                        className="w-full h-11 px-2.5 rounded-xl border border-[#CFC1AA] bg-[#FFFDF8] font-mono-num text-sm font-bold text-[#261812] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="new-stock-alert"
                        className="block text-[11px] font-semibold text-[#665347] mb-1"
                      >
                        Low Alert
                      </label>
                      <input
                        id="new-stock-alert"
                        type="number"
                        inputMode="numeric"
                        min="0"
                        step="1"
                        value={newLowAlert}
                        onChange={(e) => {
                          setNewLowAlert(e.target.value);
                          setError(null);
                        }}
                        className="w-full h-11 px-2.5 rounded-xl border border-[#CFC1AA] bg-[#FFFDF8] font-mono-num text-sm font-bold text-[#261812] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="new-stock-deduct-qty"
                        className="block text-[11px] font-semibold text-[#665347] mb-1"
                      >
                        Qty / order
                      </label>
                      <input
                        id="new-stock-deduct-qty"
                        type="number"
                        inputMode="numeric"
                        min="1"
                        step="1"
                        value={newDeductQty}
                        onChange={(e) => {
                          setNewDeductQty(e.target.value);
                          setError(null);
                        }}
                        className="w-full h-11 px-2.5 rounded-xl border border-[#CFC1AA] bg-[#FFFDF8] font-mono-num text-sm font-bold text-[#261812] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs font-semibold text-rose-700"
              >
                {error}
              </div>
            )}
          </div>

          <div className="px-5 py-3.5 border-t border-[#DDD1BE] bg-[#FFFDF8] flex items-center gap-2 shrink-0 pb-safe">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[46px] rounded-xl border border-[#DDD1BE] bg-[#FFFDF8] text-[#261812] font-semibold text-sm hover:bg-[#F7F2E8]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-[1.4] min-h-[46px] rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] active:scale-[0.99] text-white font-bold text-sm transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
            >
              {isSubmitting ? 'Saving...' : 'Save Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
