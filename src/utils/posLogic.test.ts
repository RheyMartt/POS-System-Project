import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyInventoryDeductions,
  applyRestock,
  computeCartTotals,
  computeFinancialSummary,
  computeMenuServingsAvailable,
  computeUnitMargin,
  formatPeso,
  formatSalesCsv,
  generateInventoryItemId,
  generateMenuItemId,
  generateOrderId,
  getStockStatus,
  normalizeSheetDataResponse,
  parseDeductionsJson,
  validateCheckout,
} from './posLogic';
import {
  INITIAL_INVENTORY,
  INITIAL_MENU_ITEMS,
  MENU_ITEMS,
} from '../data/menuAndSeed';
import type { CartItem, ExpenseRecord, OrderRecord } from '../types/pos';

test('formatPeso formats Philippine Peso cleanly', () => {
  assert.equal(formatPeso(35), '₱35.00');
  assert.equal(formatPeso(1250.5), '₱1,250.50');
  assert.equal(formatPeso(-45), '-₱45.00');
});

test('computeCartTotals aggregates price, item count, and inventory deductions', () => {
  const siomai4 = MENU_ITEMS[0];
  const siomaiRice = MENU_ITEMS[1];
  const gulaman = MENU_ITEMS[2];

  const cart: CartItem[] = [
    {
      menu_item_id: siomai4.id,
      name: siomai4.name,
      unit_price: siomai4.price,
      qty: 2,
      deductions: siomai4.deductions,
    },
    {
      menu_item_id: siomaiRice.id,
      name: siomaiRice.name,
      unit_price: siomaiRice.price,
      qty: 1,
      deductions: siomaiRice.deductions,
    },
    {
      menu_item_id: gulaman.id,
      name: gulaman.name,
      unit_price: gulaman.price,
      qty: 1,
      deductions: gulaman.deductions,
    },
  ];

  const res = computeCartTotals(cart);
  assert.equal(res.itemCount, 4);
  assert.equal(res.totalAmount, 35 * 2 + 50 + 20);
  assert.equal(res.itemsSummary, '2x Siomai 4 pcs, 1x Siomai w/ Rice, 1x Gulaman');

  const inv1 = res.deductions.find((d) => d.item_id === 'INV-1');
  const inv2 = res.deductions.find((d) => d.item_id === 'INV-2');
  const inv3 = res.deductions.find((d) => d.item_id === 'INV-3');
  assert.equal(inv1?.qty, 12);
  assert.equal(inv2?.qty, 3);
  assert.equal(inv3?.qty, 1);
});

test('applyInventoryDeductions and applyRestock update counts accurately and clamp at 0', () => {
  const updated = applyInventoryDeductions(INITIAL_INVENTORY, [
    { item_id: 'INV-1', qty: 8 },
    { item_id: 'INV-3', qty: 20 },
  ]);

  assert.equal(updated.find((i) => i.item_id === 'INV-1')?.stock, 112);
  assert.equal(updated.find((i) => i.item_id === 'INV-3')?.stock, 0);

  const restocked = applyRestock(updated, 'INV-3', 50);
  assert.equal(restocked.find((i) => i.item_id === 'INV-3')?.stock, 50);
});

test('computeMenuServingsAvailable finds limiting inventory ingredient and handles untracked or missing stock', () => {
  const siomai4 = MENU_ITEMS[0]; // needs 4 INV-1 and 1 INV-2
  const inv = [
    { item_id: 'INV-1', name: 'Siomai Pieces', unit: 'pcs', stock: 11, low_stock_alert: 40 },
    { item_id: 'INV-2', name: 'Paper Bowls', unit: 'pcs', stock: 50, low_stock_alert: 20 },
  ];
  assert.equal(computeMenuServingsAvailable(siomai4, inv), 2);

  // Untracked item returns Infinity
  assert.equal(
    computeMenuServingsAvailable(
      { id: 'sauce', name: 'Extra Sauce', price: 5, cost: 1, category: 'Add-ons', deductions: [] },
      inv,
    ),
    Infinity,
  );

  // Missing linked inventory item returns 0
  assert.equal(
    computeMenuServingsAvailable(
      {
        id: 'missing',
        name: 'Missing Link',
        price: 25,
        cost: 10,
        category: 'Drinks',
        deductions: [{ item_id: 'INV-99', qty: 1 }],
      },
      inv,
    ),
    0,
  );
});

