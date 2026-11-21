export type TabId = 'pos' | 'inventory' | 'expenses' | 'sales';

export type PaymentMethod = 'Cash' | 'GCash';

export type ExpenseCategory =
  | 'Ingredients'
  | 'Packaging'
  | 'Utilities'
  | 'Transport'
  | 'Labor'
  | 'Misc';

export interface InventoryDeduction {
  item_id: string;
  qty: number;
}

export interface InventoryItem {
  item_id: string;
  name: string;
  unit: string;
  stock: number;
  low_stock_alert: number;
  updated_at?: string;
}

export type MenuCategory =
  | 'Promos'
  | 'Siomai'
  | 'Shawarma'
  | 'Noodles'
  | 'Snacks'
  | 'Milktea'
  | string;

export interface MenuItem {
  id: string;
  name: string;
  subtitle?: string;
  price: number;
  cost: number;
  category: MenuCategory | string;
  image?: string;
  deductions: InventoryDeduction[];
}

export interface CartItem {
  menu_item_id: string;
  name: string;
  unit_price: number;
  qty: number;
  deductions: InventoryDeduction[];
}

export interface OrderLineItem {
  menu_item_id: string;
  name: string;
  qty: number;
  unit_price: number;
  line_total: number;
}

export interface OrderRecord {
  order_id: string;
  created_at: string;
  items: string;
  line_items: OrderLineItem[];
  total_amount: number;
  payment_method: PaymentMethod;
  gcash_ref: string;
  amount_tendered: number;
  change_due: number;
  deductions: InventoryDeduction[];
  synced?: boolean;
}

export interface ExpenseRecord {
  expense_id: string;
  created_at: string;
  description: string;
  category: ExpenseCategory | string;
  amount: number;
  synced?: boolean;
}

export type ConnectionMode = 'local' | 'connected';

export interface SyncFeedback {
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export interface NewOrderPayload {
  action: 'newOrder';
  order_id: string;
  items: string;
  total_amount: number;
  payment_method: PaymentMethod;
  gcash_ref: string;
  amount_tendered: number;
  change_due: number;
  deductions: InventoryDeduction[];
}

export interface RestockPayload {
  action: 'restock';
  item_id: string;
  add_qty: number;
}

export interface AddExpensePayload {
  action: 'addExpense';
  description: string;
  category: string;
  amount: number;
}

export interface NewInventorySpec {
  item_id: string;
  name: string;
  unit: string;
  stock: number;
  low_stock_alert: number;
}

export interface AddMenuItemPayload {
  action: 'addMenuItem';
  name: string;
  price: number;
  cost: number;
  category: string;
  deductions: InventoryDeduction[];
  new_inventory: NewInventorySpec | null;
}
