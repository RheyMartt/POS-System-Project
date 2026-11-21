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

export function computeUnitMargin(price: number, cost: number): number {
  const safePrice = Number.isFinite(price) ? price : 0;
  const safeCost = Number.isFinite(cost) ? cost : 0;
  return Math.round((safePrice - safeCost) * 100) / 100;
}

export function requiresSiomaiFlavor(menuItem: MenuItem): boolean {
  if (!menuItem || !menuItem.name) return false;
  const lower = menuItem.name.toLowerCase();
  return lower.includes('siomai w/ rice') || lower.includes('siomai rice');
}

const SIOMAI_FLAVOR_INV_IDS = ['INV-1', 'INV-2', 'INV-3', 'INV-4', 'INV-5'];

export function computeMenuServingsAvailable(
  menuItem: MenuItem,
  inventory: InventoryItem[],
): number {
  const isSiomaiRice = requiresSiomaiFlavor(menuItem);

  let baseServings = Infinity;
  if (menuItem.deductions.length > 0) {
    for (const d of menuItem.deductions) {
      if (d.qty <= 0) continue;
      const inv = inventory.find((item) => item.item_id === d.item_id);
      if (!inv) return 0;
      const possible = Math.floor(Math.max(0, inv.stock) / d.qty);
      if (possible < baseServings) {
        baseServings = possible;
      }
    }
  }

  if (!isSiomaiRice) {
    return baseServings;
  }

  // Calculate total available servings across all 5 siomai flavors (4 pcs required per order)
  let maxFlavorServings = 0;
  let totalFlavorServings = 0;
  for (const flavorId of SIOMAI_FLAVOR_INV_IDS) {
    const inv = inventory.find((item) => item.item_id === flavorId);
    const stock = inv ? Math.max(0, inv.stock) : 0;
    const servings = Math.floor(stock / 4);
    if (servings > maxFlavorServings) {
      maxFlavorServings = servings;
    }
    totalFlavorServings += servings;
  }

  // If no single flavor has at least 4 pieces left, no servings available
  if (maxFlavorServings <= 0) {
    return 0;
  }

  return Math.min(baseServings, totalFlavorServings);
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

export function generateInventoryItemId(
  existingInventory: InventoryItem[],
): string {
  let maxNum = 0;
  for (const item of existingInventory) {
    const match = /INV-(\d+)/i.exec(item.item_id);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > maxNum) maxNum = n;
    }
  }
  return `INV-${maxNum + 1}`;
}

