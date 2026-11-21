import {
  INITIAL_EXPENSES,
  INITIAL_INVENTORY,
  INITIAL_MENU_ITEMS,
  INITIAL_ORDERS,
} from '../data/menuAndSeed';
import type {
  AddExpensePayload,
  AddMenuItemPayload,
  ExpenseRecord,
  InventoryItem,
  MenuItem,
  NewOrderPayload,
  OrderRecord,
  RestockPayload,
} from '../types/pos';
import { normalizeSheetDataResponse } from '../utils/posLogic';

const STORAGE_KEYS = {
  webAppUrl: 'kanto_siomai_webapp_url_v1',
  menu: 'kanto_siomai_menu_v1',
  inventory: 'kanto_siomai_inventory_v1',
  orders: 'kanto_siomai_orders_v1',
  expenses: 'kanto_siomai_expenses_v1',
  lastSync: 'kanto_siomai_last_sync_v1',
};

export interface LocalStoreSnapshot {
  webAppUrl: string;
  menu: MenuItem[];
  inventory: InventoryItem[];
  orders: OrderRecord[];
  expenses: ExpenseRecord[];
  lastSync: string | null;
}

function loadOrInitStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  const raw = window.localStorage.getItem(key);
  if (raw === null) {
    try {
      window.localStorage.setItem(key, JSON.stringify(defaultValue));
    } catch {
      // ignore storage errors
    }
    return defaultValue;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

export function loadLocalStore(): LocalStoreSnapshot {
  if (typeof window === 'undefined') {
    return {
      webAppUrl: '',
      menu: INITIAL_MENU_ITEMS,
      inventory: INITIAL_INVENTORY,
      orders: INITIAL_ORDERS,
      expenses: INITIAL_EXPENSES,
      lastSync: null,
    };
  }

  const storedMenu = loadOrInitStorageItem<MenuItem[]>(
    STORAGE_KEYS.menu,
    INITIAL_MENU_ITEMS,
  );
  const normalizedMenu = storedMenu.map((item) => ({
    ...item,
    cost: Number.isFinite(Number(item.cost)) ? Number(item.cost) : 0,
    deductions: Array.isArray(item.deductions) ? item.deductions : [],
  }));

  return {
    webAppUrl: window.localStorage.getItem(STORAGE_KEYS.webAppUrl) ?? '',
    menu: normalizedMenu,
    inventory: loadOrInitStorageItem<InventoryItem[]>(
      STORAGE_KEYS.inventory,
      INITIAL_INVENTORY,
    ),
    orders: loadOrInitStorageItem<OrderRecord[]>(
      STORAGE_KEYS.orders,
      INITIAL_ORDERS,
    ),
    expenses: loadOrInitStorageItem<ExpenseRecord[]>(
      STORAGE_KEYS.expenses,
      INITIAL_EXPENSES,
    ),
    lastSync: window.localStorage.getItem(STORAGE_KEYS.lastSync),
  };
}

export function saveWebAppUrl(url: string): void {
  if (typeof window === 'undefined') return;
  const trimmed = url.trim();
  if (trimmed) {
    window.localStorage.setItem(STORAGE_KEYS.webAppUrl, trimmed);
  } else {
    window.localStorage.removeItem(STORAGE_KEYS.webAppUrl);
  }
}

export function saveMenuLocal(menu: MenuItem[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEYS.menu, JSON.stringify(menu));
}

export function saveInventoryLocal(inventory: InventoryItem[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEYS.inventory, JSON.stringify(inventory));
}

export function saveOrdersLocal(orders: OrderRecord[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders));
}

export function saveExpensesLocal(expenses: ExpenseRecord[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify(expenses));
}

export function saveLastSyncLocal(iso: string | null): void {
  if (typeof window === 'undefined') return;
  if (iso) {
    window.localStorage.setItem(STORAGE_KEYS.lastSync, iso);
  } else {
    window.localStorage.removeItem(STORAGE_KEYS.lastSync);
  }
}

