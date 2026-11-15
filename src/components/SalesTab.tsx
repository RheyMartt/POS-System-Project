import { ChevronRight, Download, ReceiptText } from 'lucide-react';
import type { ExpenseRecord, OrderRecord } from '../types/pos';
import {
  computeFinancialSummary,
  formatPeso,
  formatSalesCsv,
} from '../utils/posLogic';

interface SalesTabProps {
  orders: OrderRecord[];
  expenses: ExpenseRecord[];
  onSelectOrder: (order: OrderRecord) => void;
}

export function SalesTab({
  orders,
  expenses,
  onSelectOrder,
}: SalesTabProps) {
  const summary = computeFinancialSummary(orders, expenses);
  const cashPct =
    summary.grossSales > 0
      ? Math.round((summary.cashSales / summary.grossSales) * 100)
      : 50;
  const gcashPct = summary.grossSales > 0 ? 100 - cashPct : 50;

  const handleExportCsv = () => {
    const csv = formatSalesCsv(orders, expenses);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.setAttribute('download', `kanto-siomai-sales-${dateStamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="pb-24 px-4 pt-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Sales & Profit
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
            {summary.orderCount} {summary.orderCount === 1 ? 'order' : 'orders'} ·{' '}
            {expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="min-h-[44px] px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-[0.98] text-slate-800 text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-2xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
        >
          <Download className="w-4 h-4 text-slate-600" aria-hidden="true" />
          <span>Export to CSV</span>
        </button>
      </div>

      <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs font-semibold text-slate-300">
            Net Profit (Gross − Expenses)
          </span>
          <span
            data-testid="net-profit-value"
            className={`font-mono-num text-2xl font-extrabold tabular-nums ${
              summary.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatPeso(summary.netProfit)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
          <div>
            <span className="block text-[11px] font-medium text-slate-400">
              Gross Sales
            </span>
            <span
              data-testid="gross-sales-value"
              className="font-mono-num text-lg font-bold text-white"
            >
              {formatPeso(summary.grossSales)}
            </span>
          </div>
          <div>
            <span className="block text-[11px] font-medium text-slate-400">
              Total Expenses
            </span>
            <span
              data-testid="total-expenses-value"
              className="font-mono-num text-lg font-bold text-rose-300"
            >
              {formatPeso(summary.totalExpenses)}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
          <span>Payment Breakdown</span>
          <span className="text-slate-500 font-normal tabular-nums">
            {summary.cashCount} Cash · {summary.gcashCount} GCash
          </span>
        </div>

        <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden flex">
          <div
            className="h-full bg-emerald-600 transition-all"
            style={{ width: `${cashPct}%` }}
          />
          <div
            className="h-full bg-[#007DFE] transition-all"
            style={{ width: `${gcashPct}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <span className="text-[11px] font-semibold text-emerald-700 block">
              Cash ({cashPct}%)
            </span>
            <span
              data-testid="cash-sales-value"
              className="font-mono-num text-sm font-bold text-slate-900"
            >
              {formatPeso(summary.cashSales)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-semibold text-[#007DFE] block">
              GCash ({gcashPct}%)
            </span>
            <span
              data-testid="gcash-sales-value"
              className="font-mono-num text-sm font-bold text-slate-900"
            >
              {formatPeso(summary.gcashSales)}
            </span>
          </div>
        </div>
      </div>

      <section aria-label="Transaction history" className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">
            Transaction History
          </h2>
          <span className="text-xs text-slate-500">Tap for receipt</span>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <ReceiptText className="w-8 h-8 text-slate-300 mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm font-semibold text-slate-700">
              No completed orders yet
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Orders completed in POS will appear here.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
            {orders.map((order) => {
              const timeStr = (() => {
                const d = new Date(order.created_at);
                if (Number.isNaN(d.getTime())) return order.created_at;
                return d.toLocaleString('en-PH', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                });
              })();

              return (
                <button
                  key={order.order_id}
                  type="button"
                  onClick={() => onSelectOrder(order)}
                  aria-label={`View receipt for ${order.order_id} (${formatPeso(order.total_amount)})`}
                  className="w-full min-h-[60px] px-4 py-3 text-left hover:bg-slate-50 active:bg-slate-100 transition-colors flex items-center justify-between gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono-num text-xs font-bold text-slate-900">
                        {order.order_id}
                      </span>
                      <span aria-hidden="true" className="text-slate-300">
                        ·
                      </span>
                      <span
                        className={`text-xs font-bold ${
                          order.payment_method === 'GCash'
                            ? 'text-[#007DFE]'
                            : 'text-emerald-700'
                        }`}
                      >
                        {order.payment_method}
                      </span>
                      <span aria-hidden="true" className="text-slate-300">
                        ·
                      </span>
                      <span className="text-xs text-slate-500 tabular-nums truncate">
                        {timeStr}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 truncate">
                      {order.items}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono-num text-sm font-bold text-slate-900">
                      {formatPeso(order.total_amount)}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
