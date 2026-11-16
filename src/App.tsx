import { useCallback, useEffect, useMemo, useState } from 'react';
import { BottomNav } from './components/BottomNav';
import { CheckoutDrawer } from './components/CheckoutDrawer';
import { ExpensesTab } from './components/ExpensesTab';
import { Header } from './components/Header';
import { InventoryTab } from './components/InventoryTab';
import { PosTab } from './components/PosTab';
import { ReceiptModal } from './components/ReceiptModal';
import { RestockModal } from './components/RestockModal';
import { SalesTab } from './components/SalesTab';
import { SettingsModal } from './components/SettingsModal';
import { INITIAL_INVENTORY, MENU_ITEMS } from './data/menuAndSeed';
import {
  fetchSheetsData,
  loadLocalStore,
  postAddExpense,
  postNewOrder,
  postRestock,
  resetDemoDataLocal,
  saveExpensesLocal,
  saveInventoryLocal,
  saveLastSyncLocal,
  saveOrdersLocal,
  saveWebAppUrl,
} from './services/sheetsApi';
import type {
  CartItem,
  ConnectionMode,
  ExpenseCategory,
  ExpenseRecord,
  InventoryItem,
  MenuItem,
  OrderRecord,
  PaymentMethod,
  SyncFeedback,
  TabId,
} from './types/pos';
import {
  applyInventoryDeductions,
  applyRestock,
  computeCartTotals,
  computeMenuServingsAvailable,
  generateOrderId,
  getStockStatus,
} from './utils/posLogic';