test('getStockStatus returns out, critical, low, and ok states', () => {
  assert.equal(getStockStatus(0, 15), 'out');
  assert.equal(getStockStatus(5, 15), 'critical');
  assert.equal(getStockStatus(12, 15), 'low');
  assert.equal(getStockStatus(15, 15), 'ok');
  assert.equal(getStockStatus(50, 15), 'ok');
});

test('validateCheckout enforces Cash sufficiency and mandatory GCash reference', () => {
  const cashFail = validateCheckout({
    totalAmount: 90,
    paymentMethod: 'Cash',
    amountTendered: 50,
    gcashRef: '',
  });
  assert.equal(cashFail.valid, false);

  const cashOk = validateCheckout({
    totalAmount: 90,
    paymentMethod: 'Cash',
    amountTendered: 100,
    gcashRef: '',
  });
  assert.equal(cashOk.valid, true);
  assert.equal(cashOk.changeDue, 10);

  const gcashEmpty = validateCheckout({
    totalAmount: 90,
    paymentMethod: 'GCash',
    amountTendered: 90,
    gcashRef: '   ',
  });
  assert.equal(gcashEmpty.valid, false);

  const gcashOk = validateCheckout({
    totalAmount: 90,
    paymentMethod: 'GCash',
    amountTendered: 90,
    gcashRef: '904218734',
  });
  assert.equal(gcashOk.valid, true);
  assert.equal(gcashOk.changeDue, 0);
});

test('computeFinancialSummary computes gross, cash vs gcash, expenses, and net profit', () => {
  const orders: OrderRecord[] = [
    {
      order_id: 'KS-1001',
      created_at: '2026-11-15T10:00:00.000Z',
      items: '1x Siomai w/ Rice',
      line_items: [],
      total_amount: 50,
      payment_method: 'Cash',
      gcash_ref: '',
      amount_tendered: 100,
      change_due: 50,
      deductions: [],
    },
    {
      order_id: 'KS-1002',
      created_at: '2026-11-15T11:00:00.000Z',
      items: '2x Siomai 4 pcs',
      line_items: [],
      total_amount: 70,
      payment_method: 'GCash',
      gcash_ref: '123456',
      amount_tendered: 70,
      change_due: 0,
      deductions: [],
    },
  ];
  const expenses: ExpenseRecord[] = [
    {
      expense_id: 'EXP-1',
      created_at: '2026-11-15T08:00:00.000Z',
      description: 'Ice',
      category: 'Ingredients',
      amount: 40,
    },
  ];

  const summary = computeFinancialSummary(orders, expenses);
  assert.equal(summary.grossSales, 120);
  assert.equal(summary.cashSales, 50);
  assert.equal(summary.gcashSales, 70);
  assert.equal(summary.totalExpenses, 40);
  assert.equal(summary.netProfit, 80);
});

test('generateOrderId, generateInventoryItemId, and generateMenuItemId increment cleanly', () => {
  const existing: OrderRecord[] = [
    {
      order_id: 'KS-1005',
      created_at: '2026-11-15T08:00:00.000Z',
      items: '1x Gulaman',
      line_items: [],
      total_amount: 20,
      payment_method: 'Cash',
      gcash_ref: '',
      amount_tendered: 20,
      change_due: 0,
      deductions: [],
    },
  ];
  assert.equal(generateOrderId(existing), 'KS-1006');
  assert.equal(generateOrderId([]), 'KS-1001');

  assert.equal(generateInventoryItemId(INITIAL_INVENTORY), 'INV-5');
  assert.equal(generateInventoryItemId([]), 'INV-1');

  assert.equal(generateMenuItemId('Buko Juice', INITIAL_MENU_ITEMS), 'buko-juice');
  assert.equal(generateMenuItemId('Gulaman', INITIAL_MENU_ITEMS), 'gulaman-2');
});