export function resetDemoDataLocal(): LocalStoreSnapshot {
  saveMenuLocal(INITIAL_MENU_ITEMS);
  saveInventoryLocal(INITIAL_INVENTORY);
  saveOrdersLocal(INITIAL_ORDERS);
  saveExpensesLocal(INITIAL_EXPENSES);
  saveLastSyncLocal(null);
  return {
    webAppUrl:
      typeof window !== 'undefined'
        ? window.localStorage.getItem(STORAGE_KEYS.webAppUrl) ?? ''
        : '',
    menu: INITIAL_MENU_ITEMS,
    inventory: INITIAL_INVENTORY,
    orders: INITIAL_ORDERS,
    expenses: INITIAL_EXPENSES,
    lastSync: null,
  };
}

export interface SyncDiagnosticInfo {
  statusText: string;
  rawFirstInventoryItem: string | null;
  timestamp: string;
  isError: boolean;
}

export interface SheetsDataResult {
  inventory: InventoryItem[];
  orders: OrderRecord[];
  expenses: ExpenseRecord[];
  menu: MenuItem[];
  statusText: string;
  rawFirstInventoryItem: string | null;
}

export function isValidAppsScriptUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export async function fetchSheetsData(
  webAppUrl: string,
  fallbackInventory: InventoryItem[],
  fallbackMenu: MenuItem[] = INITIAL_MENU_ITEMS,
): Promise<SheetsDataResult> {
  const trimmed = webAppUrl.trim();
  if (!trimmed) {
    throw new Error('No Google Apps Script Web App URL configured.');
  }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new Error('Device is offline.');
  }

  const sep = trimmed.includes('?') ? '&' : '?';
  const target = `${trimmed}${sep}action=getData`;

  let response: Response;
  try {
    response = await fetch(target, {
      method: 'GET',
      redirect: 'follow',
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Network error connecting to Google Sheets: ${msg}`);
  }

  const responseText = await response.text();
  const trimmedText = responseText.trim();

  if (!response.ok) {
    throw new Error(`Google Sheets sync returned HTTP ${response.status}`);
  }

  if (
    trimmedText.startsWith('<') ||
    trimmedText.toLowerCase().includes('<!doctype') ||
    trimmedText.toLowerCase().includes('<html')
  ) {
    throw new Error('Received HTML instead of JSON - check Apps Script "Anyone" access');
  }

  let data: unknown;
  try {
    data = JSON.parse(trimmedText);
  } catch {
    throw new Error('Received invalid JSON response from Google Sheets');
  }

  const normalized = normalizeSheetDataResponse(
    data,
    fallbackInventory,
    fallbackMenu,
  );

  let rawFirstInventoryItem: string | null = null;
  if (data && typeof data === 'object') {
    const rootObj = data as Record<string, unknown>;
    const container =
      rootObj.data && typeof rootObj.data === 'object'
        ? (rootObj.data as Record<string, unknown>)
        : rootObj;
    const rawInv = Array.isArray(container.inventory ?? container.Inventory)
      ? ((container.inventory ?? container.Inventory) as Record<string, unknown>[])
      : [];
    if (rawInv.length > 0) {
      try {
        rawFirstInventoryItem = JSON.stringify(rawInv[0], null, 2);
      } catch {
        rawFirstInventoryItem = String(rawInv[0]);
      }
    }
  }

  const statusText = `200 OK - Loaded ${normalized.inventory.length} inventory items`;

  return {
    ...normalized,
    statusText,
    rawFirstInventoryItem,
  };
}

async function postToAppsScript(
  webAppUrl: string,
  payload:
    | NewOrderPayload
    | RestockPayload
    | AddExpensePayload
    | AddMenuItemPayload,
): Promise<boolean> {
  const trimmed = webAppUrl.trim();
  if (!trimmed) return false;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return false;
  }

  try {
    const response = await fetch(trimmed, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function postNewOrder(
  webAppUrl: string,
  payload: NewOrderPayload,
): Promise<boolean> {
  return postToAppsScript(webAppUrl, payload);
}

export function postRestock(
  webAppUrl: string,
  payload: RestockPayload,
): Promise<boolean> {
  return postToAppsScript(webAppUrl, payload);
}

export function postAddExpense(
  webAppUrl: string,
  payload: AddExpensePayload,
): Promise<boolean> {
  return postToAppsScript(webAppUrl, payload);
}

export function postAddMenuItem(
  webAppUrl: string,
  payload: AddMenuItemPayload,
): Promise<boolean> {
  return postToAppsScript(webAppUrl, payload);
}

export const APPS_SCRIPT_TEMPLATE = `// Google Apps Script Web App for Kanto Siomai POS
// Sheets expected: "Menu", "Inventory", "Orders", "Expenses"
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || "getData";
  if (action === "getData") {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    return jsonResponse({
      menu: sheetToObjects(ss.getSheetByName("Menu")),
      inventory: sheetToObjects(ss.getSheetByName("Inventory")),
      orders: sheetToObjects(ss.getSheetByName("Orders")),
      expenses: sheetToObjects(ss.getSheetByName("Expenses"))
    });
  }
  return jsonResponse({ ok: true });
}

function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (data.action === "newOrder") {
    var orders = ss.getSheetByName("Orders");
    orders.appendRow([
      data.order_id, new Date().toISOString(), data.items,
      data.total_amount, data.payment_method, data.gcash_ref || "",
      data.amount_tendered, data.change_due
    ]);
    var inv = ss.getSheetByName("Inventory");
    var rows = inv.getDataRange().getValues();
    (data.deductions || []).forEach(function(d) {
      for (var i = 1; i < rows.length; i++) {
        if (rows[i][0] === d.item_id) {
          var next = Math.max(0, Number(rows[i][3]) - Number(d.qty));
          inv.getRange(i + 1, 4).setValue(next);
        }
      }
    });
    return jsonResponse({ ok: true });
  }
  if (data.action === "restock") {
    var invSheet = ss.getSheetByName("Inventory");
    var invRows = invSheet.getDataRange().getValues();
    for (var j = 1; j < invRows.length; j++) {
      if (invRows[j][0] === data.item_id) {
        var updated = Number(invRows[j][3]) + Number(data.add_qty);
        invSheet.getRange(j + 1, 4).setValue(updated);
      }
    }
    return jsonResponse({ ok: true });
  }
  if (data.action === "addExpense") {
    var exp = ss.getSheetByName("Expenses");
    exp.appendRow([
      "EXP-" + Date.now(), new Date().toISOString(),
      data.description, data.category, data.amount
    ]);
    return jsonResponse({ ok: true });
  }
  if (data.action === "addMenuItem") {
    if (data.new_inventory) {
      var invTab = ss.getSheetByName("Inventory");
      invTab.appendRow([
        data.new_inventory.item_id,
        data.new_inventory.name,
        data.new_inventory.unit || "pcs",
        Number(data.new_inventory.stock || 0),
        Number(data.new_inventory.low_stock_alert || 10),
        new Date().toISOString()
      ]);
    }
    var menuTab = ss.getSheetByName("Menu");
    var slugId = String(data.name || "item").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    menuTab.appendRow([
      slugId,
      data.name,
      Number(data.price || 0),
      Number(data.cost || 0),
      data.category || "Food",
      JSON.stringify(data.deductions || [])
    ]);
    return jsonResponse({ ok: true });
  }
  return jsonResponse({ ok: false, error: "Unknown action" });
}

function sheetToObjects(sheet) {
  if (!sheet) return [];
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0];
  return values.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h, idx) { obj[h] = row[idx]; });
    return obj;
  });
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}`;
