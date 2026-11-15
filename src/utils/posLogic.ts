import type {
  CartItem,
  ExpenseRecord,
  InventoryDeduction,
  InventoryItem,
  MenuItem,
  OrderLineItem,
  OrderRecord,
  PaymentMethod,
} from '../types/pos';

export function formatPeso(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const isNegative = safe < 0;
  const abs = Math.abs(safe);
  const formatted = abs.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return isNegative ? `-₱${formatted}` : `₱${formatted}`;
}

export function formatPesoCompact(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const isNegative = safe < 0;
  const abs = Math.abs(safe);
  const hasDecimals = Math.round(abs * 100) % 100 !== 0;
  const formatted = abs.toLocaleString('en-PH', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  });
  return isNegative ? `-₱${formatted}` : `₱${formatted}`;
}

export function computeMenuServingsAvailable(
  menuItem: MenuItem,
  inventory: InventoryItem[],
): number {
  if (menuItem.deductions.length === 0) return Infinity;
  let minServings = Infinity;
  for (const d of menuItem.deductions) {
    const inv = inventory.find((item) => item.item_id === d.item_id);
    if (!inv || d.qty <= 0) continue;
    const possible = Math.floor(Math.max(0, inv.stock) / d.qty);
    if (possible < minServings) {
      minServings = possible;
    }
  }
  return minServings;
}

export function computeCartTotals(cart: CartItem[]): {
  itemCount: number;
  totalAmount: number;
  deductions: InventoryDeduction[];
  itemsSummary: string;
  lineItems: OrderLineItem[];
} {
  let itemCount = 0;
  let totalAmount = 0;
  const deductionMap = new Map<string, number>();
  const summaryParts: string[] = [];
  const lineItems: OrderLineItem[] = [];

  for (const item of cart) {
    if (item.qty <= 0) continue;
    itemCount += item.qty;
    const lineTotal = item.unit_price * item.qty;
    totalAmount += lineTotal;
    summaryParts.push(`${item.qty}x ${item.name}`);
    lineItems.push({
      menu_item_id: item.menu_item_id,
      name: item.name,
      qty: item.qty,
      unit_price: item.unit_price,
      line_total: lineTotal,
    });

    for (const d of item.deductions) {
      const prev = deductionMap.get(d.item_id) ?? 0;
      deductionMap.set(d.item_id, prev + d.qty * item.qty);
    }
  }

  const deductions: InventoryDeduction[] = Array.from(deductionMap.entries()).map(
    ([item_id, qty]) => ({ item_id, qty }),
  );

  return {
    itemCount,
    totalAmount,
    deductions,
    itemsSummary: summaryParts.join(', '),
    lineItems,
  };
}

export function applyInventoryDeductions(
  inventory: InventoryItem[],
  deductions: InventoryDeduction[],
  nowIso: string = new Date().toISOString(),
): InventoryItem[] {
  const deductMap = new Map<string, number>();
  for (const d of deductions) {
    deductMap.set(d.item_id, (deductMap.get(d.item_id) ?? 0) + d.qty);
  }

  return inventory.map((item) => {
    const deductQty = deductMap.get(item.item_id);
    if (!deductQty) return item;
    return {
      ...item,
      stock: Math.max(0, item.stock - deductQty),
      updated_at: nowIso,
    };
  });
}

export function applyRestock(
  inventory: InventoryItem[],
  itemId: string,
  addQty: number,
  nowIso: string = new Date().toISOString(),
): InventoryItem[] {
  if (!Number.isFinite(addQty) || addQty <= 0) return inventory;
  return inventory.map((item) =>
    item.item_id === itemId
      ? {
          ...item,
          stock: item.stock + Math.round(addQty),
          updated_at: nowIso,
        }
      : item,
  );
}

export type StockHealth = 'out' | 'critical' | 'low' | 'ok';

export function getStockStatus(stock: number, lowStockAlert: number): StockHealth {
  if (stock <= 0) return 'out';
  if (stock < lowStockAlert) {
    if (stock <= Math.max(1, Math.floor(lowStockAlert / 2))) {
      return 'critical';
    }
    return 'low';
  }
  return 'ok';
}