export function generateMenuItemId(
  name: string,
  existingMenu: MenuItem[],
): string {
  const baseSlug =
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'item';

  const existingIds = new Set(existingMenu.map((m) => m.id));
  if (!existingIds.has(baseSlug)) return baseSlug;

  let counter = 2;
  while (existingIds.has(`${baseSlug}-${counter}`)) {
    counter += 1;
  }
  return `${baseSlug}-${counter}`;
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

function pickField<T = unknown>(
  obj: Record<string, unknown>,
  candidateKeys: string[],
): T | undefined {
  if (!obj || typeof obj !== 'object') return undefined;

  // 1. Try exact matches first
  for (const k of candidateKeys) {
    if (obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== '') {
      return obj[k] as T;
    }
  }

  // 2. Try normalized case-insensitive & space-insensitive key lookup
  const candidateNormMap = new Map<string, string>();
  for (const k of candidateKeys) {
    const norm = k.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!candidateNormMap.has(norm)) {
      candidateNormMap.set(norm, k);
    }
  }

  for (const actualKey of Object.keys(obj)) {
    const val = obj[actualKey];
    if (val === undefined || val === null || String(val).trim() === '') continue;
    const actualNorm = actualKey.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (candidateNormMap.has(actualNorm)) {
      return val as T;
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

export function parseDeductionsJson(raw: unknown): InventoryDeduction[] {
  let parsed: unknown = raw;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(parsed)) return [];

  const result: InventoryDeduction[] = [];
  for (const entry of parsed) {
    if (!entry || typeof entry !== 'object') continue;
    const obj = entry as Record<string, unknown>;
    const itemId = String(
      pickField(obj, ['item_id', 'Item_ID', 'id', 'ID']) ?? '',
    ).trim();
    const qty = Number(pickField(obj, ['qty', 'Qty', 'quantity', 'Quantity']) ?? 0);
    if (itemId && Number.isFinite(qty) && qty > 0) {
      result.push({ item_id: itemId, qty });
    }
  }
  return result;
}

export function normalizeSheetDataResponse(
  raw: unknown,
  fallbackInventory: InventoryItem[],
  fallbackMenu: MenuItem[] = [],
): {
  inventory: InventoryItem[];
  orders: OrderRecord[];
  expenses: ExpenseRecord[];
  menu: MenuItem[];
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

  const validInvRows = rawInv.filter((row) => {
    if (!row || typeof row !== 'object') return false;
    const keys = Object.keys(row);
    if (keys.length === 0) return false;
    return keys.some(
      (k) => row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '',
    );
  });

  const mappedInv: (InventoryItem | null)[] = validInvRows.map((row, index) => {
    const rawId = pickField<string>(row, [
      'item_id',
      'Item_ID',
      'id',
      'ID',
      'item_code',
      'code',
    ]);
    const rawName = pickField<string>(row, [
      'name',
      'Name',
      'item_name',
      'Item_Name',
      'title',
      'item',
    ]);

    if (!rawId && !rawName) return null;

    const itemId = String(
      rawId ??
        rawName?.toLowerCase().replace(/[^a-z0-9]+/g, '-') ??
        `INV-${index + 1}`,
    ).trim();

    const fallback = fallbackInventory.find(
      (f) =>
        f.item_id.toLowerCase() === itemId.toLowerCase() ||
        (rawName ? f.name.toLowerCase() === rawName.toLowerCase() : false),
    );

    const name = String(rawName ?? fallback?.name ?? itemId).trim();
    const unit = String(
      pickField(row, [
        'unit',
        'Unit',
        'unit_of_measure',
        'uom',
      ]) ??
        fallback?.unit ??
        'pcs',
    ).trim();

    const rawStock = pickField(row, [
      'stock',
      'Stock',
      'current_stock',
      'Current_Stock',
      'qty',
      'Qty',
      'quantity',
      'Quantity',
      'count',
      'Count',
      'balance',
      'Balance',
    ]);
    const parsedStock = rawStock !== undefined ? Number(rawStock) : NaN;
    const stock = Number.isFinite(parsedStock)
      ? parsedStock
      : (fallback?.stock ?? 0);

    const rawAlert = pickField(row, [
      'low_stock_alert',
      'Low_Stock_Alert',
      'min_stock',
      'Min_Stock',
      'alert_level',
      'Alert_Level',
      'low_alert',
    ]);
    const parsedAlert = rawAlert !== undefined ? Number(rawAlert) : NaN;
    const low_stock_alert = Number.isFinite(parsedAlert)
      ? parsedAlert
      : (fallback?.low_stock_alert ?? 15);

    const itemObj: InventoryItem = {
      item_id: itemId,
      name,
      unit,
      stock,
      low_stock_alert,
      updated_at: String(
        pickField(row, [
          'updated_at',
          'Updated_At',
          'timestamp',
          'Timestamp',
        ]) ?? new Date().toISOString(),
      ),
    };
    return itemObj;
  });

  const inventory: InventoryItem[] =
    validInvRows.length > 0
      ? mappedInv.filter((item): item is InventoryItem => item !== null)
      : fallbackInventory;

  const rawMenu = Array.isArray(container.menu ?? container.Menu)
    ? ((container.menu ?? container.Menu) as Record<string, unknown>[])
    : [];

  const menu: MenuItem[] =
    rawMenu.length > 0
      ? rawMenu.map((row, idx) => {
          const rawName = String(
            pickField(row, ['name', 'Name', 'item_name', 'Item_Name']) ??
              `Item ${idx + 1}`,
          );
          const rawId = pickField(row, [
            'id',
            'ID',
            'menu_id',
            'Menu_ID',
            'item_id',
            'Item_ID',
          ]);
          const slugId =
            rawName
              .toLowerCase()
              .trim()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '') || `item-${idx + 1}`;
          const itemId = String(rawId ?? slugId);
          const fallbackMatch = fallbackMenu.find(
            (m) => m.id === itemId || m.name.toLowerCase() === rawName.toLowerCase(),
          );

          const price = Number(
            pickField(row, ['price', 'Price', 'selling_price', 'Selling_Price']) ??
              fallbackMatch?.price ??
              0,
          );
          const cost = Number(
            pickField(row, [
              'cost',
              'Cost',
              'unit_cost',
              'Unit_Cost',
              'estimated_cost',
              'Estimated_Cost',
            ]) ??
              fallbackMatch?.cost ??
              0,
          );
          const deductionsRaw = pickField(row, [
            'deductions_json',
            'Deductions_JSON',
            'deductions',
            'Deductions',
          ]);

          return {
            id: itemId,
            name: rawName,
            subtitle: String(
              pickField(row, ['subtitle', 'Subtitle', 'description', 'Description']) ??
                fallbackMatch?.subtitle ??
                '',
            ),
            price: Number.isFinite(price) ? price : 0,
            cost: Number.isFinite(cost) ? cost : 0,
            category: String(
              pickField(row, ['category', 'Category']) ??
                fallbackMatch?.category ??
                'Food',
            ),
            image: String(
              pickField(row, ['image', 'Image', 'image_url', 'Image_URL']) ??
                fallbackMatch?.image ??
                '',
            ),
            deductions:
              deductionsRaw !== undefined
                ? parseDeductionsJson(deductionsRaw)
                : (fallbackMatch?.deductions ?? []),
          };
        })
      : fallbackMenu;

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
    menu,
    orders: orders.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    ),
    expenses: expenses.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    ),
  };
}