test('formatSalesCsv escapes commas and outputs summary rows', () => {
  const csv = formatSalesCsv(
    [
      {
        order_id: 'KS-1001',
        created_at: '2026-11-15T08:00:00.000Z',
        items: '1x Siomai 4 pcs, 1x Gulaman',
        line_items: [],
        total_amount: 55,
        payment_method: 'Cash',
        gcash_ref: '',
        amount_tendered: 100,
        change_due: 45,
        deductions: [],
      },
    ],
    [],
  );
  assert.ok(csv.includes('"1x Siomai 4 pcs, 1x Gulaman"'));
  assert.ok(csv.includes('SUMMARY,Gross Sales,55.00'));
});

test('parseDeductionsJson handles JSON strings, arrays, and invalid inputs', () => {
  assert.deepEqual(
    parseDeductionsJson('[{"item_id":"INV-1","qty":4},{"item_id":"INV-2","qty":1}]'),
    [
      { item_id: 'INV-1', qty: 4 },
      { item_id: 'INV-2', qty: 1 },
    ],
  );
  assert.deepEqual(parseDeductionsJson([{ Item_ID: 'INV-3', Qty: 2 }]), [
    { item_id: 'INV-3', qty: 2 },
  ]);
  assert.deepEqual(parseDeductionsJson('not-valid-json'), []);
  assert.deepEqual(parseDeductionsJson(''), []);
});

test('computeUnitMargin calculates Price - Cost accurately', () => {
  assert.equal(computeUnitMargin(35, 15), 20);
  assert.equal(computeUnitMargin(20.5, 7.25), 13.25);
  assert.equal(computeUnitMargin(15, 20), -5);
});

test('normalizeSheetDataResponse parses menu array with Deductions_JSON and falls back safely', () => {
  const normalized = normalizeSheetDataResponse(
    {
      menu: [
        {
          ID: 'chicharon-siomai',
          Name: 'Chicharon Siomai',
          Price: 45,
          Cost: 20,
          Category: 'Food',
          Deductions_JSON: '[{"item_id":"INV-1","qty":4},{"item_id":"INV-2","qty":1}]',
        },
        {
          ID: 'chili-cup',
          Name: 'Extra Chili',
          Price: 10,
          Cost: 3,
          Category: 'Add-ons',
          Deductions_JSON: '[]',
        },
      ],
      inventory: [
        { Item_ID: 'INV-1', Name: 'Siomai Pieces', Unit: 'pcs', Stock: 96, Low_Stock_Alert: 40 },
      ],
      orders: [
        {
          Order_ID: 'KS-2001',
          Timestamp: '2026-11-15T12:00:00.000Z',
          Items: '2x Siomai 4 pcs',
          Total_Amount: 70,
          Payment_Method: 'GCash',
          GCash_Ref: 'GC-9988',
        },
      ],
      expenses: [
        {
          Expense_ID: 'EXP-201',
          Timestamp: '2026-11-15T09:00:00.000Z',
          Description: 'Soy Sauce & Calamansi',
          Category: 'Ingredients',
          Amount: 150,
        },
      ],
    },
    INITIAL_INVENTORY,
    INITIAL_MENU_ITEMS,
  );

  assert.equal(normalized.menu.length, 2);
  assert.equal(normalized.menu[0].id, 'chicharon-siomai');
  assert.equal(normalized.menu[0].price, 45);
  assert.equal(normalized.menu[0].cost, 20);
  assert.equal(normalized.menu[0].category, 'Food');
  assert.deepEqual(normalized.menu[0].deductions, [
    { item_id: 'INV-1', qty: 4 },
    { item_id: 'INV-2', qty: 1 },
  ]);
  assert.deepEqual(normalized.menu[1].deductions, []);
  assert.equal(normalized.inventory[0].stock, 96);
  assert.equal(normalized.orders[0].order_id, 'KS-2001');
  assert.equal(normalized.orders[0].payment_method, 'GCash');
  assert.equal(normalized.orders[0].gcash_ref, 'GC-9988');
  assert.equal(normalized.expenses[0].amount, 150);

  // Fallback when menu is missing from Sheets response
  const fallbackRes = normalizeSheetDataResponse(
    { inventory: [] },
    INITIAL_INVENTORY,
    INITIAL_MENU_ITEMS,
  );
  assert.equal(fallbackRes.menu.length, INITIAL_MENU_ITEMS.length);
});
