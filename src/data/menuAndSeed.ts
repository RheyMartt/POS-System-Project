import type {
  ExpenseCategory,
  ExpenseRecord,
  InventoryItem,
  MenuItem,
  OrderRecord,
} from '../types/pos';

export const MENU_CATEGORIES: MenuItem['category'][] = [
  'Food',
  'Meals',
  'Drinks',
  'Add-ons',
];

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  {
    id: 'siomai-4',
    name: 'Siomai 4 pcs',
    subtitle: '4 steamed pcs · chili garlic & calamansi',
    price: 35,
    cost: 15,
    category: 'Food',
    image: '/src/assets/images/menu_siomai_4pcs_1794747913797.jpg',
    deductions: [
      { item_id: 'INV-1', qty: 4 },
      { item_id: 'INV-2', qty: 1 },
    ],
  },
  {
    id: 'siomai-rice',
    name: 'Siomai w/ Rice',
    subtitle: '4 pcs siomai · steamed jasmine rice',
    price: 50,
    cost: 22,
    category: 'Meals',
    image: '/src/assets/images/menu_siomai_rice_1794747913802.jpg',
    deductions: [
      { item_id: 'INV-1', qty: 4 },
      { item_id: 'INV-2', qty: 1 },
    ],
  },
  {
    id: 'gulaman',
    name: 'Gulaman',
    subtitle: 'Iced sago & brown sugar jelly · 16oz cup',
    price: 20,
    cost: 7,
    category: 'Drinks',
    image: '/src/assets/images/menu_gulaman_1794747914482.jpg',
    deductions: [{ item_id: 'INV-3', qty: 1 }],
  },
  {
    id: 'bottled-water',
    name: 'Bottled Water',
    subtitle: 'Chilled purified water · 500ml',
    price: 20,
    cost: 10,
    category: 'Drinks',
    image: '/src/assets/images/menu_bottled_water_1794747913879.jpg',
    deductions: [{ item_id: 'INV-4', qty: 1 }],
  },
  {
    id: 'extra-rice',
    name: 'Extra Rice',
    subtitle: 'Steamed white rice · 1 bowl',
    price: 15,
    cost: 6,
    category: 'Add-ons',
    image: '/src/assets/images/menu_extra_rice_1794747915506.jpg',
    deductions: [{ item_id: 'INV-2', qty: 1 }],
  },
];

export const MENU_ITEMS = INITIAL_MENU_ITEMS;

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Ingredients',
  'Packaging',
  'Utilities',
  'Transport',
  'Labor',
  'Misc',
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    item_id: 'INV-1',
    name: 'Siomai Pieces',
    unit: 'pcs',
    stock: 120,
    low_stock_alert: 40,
    updated_at: '2026-11-15T06:00:00.000Z',
  },
  {
    item_id: 'INV-2',
    name: 'Paper Bowls',
    unit: 'pcs',
    stock: 55,
    low_stock_alert: 20,
    updated_at: '2026-11-15T06:00:00.000Z',
  },
  {
    item_id: 'INV-3',
    name: 'Plastic Cups',
    unit: 'pcs',
    stock: 12,
    low_stock_alert: 15,
    updated_at: '2026-11-15T06:00:00.000Z',
  },
  {
    item_id: 'INV-4',
    name: 'Bottled Water',
    unit: 'btls',
    stock: 24,
    low_stock_alert: 10,
    updated_at: '2026-11-15T06:00:00.000Z',
  },
];

export const INITIAL_ORDERS: OrderRecord[] = [
  {
    order_id: 'KS-1003',
    created_at: '2026-11-15T11:42:00.000Z',
    items: '2x Siomai w/ Rice, 1x Gulaman',
    line_items: [
      {
        menu_item_id: 'siomai-rice',
        name: 'Siomai w/ Rice',
        qty: 2,
        unit_price: 50,
        line_total: 100,
      },
      {
        menu_item_id: 'gulaman',
        name: 'Gulaman',
        qty: 1,
        unit_price: 20,
        line_total: 20,
      },
    ],
    total_amount: 120,
    payment_method: 'GCash',
    gcash_ref: '904218734',
    amount_tendered: 120,
    change_due: 0,
    deductions: [
      { item_id: 'INV-1', qty: 8 },
      { item_id: 'INV-2', qty: 2 },
      { item_id: 'INV-3', qty: 1 },
    ],
    synced: false,
  },
  {
    order_id: 'KS-1002',
    created_at: '2026-11-15T10:18:00.000Z',
    items: '1x Siomai 4 pcs, 1x Bottled Water',
    line_items: [
      {
        menu_item_id: 'siomai-4',
        name: 'Siomai 4 pcs',
        qty: 1,
        unit_price: 35,
        line_total: 35,
      },
      {
        menu_item_id: 'bottled-water',
        name: 'Bottled Water',
        qty: 1,
        unit_price: 20,
        line_total: 20,
      },
    ],
    total_amount: 55,
    payment_method: 'Cash',
    gcash_ref: '',
    amount_tendered: 100,
    change_due: 45,
    deductions: [
      { item_id: 'INV-1', qty: 4 },
      { item_id: 'INV-2', qty: 1 },
      { item_id: 'INV-4', qty: 1 },
    ],
    synced: false,
  },
  {
    order_id: 'KS-1001',
    created_at: '2026-11-15T08:50:00.000Z',
    items: '1x Siomai w/ Rice, 1x Extra Rice',
    line_items: [
      {
        menu_item_id: 'siomai-rice',
        name: 'Siomai w/ Rice',
        qty: 1,
        unit_price: 50,
        line_total: 50,
      },
      {
        menu_item_id: 'extra-rice',
        name: 'Extra Rice',
        qty: 1,
        unit_price: 15,
        line_total: 15,
      },
    ],
    total_amount: 65,
    payment_method: 'Cash',
    gcash_ref: '',
    amount_tendered: 70,
    change_due: 5,
    deductions: [
      { item_id: 'INV-1', qty: 4 },
      { item_id: 'INV-2', qty: 2 },
    ],
    synced: false,
  },
];

export const INITIAL_EXPENSES: ExpenseRecord[] = [
  {
    expense_id: 'EXP-1002',
    created_at: '2026-11-15T07:30:00.000Z',
    description: 'Tube Ice & Calamansi (2kg)',
    category: 'Ingredients',
    amount: 85,
    synced: false,
  },
  {
    expense_id: 'EXP-1001',
    created_at: '2026-11-15T06:45:00.000Z',
    description: 'LPG Burner Refill Share',
    category: 'Utilities',
    amount: 120,
    synced: false,
  },
];