export function validateCheckout(params: {
  totalAmount: number;
  paymentMethod: PaymentMethod;
  amountTendered: number;
  gcashRef: string;
}): { valid: boolean; error?: string; changeDue: number } {
  const { totalAmount, paymentMethod, amountTendered, gcashRef } = params;
  if (totalAmount <= 0) {
    return { valid: false, error: 'Cart is empty.', changeDue: 0 };
  }

  if (paymentMethod === 'GCash') {
    const trimmedRef = gcashRef.trim();
    if (!trimmedRef) {
      return {
        valid: false,
        error: 'GCash Reference Number is required.',
        changeDue: 0,
      };
    }
    if (trimmedRef.length < 4) {
      return {
        valid: false,
        error: 'Enter a valid GCash Reference Number (at least 4 characters).',
        changeDue: 0,
      };
    }
    return { valid: true, changeDue: 0 };
  }

  if (!Number.isFinite(amountTendered) || amountTendered < totalAmount) {
    return {
      valid: false,
      error: `Cash tendered must be at least ${formatPeso(totalAmount)}.`,
      changeDue: 0,
    };
  }

  const changeDue = Math.round((amountTendered - totalAmount) * 100) / 100;
  return { valid: true, changeDue };
}

export function getQuickCashOptions(totalAmount: number): number[] {
  const candidates = [totalAmount, 50, 100, 200, 500, 1000];
  const filtered = candidates.filter((amt) => amt >= totalAmount);
  const unique = Array.from(new Set(filtered)).sort((a, b) => a - b);
  return unique.slice(0, 4);
}

export function computeFinancialSummary(
  orders: OrderRecord[],
  expenses: ExpenseRecord[],
): {
  grossSales: number;
  cashSales: number;
  gcashSales: number;
  totalExpenses: number;
  netProfit: number;
  orderCount: number;
  cashCount: number;
  gcashCount: number;
} {
  let grossSales = 0;
  let cashSales = 0;
  let gcashSales = 0;
  let cashCount = 0;
  let gcashCount = 0;

  for (const order of orders) {
    const amt = Number(order.total_amount) || 0;
    grossSales += amt;
    if (order.payment_method === 'GCash') {
      gcashSales += amt;
      gcashCount += 1;
    } else {
      cashSales += amt;
      cashCount += 1;
    }
  }

  let totalExpenses = 0;
  for (const exp of expenses) {
    totalExpenses += Number(exp.amount) || 0;
  }

  return {
    grossSales,
    cashSales,
    gcashSales,
    totalExpenses,
    netProfit: grossSales - totalExpenses,
    orderCount: orders.length,
    cashCount,
    gcashCount,
  };
}

export function generateOrderId(existingOrders: OrderRecord[]): string {
  let maxNum = 1000;
  for (const order of existingOrders) {
    const match = /KS-(\d+)/i.exec(order.order_id);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > maxNum) maxNum = n;
    }
  }
  return `KS-${maxNum + 1}`;
}

function escapeCsvCell(value: string | number): string {
  const str = String(value ?? '');
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function formatSalesCsv(
  orders: OrderRecord[],
  expenses: ExpenseRecord[],
): string {
  const summary = computeFinancialSummary(orders, expenses);
  const lines: string[] = [];

  lines.push('SECTION,Order ID / Expense ID,Date Time,Details / Items,Category / Method,GCash Ref,Cash Tendered,Change Due,Amount (PHP)');

  for (const o of orders) {
    lines.push(
      [
        'SALE',
        o.order_id,
        o.created_at,
        o.items,
        o.payment_method,
        o.gcash_ref || '',
        o.amount_tendered.toFixed(2),
        o.change_due.toFixed(2),
        o.total_amount.toFixed(2),
      ]
        .map(escapeCsvCell)
        .join(','),
    );
  }

  for (const e of expenses) {
    lines.push(
      [
        'EXPENSE',
        e.expense_id,
        e.created_at,
        e.description,
        e.category,
        '',
        '',
        '',
        (-Math.abs(e.amount)).toFixed(2),
      ]
        .map(escapeCsvCell)
        .join(','),
    );
  }

  lines.push('');
  lines.push(['SUMMARY', 'Gross Sales', summary.grossSales.toFixed(2)].map(escapeCsvCell).join(','));
  lines.push(['SUMMARY', 'Cash Sales', summary.cashSales.toFixed(2)].map(escapeCsvCell).join(','));
  lines.push(['SUMMARY', 'GCash Sales', summary.gcashSales.toFixed(2)].map(escapeCsvCell).join(','));
  lines.push(['SUMMARY', 'Total Expenses', summary.totalExpenses.toFixed(2)].map(escapeCsvCell).join(','));
  lines.push(['SUMMARY', 'Net Profit', summary.netProfit.toFixed(2)].map(escapeCsvCell).join(','));

  return lines.join('\n');
}

function pickField<T = unknown>(obj: Record<string, unknown>, keys: string[]): T | undefined {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
      return obj[key] as T;
    }
  }
  return undefined;
}

export function parseItemsStringToLineItems(itemsStr: string): OrderLineItem[] {
  if (!itemsStr) return [];
  return itemsStr
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part, idx) => {
      const match = /^(\d+)\s*x\s+(.+)$/i.exec(part);
      const qty = match ? parseInt(match[1], 10) : 1;
      const name = match ? match[2].trim() : part;
      return {
        menu_item_id: `parsed-${idx}`,
        name,
        qty,
        unit_price: 0,
        line_total: 0,
      };
    });
}

