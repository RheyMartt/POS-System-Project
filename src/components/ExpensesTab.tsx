import { useState } from 'react';
import { PlusCircle, Receipt } from 'lucide-react';
import { EXPENSE_CATEGORIES } from '../data/menuAndSeed';
import type { ExpenseCategory, ExpenseRecord } from '../types/pos';
import { formatPeso } from '../utils/posLogic';

interface ExpensesTabProps {
  expenses: ExpenseRecord[];
  isSubmitting: boolean;
  onAddExpense: (data: {
    description: string;
    category: ExpenseCategory;
    amount: number;
  }) => Promise<void> | void;
}

export function ExpensesTab({
  expenses,
  isSubmitting,
  onAddExpense,
}: ExpensesTabProps) {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Ingredients');
  const [amountInput, setAmountInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = description.trim();
    const amount = parseFloat(amountInput);

    if (!trimmed) {
      setError('Enter an expense description.');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter an amount greater than ₱0.');
      return;
    }

    setError(null);
    await onAddExpense({
      description: trimmed,
      category,
      amount: Math.round(amount * 100) / 100,
    });
    setDescription('');
    setAmountInput('');
  };

  return (
    <div className="pb-24 px-4 pt-4 space-y-5">
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#261812]">
            Expenses
          </h1>
          <p className="text-xs text-[#665347] mt-0.5">
            Track ingredients, packaging & daily stall costs
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className="block text-[11px] font-medium text-[#665347]">
            Total Logged
          </span>
          <span className="font-mono-num text-base font-extrabold text-rose-700">
            {formatPeso(totalExpenses)}
          </span>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-[#FFFDF8] rounded-2xl border border-[#DDD1BE] p-4 shadow-2xs space-y-3"
      >
        <h2 className="text-sm font-bold text-[#261812]">Log Daily Expense</h2>

        <div>
          <label
            htmlFor="expense-description"
            className="block text-xs font-semibold text-[#665347] mb-1"
          >
            Description
          </label>
          <input
            id="expense-description"
            type="text"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setError(null);
            }}
            placeholder="e.g. Calamansi & Chili, Tube Ice"
            className="w-full h-11 px-3 rounded-xl border border-[#CFC1AA] bg-[#FFFDF8] text-sm text-[#261812] placeholder:text-[#8C7A6B] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-[#1D4ED8]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="expense-category"
              className="block text-xs font-semibold text-[#665347] mb-1"
            >
              Category
            </label>
            <select
              id="expense-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full h-11 px-3 rounded-xl border border-[#CFC1AA] bg-[#FFFDF8] text-sm text-[#261812] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-[#1D4ED8]"
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="expense-amount"
              className="block text-xs font-semibold text-[#665347] mb-1"
            >
              Amount (₱)
            </label>
            <input
              id="expense-amount"
              type="number"
              inputMode="decimal"
              min="0.01"
              step="any"
              value={amountInput}
              onChange={(e) => {
                setAmountInput(e.target.value);
                setError(null);
              }}
              placeholder="0.00"
              className="w-full h-11 px-3 rounded-xl border border-[#CFC1AA] bg-[#FFFDF8] font-mono-num text-sm font-bold text-[#261812] placeholder:text-[#8C7A6B] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-[#1D4ED8]"
            />
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full min-h-[46px] rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] active:scale-[0.99] text-white font-bold text-sm inline-flex items-center justify-center gap-2 transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
        >
          <PlusCircle className="w-4 h-4" aria-hidden="true" />
          <span>{isSubmitting ? 'Saving Expense...' : 'Add Expense'}</span>
        </button>
      </form>

      <section aria-label="Logged expenses" className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#261812]">Expense History</h2>
          <span className="text-xs text-[#665347] tabular-nums">
            {expenses.length} {expenses.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        {expenses.length === 0 ? (
          <div className="bg-[#FFFDF8] rounded-2xl border border-[#DDD1BE] p-8 text-center">
            <Receipt className="w-8 h-8 text-[#C5B69F] mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm font-semibold text-[#261812]">
              No expenses logged yet
            </p>
            <p className="text-xs text-[#665347] mt-1">
              Add stall costs above to track net profit accurately.
            </p>
          </div>
        ) : (
          <div className="bg-[#FFFDF8] rounded-2xl border border-[#DDD1BE] divide-y divide-[#EAE0CE] overflow-hidden">
            {expenses.map((exp) => {
              const timeStr = (() => {
                const d = new Date(exp.created_at);
                if (Number.isNaN(d.getTime())) return exp.created_at;
                return d.toLocaleString('en-PH', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                });
              })();

              return (
                <div
                  key={exp.expense_id}
                  className="px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#261812] truncate">
                      {exp.description}
                    </p>
                    <p className="text-xs text-[#665347] mt-0.5 flex items-center gap-1.5">
                      <span>{exp.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{timeStr}</span>
                    </p>
                  </div>

                  <span className="font-mono-num text-sm font-bold text-rose-700 whitespace-nowrap shrink-0">
                    -{formatPeso(exp.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