export default function App() {
  const [initialStore] = useState(() => loadLocalStore());

  const [activeTab, setActiveTab] = useState<TabId>('pos');
  const [webAppUrl, setWebAppUrl] = useState<string>(initialStore.webAppUrl);
  const [inventory, setInventory] = useState<InventoryItem[]>(initialStore.inventory);
  const [orders, setOrders] = useState<OrderRecord[]>(initialStore.orders);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(initialStore.expenses);
  const [lastSync, setLastSync] = useState<string | null>(initialStore.lastSync);

  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  const [sheetsReachable, setSheetsReachable] = useState<boolean>(
    Boolean(initialStore.webAppUrl),
  );
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<SyncFeedback | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [receiptState, setReceiptState] = useState<{
    order: OrderRecord;
    fromHistory: boolean;
  } | null>(null);
  const [restockTarget, setRestockTarget] = useState<InventoryItem | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const showFeedback = useCallback(
    (type: SyncFeedback['type'], message: string) => {
      setFeedback({ type, message });
    },
    [],
  );

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 3500);
    return () => clearTimeout(timer);
  }, [feedback]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncFromSheets = useCallback(
    async (targetUrl: string, silentOnInit = false) => {
      const trimmed = targetUrl.trim();
      if (!trimmed) {
        setSheetsReachable(false);
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        setSheetsReachable(false);
        if (!silentOnInit) {
          showFeedback('warning', 'Device is offline. Using Local Mode.');
        }
        return;
      }

      setIsSyncing(true);
      try {
        const data = await fetchSheetsData(trimmed, INITIAL_INVENTORY);
        setInventory(data.inventory);
        setOrders(data.orders);
        setExpenses(data.expenses);
        saveInventoryLocal(data.inventory);
        saveOrdersLocal(data.orders);
        saveExpensesLocal(data.expenses);

        const now = new Date().toISOString();
        setLastSync(now);
        saveLastSyncLocal(now);
        setSheetsReachable(true);
        if (!silentOnInit) {
          showFeedback('success', 'Synced with Google Sheets.');
        }
      } catch {
        setSheetsReachable(false);
        showFeedback('warning', 'Sheets unreachable. Running in Local Mode.');
      } finally {
        setIsSyncing(false);
      }
    },
    [showFeedback],
  );

  useEffect(() => {
    if (webAppUrl) {
      void syncFromSheets(webAppUrl, true);
    }
    // Run initial fetch once on mount if Web App URL is already saved
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connectionMode: ConnectionMode =
    webAppUrl.trim() && isOnline && sheetsReachable ? 'connected' : 'local';

  const cartTotals = useMemo(() => computeCartTotals(cart), [cart]);

  const lowStockCount = useMemo(
    () =>
      inventory.filter(
        (item) => getStockStatus(item.stock, item.low_stock_alert) !== 'ok',
      ).length,
    [inventory],
  );

  const handleAddToCart = (menuItem: MenuItem) => {
    const maxServings = computeMenuServingsAvailable(menuItem, inventory);
    if (maxServings <= 0) return;

    setCart((prev) => {
      const existing = prev.find((c) => c.menu_item_id === menuItem.id);
      if (existing) {
        if (existing.qty >= maxServings) return prev;
        return prev.map((c) =>
          c.menu_item_id === menuItem.id ? { ...c, qty: c.qty + 1 } : c,
        );
      }
      return [
        ...prev,
        {
          menu_item_id: menuItem.id,
          name: menuItem.name,
          unit_price: menuItem.price,
          qty: 1,
          deductions: menuItem.deductions,
        },
      ];
    });
  };

  const handleIncrementCartId = (menuItemId: string) => {
    const menuItem = MENU_ITEMS.find((m) => m.id === menuItemId);
    if (menuItem) handleAddToCart(menuItem);
  };

  const handleDecrementCart = (menuItemId: string) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.menu_item_id === menuItemId ? { ...c, qty: c.qty - 1 } : c,
        )
        .filter((c) => c.qty > 0),
    );
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleCompleteOrder = async (details: {
    paymentMethod: PaymentMethod;
    amountTendered: number;
    changeDue: number;
    gcashRef: string;
  }) => {
    if (cartTotals.itemCount === 0) return;

    setIsSubmitting(true);
    const nowIso = new Date().toISOString();
    const orderId = generateOrderId(orders);

    const newOrder: OrderRecord = {
      order_id: orderId,
      created_at: nowIso,
      items: cartTotals.itemsSummary,
      line_items: cartTotals.lineItems,
      total_amount: cartTotals.totalAmount,
      payment_method: details.paymentMethod,
      gcash_ref: details.gcashRef,
      amount_tendered: details.amountTendered,
      change_due: details.changeDue,
      deductions: cartTotals.deductions,
      synced: false,
    };

    const nextInventory = applyInventoryDeductions(
      inventory,
      cartTotals.deductions,
      nowIso,
    );
    const nextOrders = [newOrder, ...orders];

    setInventory(nextInventory);
    setOrders(nextOrders);
    saveInventoryLocal(nextInventory);
    saveOrdersLocal(nextOrders);
    setCart([]);
    setIsCheckoutOpen(false);
    setReceiptState({ order: newOrder, fromHistory: false });

    if (webAppUrl.trim() && isOnline) {
      const ok = await postNewOrder(webAppUrl, {
        action: 'newOrder',
        order_id: newOrder.order_id,
        items: newOrder.items,
        total_amount: newOrder.total_amount,
        payment_method: newOrder.payment_method,
        gcash_ref: newOrder.gcash_ref,
        amount_tendered: newOrder.amount_tendered,
        change_due: newOrder.change_due,
        deductions: newOrder.deductions,
      });
      if (ok) {
        setSheetsReachable(true);
        const syncedOrders = nextOrders.map((o) =>
          o.order_id === orderId ? { ...o, synced: true } : o,
        );
        setOrders(syncedOrders);
        saveOrdersLocal(syncedOrders);
      } else {
        setSheetsReachable(false);
        showFeedback('warning', 'Order saved locally (Sheets offline).');
      }
    }

    setIsSubmitting(false);
  };

  const handleConfirmRestock = async (itemId: string, addQty: number) => {
    setIsSubmitting(true);
    const nowIso = new Date().toISOString();
    const nextInventory = applyRestock(inventory, itemId, addQty, nowIso);
    setInventory(nextInventory);
    saveInventoryLocal(nextInventory);
    setRestockTarget(null);

    if (webAppUrl.trim() && isOnline) {
      const ok = await postRestock(webAppUrl, {
        action: 'restock',
        item_id: itemId,
        add_qty: addQty,
      });
      if (ok) {
        setSheetsReachable(true);
        showFeedback('success', `Restocked +${addQty} and synced to Sheets.`);
      } else {
        setSheetsReachable(false);
        showFeedback('warning', `Restocked +${addQty} locally.`);
      }
    } else {
      showFeedback('success', `Added +${addQty} to stock.`);
    }

    setIsSubmitting(false);
  };

  const handleAddExpense = async (data: {
    description: string;
    category: ExpenseCategory;
    amount: number;
  }) => {
    setIsSubmitting(true);
    const nowIso = new Date().toISOString();
    const expenseId = `EXP-${Date.now().toString().slice(-6)}`;

    const newExpense: ExpenseRecord = {
      expense_id: expenseId,
      created_at: nowIso,
      description: data.description,
      category: data.category,
      amount: data.amount,
      synced: false,
    };

    const nextExpenses = [newExpense, ...expenses];
    setExpenses(nextExpenses);
    saveExpensesLocal(nextExpenses);

    if (webAppUrl.trim() && isOnline) {
      const ok = await postAddExpense(webAppUrl, {
        action: 'addExpense',
        description: data.description,
        category: data.category,
        amount: data.amount,
      });
      if (ok) {
        setSheetsReachable(true);
        const synced = nextExpenses.map((ex) =>
          ex.expense_id === expenseId ? { ...ex, synced: true } : ex,
        );
        setExpenses(synced);
        saveExpensesLocal(synced);
        showFeedback('success', 'Expense logged and synced to Sheets.');
      } else {
        setSheetsReachable(false);
        showFeedback('warning', 'Expense saved locally (Sheets offline).');
      }
    } else {
      showFeedback('success', 'Expense logged.');
    }

    setIsSubmitting(false);
  };

  const handleManualSync = () => {
    if (!webAppUrl.trim()) {
      setIsSettingsOpen(true);
      return;
    }
    void syncFromSheets(webAppUrl, false);
  };

  const handleSaveAndSyncSettings = async (url: string) => {
    saveWebAppUrl(url);
    setWebAppUrl(url);
    await syncFromSheets(url, false);
    setIsSettingsOpen(false);
  };

  const handleDisconnectSheets = () => {
    saveWebAppUrl('');
    setWebAppUrl('');
    setSheetsReachable(false);
    showFeedback('info', 'Switched to Local Mode.');
  };

  const handleResetDemoData = () => {
    const reset = resetDemoDataLocal();
    setInventory(reset.inventory);
    setOrders(reset.orders);
    setExpenses(reset.expenses);
    setLastSync(reset.lastSync);
    setCart([]);
    showFeedback('info', 'Demo data restored.');
  };

  return (
    <div className="min-h-screen bg-[#EAE0D0] flex justify-center">
      <div className="w-full max-w-[480px] min-h-screen bg-[#F7F2E8] shadow-xl sm:border-x sm:border-[#DDD1BE] flex flex-col relative">
        <Header
          connectionMode={connectionMode}
          isSyncing={isSyncing}
          hasWebAppUrl={Boolean(webAppUrl.trim())}
          onManualSync={handleManualSync}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {feedback && (
          <div
            role="status"
            aria-live="polite"
            className="px-4 pt-2.5"
          >
            <div
              className={`rounded-xl px-3.5 py-2 text-xs font-semibold border ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : feedback.type === 'warning'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : feedback.type === 'error'
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : 'bg-[#EFE7D8] border-[#DDD1BE] text-[#261812]'
              }`}
            >
              {feedback.message}
            </div>
          </div>
        )}

        <main className="flex-1">
          {activeTab === 'pos' && (
            <PosTab
              menuItems={MENU_ITEMS}
              inventory={inventory}
              cart={cart}
              cartItemCount={cartTotals.itemCount}
              cartTotalAmount={cartTotals.totalAmount}
              onAddToCart={handleAddToCart}
              onDecrementCart={handleDecrementCart}
              onClearCart={handleClearCart}
              onOpenCheckout={() => setIsCheckoutOpen(true)}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryTab
              inventory={inventory}
              onOpenRestock={(item) => setRestockTarget(item)}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpensesTab
              expenses={expenses}
              isSubmitting={isSubmitting}
              onAddExpense={handleAddExpense}
            />
          )}

          {activeTab === 'sales' && (
            <SalesTab
              orders={orders}
              expenses={expenses}
              onSelectOrder={(order) =>
                setReceiptState({ order, fromHistory: true })
              }
            />
          )}
        </main>

        <BottomNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          lowStockCount={lowStockCount}
        />

        <CheckoutDrawer
          isOpen={isCheckoutOpen}
          cart={cart}
          totalAmount={cartTotals.totalAmount}
          isSubmitting={isSubmitting}
          onClose={() => setIsCheckoutOpen(false)}
          onIncrementItem={handleIncrementCartId}
          onDecrementItem={handleDecrementCart}
          onCompleteOrder={handleCompleteOrder}
        />

        <ReceiptModal
          order={receiptState?.order ?? null}
          isFromHistory={receiptState?.fromHistory ?? false}
          onClose={() => setReceiptState(null)}
        />

        <RestockModal
          item={restockTarget}
          isSubmitting={isSubmitting}
          onClose={() => setRestockTarget(null)}
          onConfirmRestock={handleConfirmRestock}
        />

        <SettingsModal
          isOpen={isSettingsOpen}
          webAppUrl={webAppUrl}
          connectionMode={connectionMode}
          lastSync={lastSync}
          isSyncing={isSyncing}
          onClose={() => setIsSettingsOpen(false)}
          onSaveAndSync={handleSaveAndSyncSettings}
          onDisconnect={handleDisconnectSheets}
          onResetDemoData={handleResetDemoData}
        />
      </div>
    </div>
  );
}