export function normalizeSheetDataResponse(
  raw: unknown,
  fallbackInventory: InventoryItem[],
): {
  inventory: InventoryItem[];
  orders: OrderRecord[];
  expenses: ExpenseRecord[];
} {
  const rootObj =
    raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const container =
    rootObj.data && typeof rootObj.data === 'object'
      ? (rootObj.data as Record<string, unknown>)
      : rootObj;

  const rawInv = Array.isArray(container.inventory ?? container.Inventory)
    ? ((container.inventory ?? container.Inventory) as Record<string, unknown>[])
    : [];

  const inventory: InventoryItem[] =
    rawInv.length > 0
      ? rawInv.map((row, index) => {
          const itemId = String(
            pickField(row, ['item_id', 'Item_ID', 'id', 'ID']) ?? `INV-${index + 1}`,
          );
          const fallback = fallbackInventory.find((f) => f.item_id === itemId);
          return {
            item_id: itemId,
            name: String(
              pickField(row, ['name', 'Name', 'item_name', 'Item_Name']) ??
                fallback?.name ??
                itemId,
            ),
            unit: String(
              pickField(row, ['unit', 'Unit']) ?? fallback?.unit ?? 'pcs',
            ),
            stock: Number(
              pickField(row, ['stock', 'Stock', 'qty', 'Qty', 'quantity', 'Quantity']) ?? 0,
            ),
            low_stock_alert: Number(
              pickField(row, ['low_stock_alert', 'Low_Stock_Alert', 'min_stock']) ??
                fallback?.low_stock_alert ??
                15,
            ),
            updated_at: String(
              pickField(row, ['updated_at', 'Updated_At', 'timestamp']) ??
                new Date().toISOString(),
            ),
          };
        })
      : fallbackInventory;

  const rawOrders = Array.isArray(container.orders ?? container.Orders)
    ? ((container.orders ?? container.Orders) as Record<string, unknown>[])
    : [];

  const orders: OrderRecord[] = rawOrders.map((row, idx) => {
    const itemsStr = String(pickField(row, ['items', 'Items']) ?? '');
    const methodRaw = String(
      pickField(row, ['payment_method', 'Payment_Method', 'method']) ?? 'Cash',
    );
    const payment_method: PaymentMethod =
      methodRaw.toLowerCase() === 'gcash' ? 'GCash' : 'Cash';
    const total = Number(
      pickField(row, ['total_amount', 'Total_Amount', 'total']) ?? 0,
    );
    const tendered = Number(
      pickField(row, ['amount_tendered', 'Amount_Tendered']) ?? total,
    );
    const change = Number(
      pickField(row, ['change_due', 'Change_Due']) ?? Math.max(0, tendered - total),
    );
    const rawLineItems = row.line_items;
    const line_items = Array.isArray(rawLineItems)
      ? (rawLineItems as OrderLineItem[])
      : parseItemsStringToLineItems(itemsStr);

    return {
      order_id: String(
        pickField(row, ['order_id', 'Order_ID', 'id']) ?? `KS-${1000 + idx}`,
      ),
      created_at: String(
        pickField(row, ['created_at', 'Created_At', 'timestamp', 'Timestamp', 'date']) ??
          new Date().toISOString(),
      ),
      items: itemsStr,
      line_items,
      total_amount: total,
      payment_method,
      gcash_ref: String(pickField(row, ['gcash_ref', 'GCash_Ref']) ?? ''),
      amount_tendered: tendered,
      change_due: change,
      deductions: Array.isArray(row.deductions)
        ? (row.deductions as InventoryDeduction[])
        : [],
      synced: true,
    };
  });

  const rawExpenses = Array.isArray(container.expenses ?? container.Expenses)
    ? ((container.expenses ?? container.Expenses) as Record<string, unknown>[])
    : [];

  const expenses: ExpenseRecord[] = rawExpenses.map((row, idx) => ({
    expense_id: String(
      pickField(row, ['expense_id', 'Expense_ID', 'id']) ?? `EXP-${1000 + idx}`,
    ),
    created_at: String(
      pickField(row, ['created_at', 'Created_At', 'timestamp', 'Timestamp', 'date']) ??
        new Date().toISOString(),
    ),
    description: String(
      pickField(row, ['description', 'Description', 'item']) ?? 'Expense',
    ),
    category: String(
      pickField(row, ['category', 'Category']) ?? 'Misc',
    ),
    amount: Number(pickField(row, ['amount', 'Amount']) ?? 0),
    synced: true,
  }));

  return {
    inventory,
    orders: orders.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    ),
    expenses: expenses.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    ),
  };
}
