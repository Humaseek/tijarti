"use client";

import { createContext, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from "react";
import type {
  StoreState,
  Customer,
  Supplier,
  Product,
  Invoice,
  Expense,
  Check,
  CheckStatus,
  Debt,
  DebtStatus,
  RecurringExpense,
  Goal,
  GoalStatus,
  AppNotification,
  CustomFieldDefinition,
  DraftInvoice,
  InvoiceMethod,
  InvoiceItem,
  StoreSettings,
  NotificationSettings,
  SecuritySettings,
  UserProfile,
  TwoFaMethod,
} from "./types";
import { daysUntil, isWithinNextDays, todayIso } from "../dates";
import {
  expandRecurring,
  yearMonthRange,
  currentYearMonth,
  isSameYearMonth,
  type YearMonth,
  type RecurringOccurrence,
} from "../projections";
import { createInitialState, createDemoState, createEmptyState } from "./seed";

// ─── Action types ────────────────────────────────────────────────────────────
type Action =
  | { type: "draft/start" }
  | { type: "draft/clear" }
  | { type: "draft/setCustomer"; customerId: string }
  | { type: "draft/addItem"; productId: string; qty?: number }
  | { type: "draft/updateItemQty"; productId: string; qty: number }
  | { type: "draft/removeItem"; productId: string }
  | { type: "draft/setMethod"; method: InvoiceMethod; plan?: number }
  | { type: "draft/commit" }
  | { type: "payment/record"; invoiceId: string; amount: number }
  | { type: "product/add"; product: Omit<Product, "id"> & { id?: string } }
  | { type: "product/update"; id: string; patch: Partial<Product> }
  | { type: "product/delete"; id: string }
  | { type: "customer/add"; customer: Omit<Customer, "id"> & { id?: string } }
  | { type: "customer/update"; id: string; patch: Partial<Customer> }
  | { type: "customer/delete"; id: string }
  | { type: "expense/add"; expense: Omit<Expense, "id" | "created_at"> }
  | { type: "expense/update"; id: string; patch: Partial<Expense> }
  | { type: "expense/delete"; id: string }
  | { type: "settings/store/update"; patch: Partial<StoreSettings> }
  | { type: "settings/notifications/update"; patch: Partial<NotificationSettings> }
  | { type: "settings/security/update"; patch: Partial<SecuritySettings> }
  | { type: "settings/security/endSession"; id: string }
  | { type: "settings/security/endAllOther" }
  | { type: "profile/update"; patch: Partial<UserProfile> }
  | { type: "check/add"; check: Omit<Check, "id" | "created_at"> }
  | { type: "check/update"; id: string; patch: Partial<Check> }
  | { type: "check/delete"; id: string }
  | { type: "check/setStatus"; id: string; status: CheckStatus }
  | { type: "debt/add"; debt: Omit<Debt, "id" | "created_at"> }
  | { type: "debt/update"; id: string; patch: Partial<Debt> }
  | { type: "debt/delete"; id: string }
  | { type: "debt/setStatus"; id: string; status: DebtStatus }
  | { type: "recurring/add"; recurring: Omit<RecurringExpense, "id" | "created_at"> }
  | { type: "recurring/update"; id: string; patch: Partial<RecurringExpense> }
  | { type: "recurring/delete"; id: string }
  | { type: "supplier/add"; supplier: Omit<Supplier, "id" | "created_at"> & { id?: string } }
  | { type: "supplier/update"; id: string; patch: Partial<Supplier> }
  | { type: "supplier/delete"; id: string }
  | { type: "goal/add"; goal: Omit<Goal, "id" | "created_at"> }
  | { type: "goal/update"; id: string; patch: Partial<Goal> }
  | { type: "goal/delete"; id: string }
  | { type: "goal/setStatus"; id: string; status: GoalStatus }
  | { type: "notif/markRead"; id: string }
  | { type: "notif/markAllRead" }
  | { type: "notif/delete"; id: string }
  | { type: "customField/add"; def: Omit<CustomFieldDefinition, "id" | "created_at"> }
  | { type: "customField/update"; id: string; patch: Partial<CustomFieldDefinition> }
  | { type: "customField/delete"; id: string }
  | { type: "store/reset"; mode: "demo" | "empty" }
  | { type: "store/replace"; state: StoreState }
  | { type: "store/hydrate"; state: StoreState };

// ─── Helpers ─────────────────────────────────────────────────────────────────
function draftTotal(draft: DraftInvoice | null): number {
  if (!draft) return 0;
  return draft.items.reduce((sum, it) => sum + it.qty * it.price, 0);
}

// ─── Reducer ─────────────────────────────────────────────────────────────────
function reducer(state: StoreState, action: Action): StoreState {
  switch (action.type) {
    case "draft/start":
      return {
        ...state,
        draft: { customerId: null, items: [], method: "نقدي", installment: null },
      };

    case "draft/clear":
      return { ...state, draft: null };

    case "draft/setCustomer":
      if (!state.draft) return state;
      return { ...state, draft: { ...state.draft, customerId: action.customerId } };

    case "draft/addItem": {
      if (!state.draft) return state;
      const prod = state.products.find((p) => p.id === action.productId);
      if (!prod) return state;
      const qty = action.qty ?? 1;
      const items = state.draft.items.slice();
      const idx = items.findIndex((it) => it.pid === action.productId);
      if (idx >= 0) {
        items[idx] = { ...items[idx], qty: items[idx].qty + qty };
      } else {
        items.push({ pid: action.productId, qty, price: prod.price });
      }
      return { ...state, draft: { ...state.draft, items } };
    }

    case "draft/updateItemQty": {
      if (!state.draft) return state;
      const items = state.draft.items
        .map((it) => (it.pid === action.productId ? { ...it, qty: action.qty } : it))
        .filter((it) => it.qty > 0);
      return { ...state, draft: { ...state.draft, items } };
    }

    case "draft/removeItem":
      if (!state.draft) return state;
      return {
        ...state,
        draft: {
          ...state.draft,
          items: state.draft.items.filter((it) => it.pid !== action.productId),
        },
      };

    case "draft/setMethod":
      if (!state.draft) return state;
      return {
        ...state,
        draft: {
          ...state.draft,
          method: action.method,
          installment: action.method === "تقسيط" ? { plan: action.plan || 3 } : null,
        },
      };

    case "draft/commit": {
      const d = state.draft;
      if (!d || !d.customerId || d.items.length === 0) return state;
      const total = draftTotal(d);
      const paid = d.method === "تقسيط" || d.method === "آجل" ? 0 : total;
      const no = String(state.nextInvoiceNo);
      const inv: Invoice = {
        id: "i" + no,
        no,
        customerId: d.customerId,
        date: "29 أكتوبر 2026",
        time: "الآن",
        total,
        paid,
        method: d.method,
        items: d.items.slice(),
        installment:
          d.method === "تقسيط"
            ? { total, plan: d.installment?.plan || 3, paid: 0 }
            : null,
        _new: true,
      };
      const customers = state.customers.map((c) => {
        if (c.id !== d.customerId) return c;
        const add = total - paid;
        return {
          ...c,
          debt: c.debt + add,
          invoices: c.invoices + 1,
          totalSpent: c.totalSpent + total,
          lastVisit: "اليوم",
        };
      });
      const stats = {
        ...state.stats,
        todayRevenue: state.stats.todayRevenue + total,
        monthRevenue: state.stats.monthRevenue + total,
        totalDebts: state.stats.totalDebts + (total - paid),
        debtCount:
          state.stats.debtCount + (total - paid > 0 ? 1 : 0),
      };
      return {
        ...state,
        invoices: [inv, ...state.invoices],
        customers,
        stats,
        nextInvoiceNo: state.nextInvoiceNo + 1,
        draft: null,
      };
    }

    case "payment/record": {
      const inv = state.invoices.find((i) => i.id === action.invoiceId);
      if (!inv) return state;
      const newPaid = Math.min(inv.total, inv.paid + action.amount);
      const delta = newPaid - inv.paid;
      const invoices = state.invoices.map((i) => {
        if (i.id !== action.invoiceId) return i;
        const updated: Invoice = { ...i, paid: newPaid };
        if (i.installment) {
          updated.installment = {
            ...i.installment,
            paid: (i.installment.paid || 0) + delta,
          };
        }
        return updated;
      });
      const customers = state.customers.map((c) => {
        if (c.id !== inv.customerId) return c;
        return { ...c, debt: Math.max(0, c.debt - delta) };
      });
      const stats = {
        ...state.stats,
        totalDebts: Math.max(0, state.stats.totalDebts - delta),
      };
      return { ...state, invoices, customers, stats };
    }

    case "product/add": {
      const id = action.product.id || `p${state.nextProductId}`;
      const prod: Product = {
        sku: String(Math.floor(10000 + Math.random() * 90000)),
        description: "",
        image_url: null,
        low_stock_threshold: 5,
        barcode: "",
        is_active: true,
        ...action.product,
        id,
      } as Product;
      return {
        ...state,
        products: [prod, ...state.products],
        nextProductId: state.nextProductId + 1,
      };
    }
    case "product/update":
      return {
        ...state,
        products: state.products.map((p) =>
          p.id === action.id ? { ...p, ...action.patch } : p
        ),
      };
    case "product/delete":
      return { ...state, products: state.products.filter((p) => p.id !== action.id) };

    case "customer/add": {
      const id = action.customer.id || `c${state.nextCustomerId}`;
      const name = (action.customer.name || "زبونة جديدة").trim();
      const cust: Customer = {
        phone: "",
        debt: 0,
        invoices: 0,
        totalSpent: 0,
        lastVisit: "الآن",
        tag: "عادية",
        address: "",
        whatsapp: "",
        birthday: null,
        notes: "",
        avatar_color: null,
        ...action.customer,
        name,
        initial: action.customer.initial || name.charAt(0),
        id,
      } as Customer;
      return {
        ...state,
        customers: [cust, ...state.customers],
        nextCustomerId: state.nextCustomerId + 1,
      };
    }
    case "customer/update":
      return {
        ...state,
        customers: state.customers.map((c) =>
          c.id === action.id
            ? { ...c, ...action.patch, initial: (action.patch.name || c.name).charAt(0) }
            : c
        ),
      };
    case "customer/delete":
      return { ...state, customers: state.customers.filter((c) => c.id !== action.id) };

    case "expense/add": {
      const id = `e${state.nextExpenseId}`;
      const exp: Expense = {
        receipt_url: null,
        ...action.expense,
        id,
        created_at: "الآن",
      } as Expense;
      return {
        ...state,
        expenses: [exp, ...state.expenses],
        nextExpenseId: state.nextExpenseId + 1,
      };
    }
    case "expense/update":
      return {
        ...state,
        expenses: state.expenses.map((e) => (e.id === action.id ? { ...e, ...action.patch } : e)),
      };
    case "expense/delete":
      return { ...state, expenses: state.expenses.filter((e) => e.id !== action.id) };

    case "settings/store/update":
      return { ...state, storeSettings: { ...state.storeSettings, ...action.patch } };

    case "settings/notifications/update": {
      // Deep-merge for nested structures (alerts / channels / quiet_hours)
      const ns = state.notificationSettings;
      const merged: NotificationSettings = {
        alerts:      { ...ns.alerts,      ...(action.patch.alerts      || {}) },
        channels:    { ...ns.channels,    ...(action.patch.channels    || {}) },
        quiet_hours: { ...ns.quiet_hours, ...(action.patch.quiet_hours || {}) },
      };
      return { ...state, notificationSettings: merged };
    }

    case "settings/security/update": {
      const ss = state.securitySettings;
      return {
        ...state,
        securitySettings: {
          ...ss,
          ...action.patch,
          sessions: action.patch.sessions ?? ss.sessions,
        },
      };
    }

    case "settings/security/endSession":
      return {
        ...state,
        securitySettings: {
          ...state.securitySettings,
          sessions: state.securitySettings.sessions.filter((s) => s.id !== action.id),
        },
      };

    case "settings/security/endAllOther":
      return {
        ...state,
        securitySettings: {
          ...state.securitySettings,
          sessions: state.securitySettings.sessions.filter((s) => s.current),
        },
      };

    case "profile/update":
      return { ...state, userProfile: { ...state.userProfile, ...action.patch } };

    case "check/add": {
      const id = `ch${state.nextCheckId}`;
      const check: Check = {
        bank: "",
        notes: "",
        party_id: null,
        cashed_date: null,
        ...action.check,
        id,
        created_at: todayIso(),
      } as Check;
      return { ...state, checks: [check, ...state.checks], nextCheckId: state.nextCheckId + 1 };
    }

    case "check/update":
      return {
        ...state,
        checks: state.checks.map((c) => (c.id === action.id ? { ...c, ...action.patch } : c)),
      };

    case "check/delete":
      return { ...state, checks: state.checks.filter((c) => c.id !== action.id) };

    case "check/setStatus": {
      return {
        ...state,
        checks: state.checks.map((c) => {
          if (c.id !== action.id) return c;
          const patch: Partial<Check> = { status: action.status };
          if (action.status === "cashed") patch.cashed_date = todayIso();
          else if (action.status === "pending") patch.cashed_date = null;
          return { ...c, ...patch };
        }),
      };
    }

    case "debt/add": {
      const id = `d${state.nextDebtId}`;
      const debt: Debt = {
        notes: "",
        party_id: null,
        settled_date: null,
        due_date: null,
        ...action.debt,
        id,
        created_at: todayIso(),
      } as Debt;
      return { ...state, debts: [debt, ...state.debts], nextDebtId: state.nextDebtId + 1 };
    }

    case "debt/update":
      return {
        ...state,
        debts: state.debts.map((d) => (d.id === action.id ? { ...d, ...action.patch } : d)),
      };

    case "debt/delete":
      return { ...state, debts: state.debts.filter((d) => d.id !== action.id) };

    case "debt/setStatus":
      return {
        ...state,
        debts: state.debts.map((d) => {
          if (d.id !== action.id) return d;
          const patch: Partial<Debt> = { status: action.status };
          if (action.status === "settled") patch.settled_date = todayIso();
          else if (action.status === "pending") patch.settled_date = null;
          return { ...d, ...patch };
        }),
      };

    case "recurring/add": {
      const id = `r${state.nextRecurringId}`;
      const rec: RecurringExpense = {
        notes: "",
        end_date: null,
        is_active: true,
        ...action.recurring,
        id,
        created_at: todayIso(),
      } as RecurringExpense;
      return {
        ...state,
        recurringExpenses: [rec, ...state.recurringExpenses],
        nextRecurringId: state.nextRecurringId + 1,
      };
    }

    case "recurring/update":
      return {
        ...state,
        recurringExpenses: state.recurringExpenses.map((r) =>
          r.id === action.id ? { ...r, ...action.patch } : r
        ),
      };

    case "recurring/delete":
      return {
        ...state,
        recurringExpenses: state.recurringExpenses.filter((r) => r.id !== action.id),
      };

    case "supplier/add": {
      const id = action.supplier.id || `sup${state.nextSupplierId}`;
      const name = (action.supplier.name || "مورّد جديد").trim();
      const sup: Supplier = {
        is_active: true,
        avatar_color: null,
        ...action.supplier,
        id,
        name,
        initial: action.supplier.initial || name.charAt(0),
        created_at: todayIso(),
      } as Supplier;
      return {
        ...state,
        suppliers: [sup, ...state.suppliers],
        nextSupplierId: state.nextSupplierId + 1,
      };
    }
    case "supplier/update":
      return {
        ...state,
        suppliers: state.suppliers.map((s) =>
          s.id === action.id
            ? { ...s, ...action.patch, initial: (action.patch.name || s.name).charAt(0) }
            : s
        ),
      };
    case "supplier/delete":
      return { ...state, suppliers: state.suppliers.filter((s) => s.id !== action.id) };

    case "goal/add": {
      const id = `g${state.nextGoalId}`;
      const goal: Goal = {
        auto_repeat: false,
        status: "active",
        ...action.goal,
        id,
        created_at: todayIso(),
      } as Goal;
      return { ...state, goals: [goal, ...state.goals], nextGoalId: state.nextGoalId + 1 };
    }
    case "goal/update":
      return {
        ...state,
        goals: state.goals.map((g) => (g.id === action.id ? { ...g, ...action.patch } : g)),
      };
    case "goal/delete":
      return { ...state, goals: state.goals.filter((g) => g.id !== action.id) };
    case "goal/setStatus":
      return {
        ...state,
        goals: state.goals.map((g) => (g.id === action.id ? { ...g, status: action.status } : g)),
      };

    case "notif/markRead":
      return {
        ...state,
        appNotifications: state.appNotifications.map((n) =>
          n.id === action.id ? { ...n, is_read: true } : n
        ),
      };
    case "notif/markAllRead":
      return {
        ...state,
        appNotifications: state.appNotifications.map((n) => ({ ...n, is_read: true })),
      };
    case "notif/delete":
      return {
        ...state,
        appNotifications: state.appNotifications.filter((n) => n.id !== action.id),
      };

    case "customField/add": {
      const id = `cf${state.nextCustomFieldId}`;
      const def: CustomFieldDefinition = {
        is_active: true,
        is_required: false,
        show_in_list: true,
        show_in_search: false,
        sort_order: state.customFields.filter((f) => f.entity_type === action.def.entity_type).length + 1,
        ...action.def,
        id,
        created_at: todayIso(),
      } as CustomFieldDefinition;
      return {
        ...state,
        customFields: [def, ...state.customFields],
        nextCustomFieldId: state.nextCustomFieldId + 1,
      };
    }
    case "customField/update":
      return {
        ...state,
        customFields: state.customFields.map((f) =>
          f.id === action.id ? { ...f, ...action.patch } : f
        ),
      };
    case "customField/delete":
      return {
        ...state,
        customFields: state.customFields.filter((f) => f.id !== action.id),
      };

    case "store/reset":
      return action.mode === "empty" ? createEmptyState() : createDemoState();

    case "store/replace":
    case "store/hydrate":
      return action.state;

    default:
      return state;
  }
}

// ─── Unified cash-flow item ──────────────────────────────────────────────────
/**
 * A CashFlowItem is the UI-facing unification of:
 *   - Check (with due_date + status)
 *   - Debt (informal IOU, may or may not have due_date)
 *   - Invoice balance (invoices where paid < total)
 *
 * The hub renders a mixed timeline from these three sources.
 */
export type CashFlowSource = "check" | "debt" | "invoice";
export type CashFlowDirection = "incoming" | "outgoing";
export type CashFlowItemStatus = "pending" | "settled" | "overdue" | "bounced" | "cancelled";

export interface CashFlowItem {
  id: string;             // composite, e.g. "check:ch1"
  sourceType: CashFlowSource;
  sourceId: string;       // id of underlying check/debt/invoice
  direction: CashFlowDirection;
  amount: number;         // what's still due (remaining for partial payments)
  party_name: string;
  due_date: string | null;
  status: CashFlowItemStatus;
  /** Human-readable reference, e.g. "#125443" or "فاتورة 4123". */
  ref?: string;
  description?: string;
}

/**
 * Monthly projection — revenue, expenses, net profit/loss.
 *
 * For the "current" month, `revenue.actual_sales` uses stats.monthRevenue
 * (a mock of billed sales this month). For future months, it's 0 — we don't
 * forecast sales, only expected cash events.
 *
 * Expenses include:
 *  - Recorded expenses in the month (for current month, all recorded)
 *  - Recurring expenses occurring in that month
 *  - Outgoing checks/debts due in that month (cash-out obligations)
 */
export interface MonthlyProjection {
  ym: YearMonth;
  isCurrent: boolean;
  revenue: {
    actual_sales: number;       // billed sales
    incoming_checks: number;    // pending incoming checks due in month
    incoming_debts: number;     // pending incoming debts due in month
    total: number;
  };
  expenses: {
    actual: number;             // recorded expenses
    recurring: number;          // projected recurring
    outgoing_checks: number;    // pending outgoing checks due in month
    outgoing_debts: number;     // pending outgoing debts due in month
    total: number;
  };
  net: number;
  // Line-item details for displaying the breakdown list
  recurringOccurrences: RecurringOccurrence[];
}

// ─── Selectors + action creators hook ────────────────────────────────────────
interface StoreCtx {
  state: StoreState;
  // Pure selectors
  findCustomer: (id: string) => Customer | undefined;
  findProduct: (id: string) => Product | undefined;
  findInvoice: (id: string) => Invoice | undefined;
  draftTotal: () => number;
  calculateMargin: (price: number, cost: number) => number;
  getProductStats: (productId: string) => { soldQty: number; revenue: number; profit: number };
  // Actions
  startDraft: () => void;
  clearDraft: () => void;
  setDraftCustomer: (customerId: string) => void;
  addDraftItem: (productId: string, qty?: number) => void;
  updateDraftItemQty: (productId: string, qty: number) => void;
  removeDraftItem: (productId: string) => void;
  setDraftMethod: (method: InvoiceMethod, plan?: number) => void;
  commitDraft: () => Invoice | null;
  recordPayment: (invoiceId: string, amount: number) => void;
  /** Add a product. Returns the new product's id (for auto-select / follow-up actions). */
  addProduct: (product: Partial<Product> & { name: string; price: number; cost: number }) => string;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  /** Add a customer. Returns the new customer's id (for auto-select / follow-up actions). */
  addCustomer: (customer: Partial<Customer> & { name: string }) => string;
  updateCustomer: (id: string, patch: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  addExpense: (expense: Omit<Expense, "id" | "created_at">) => void;
  updateExpense: (id: string, patch: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  updateStoreSettings: (patch: Partial<StoreSettings>) => void;
  updateNotificationSettings: (patch: Partial<NotificationSettings>) => void;
  updateSecuritySettings: (patch: Partial<SecuritySettings>) => void;
  endSession: (id: string) => void;
  endAllOtherSessions: () => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
  // Checks — the #1 feature for Arab-Israeli SMBs
  findCheck: (id: string) => Check | undefined;
  addCheck: (check: Omit<Check, "id" | "created_at">) => void;
  updateCheck: (id: string, patch: Partial<Check>) => void;
  deleteCheck: (id: string) => void;
  setCheckStatus: (id: string, status: CheckStatus) => void;
  /** Cash flow projection for the next N days (default 7).
   *  Uses only `pending` checks; adds `cashed` checks within the window too. */
  cashFlow: (days?: number) => {
    incoming: number;
    outgoing: number;
    net: number;
    incomingCount: number;
    outgoingCount: number;
  };
  /** Sum of all overdue pending checks, by direction. */
  overdueAmounts: () => { incoming: number; outgoing: number; incomingCount: number; outgoingCount: number };
  // Debts (informal / على الحساب)
  findDebt: (id: string) => Debt | undefined;
  addDebt: (debt: Omit<Debt, "id" | "created_at">) => void;
  updateDebt: (id: string, patch: Partial<Debt>) => void;
  deleteDebt: (id: string) => void;
  setDebtStatus: (id: string, status: DebtStatus) => void;
  /** Unified cash-flow listing (checks + debts + invoice balances), filterable.
   *  Items are sorted ascending by due_date; items without a due_date sort last. */
  getCashFlow: (opts?: {
    from?: string | null;    // ISO; inclusive
    to?: string | null;      // ISO; inclusive
    types?: CashFlowSource[]; // default: all three
    direction?: CashFlowDirection | "all";
    includeSettled?: boolean; // default false
  }) => CashFlowItem[];
  // Recurring expenses (مصاريف ثابتة)
  findRecurring: (id: string) => RecurringExpense | undefined;
  addRecurring: (recurring: Omit<RecurringExpense, "id" | "created_at">) => void;
  updateRecurring: (id: string, patch: Partial<RecurringExpense>) => void;
  deleteRecurring: (id: string) => void;
  /** Full monthly P&L projection with line-item breakdown. */
  projectMonth: (ym: YearMonth) => MonthlyProjection;
  // Suppliers
  findSupplier: (id: string) => Supplier | undefined;
  addSupplier: (supplier: Partial<Supplier> & { name: string }) => string;
  updateSupplier: (id: string, patch: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  /** Computed: total paid to a supplier (from expenses + cashed outgoing checks/debts) */
  supplierStats: (id: string) => { totalPaid: number; outstanding: number; invoiceCount: number; lastPurchaseIso: string | null };
  // Goals
  findGoal: (id: string) => Goal | undefined;
  addGoal: (goal: Omit<Goal, "id" | "created_at">) => void;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  setGoalStatus: (id: string, status: GoalStatus) => void;
  /** Current progress for a given goal (based on actual recorded data). */
  goalProgress: (goal: Goal) => { current: number; percentage: number; projected: number };
  // App notifications
  unreadNotifications: () => number;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  deleteNotification: (id: string) => void;
  // Custom fields
  customFieldsFor: (entityType: CustomFieldDefinition["entity_type"]) => CustomFieldDefinition[];
  addCustomField: (def: Omit<CustomFieldDefinition, "id" | "created_at">) => void;
  updateCustomField: (id: string, patch: Partial<CustomFieldDefinition>) => void;
  deleteCustomField: (id: string) => void;
  /** Reset the entire store to demo seed or an empty (fresh-install) state. */
  resetStore: (mode: "demo" | "empty") => void;
  /** Replace the entire store state (used by JSON import). */
  replaceStore: (state: StoreState) => void;
}

const Ctx = createContext<StoreCtx | null>(null);

export function useStore(): StoreCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used within <StoreProvider>");
  return ctx;
}

// ─── Persistence ─────────────────────────────────────────────────────────────
// We persist the entire main store to localStorage so the user's data
// survives refreshes. The store is small (everything in arrays of plain
// objects), so JSON.stringify is fine — typical user data should be well
// under 1 MB.
const STORE_KEY = "tijarti_store_v1";

function loadPersisted(): StoreState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Sanity check — must look like a StoreState
    if (!parsed || typeof parsed !== "object") return null;
    if (!Array.isArray(parsed.expenses) || !Array.isArray(parsed.customers)) return null;
    return parsed as StoreState;
  } catch {
    return null;
  }
}

function persist(state: StoreState): void {
  if (typeof window === "undefined") return;
  try {
    // Don't persist the in-flight draft — it's transient UI state.
    const exportable: StoreState = { ...state, draft: null };
    localStorage.setItem(STORE_KEY, JSON.stringify(exportable));
  } catch {
    // localStorage might be full or blocked — silent fail.
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const hydratedRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate from localStorage once, on mount (client side only)
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    const persisted = loadPersisted();
    if (persisted) {
      dispatch({ type: "store/hydrate", state: persisted });
    }
  }, []);

  // Persist on every state change — debounced so we don't thrash
  useEffect(() => {
    if (!hydratedRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => persist(state), 300);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [state]);


  const api: StoreCtx = useMemo(() => {
    return {
      state,
      findCustomer: (id) => state.customers.find((c) => c.id === id),
      findProduct: (id) => state.products.find((p) => p.id === id),
      findInvoice: (id) => state.invoices.find((i) => i.id === id),
      draftTotal: () => draftTotal(state.draft),
      calculateMargin: (price, cost) => {
        const p = Number(price) || 0;
        const c = Number(cost) || 0;
        if (p <= 0) return 0;
        return Math.round(((p - c) / p) * 100);
      },
      getProductStats: (productId) => {
        let soldQty = 0;
        let revenue = 0;
        let profit = 0;
        const prod = state.products.find((p) => p.id === productId);
        const cost = prod ? prod.cost : 0;
        for (const inv of state.invoices) {
          for (const it of inv.items || []) {
            if (it.pid === productId) {
              soldQty += it.qty;
              revenue += it.qty * it.price;
              profit += it.qty * (it.price - cost);
            }
          }
        }
        return { soldQty, revenue, profit };
      },
      startDraft: () => dispatch({ type: "draft/start" }),
      clearDraft: () => dispatch({ type: "draft/clear" }),
      setDraftCustomer: (customerId) => dispatch({ type: "draft/setCustomer", customerId }),
      addDraftItem: (productId, qty) => dispatch({ type: "draft/addItem", productId, qty }),
      updateDraftItemQty: (productId, qty) => dispatch({ type: "draft/updateItemQty", productId, qty }),
      removeDraftItem: (productId) => dispatch({ type: "draft/removeItem", productId }),
      setDraftMethod: (method, plan) => dispatch({ type: "draft/setMethod", method, plan }),
      commitDraft: () => {
        // NOTE: We can't return the new invoice synchronously from useReducer.
        // Navigate by no=nextInvoiceNo BEFORE dispatching.
        const d = state.draft;
        if (!d || !d.customerId || d.items.length === 0) return null;
        const no = String(state.nextInvoiceNo);
        dispatch({ type: "draft/commit" });
        // Return a shallow representation for routing.
        return {
          id: "i" + no,
          no,
          customerId: d.customerId,
          date: "29 أكتوبر 2026",
          time: "الآن",
          total: draftTotal(d),
          paid: d.method === "تقسيط" || d.method === "آجل" ? 0 : draftTotal(d),
          method: d.method,
          items: d.items.slice(),
          installment: null,
        } as Invoice;
      },
      recordPayment: (invoiceId, amount) =>
        dispatch({ type: "payment/record", invoiceId, amount }),
      addProduct: (product) => {
        // Compute id here so we can return it synchronously to the caller.
        const id = product.id ?? `p${state.nextProductId}`;
        dispatch({ type: "product/add", product: { ...product, id } as any });
        return id;
      },
      updateProduct: (id, patch) => dispatch({ type: "product/update", id, patch }),
      deleteProduct: (id) => dispatch({ type: "product/delete", id }),
      addCustomer: (customer) => {
        const id = customer.id ?? `c${state.nextCustomerId}`;
        dispatch({ type: "customer/add", customer: { ...customer, id } as any });
        return id;
      },
      updateCustomer: (id, patch) => dispatch({ type: "customer/update", id, patch }),
      deleteCustomer: (id) => dispatch({ type: "customer/delete", id }),
      addExpense: (expense) => dispatch({ type: "expense/add", expense }),
      updateExpense: (id, patch) => dispatch({ type: "expense/update", id, patch }),
      deleteExpense: (id) => dispatch({ type: "expense/delete", id }),
      updateStoreSettings: (patch) => dispatch({ type: "settings/store/update", patch }),
      updateNotificationSettings: (patch) => dispatch({ type: "settings/notifications/update", patch }),
      updateSecuritySettings: (patch) => dispatch({ type: "settings/security/update", patch }),
      endSession: (id) => dispatch({ type: "settings/security/endSession", id }),
      endAllOtherSessions: () => dispatch({ type: "settings/security/endAllOther" }),
      updateProfile: (patch) => dispatch({ type: "profile/update", patch }),
      findCheck: (id) => state.checks.find((c) => c.id === id),
      addCheck: (check) => dispatch({ type: "check/add", check }),
      updateCheck: (id, patch) => dispatch({ type: "check/update", id, patch }),
      deleteCheck: (id) => dispatch({ type: "check/delete", id }),
      setCheckStatus: (id, status) => dispatch({ type: "check/setStatus", id, status }),
      cashFlow: (days = 7) => {
        let incoming = 0;
        let outgoing = 0;
        let incomingCount = 0;
        let outgoingCount = 0;
        for (const c of state.checks) {
          if (c.status !== "pending") continue;
          // Include overdue (days < 0) AND upcoming within window — these are the user's real cash-flow concerns.
          const d = daysUntil(c.due_date);
          if (d > days) continue;
          if (c.direction === "incoming") {
            incoming += c.amount;
            incomingCount += 1;
          } else {
            outgoing += c.amount;
            outgoingCount += 1;
          }
        }
        return { incoming, outgoing, net: incoming - outgoing, incomingCount, outgoingCount };
      },
      overdueAmounts: () => {
        let incoming = 0;
        let outgoing = 0;
        let incomingCount = 0;
        let outgoingCount = 0;
        for (const c of state.checks) {
          if (c.status !== "pending") continue;
          if (daysUntil(c.due_date) >= 0) continue;
          if (c.direction === "incoming") {
            incoming += c.amount;
            incomingCount += 1;
          } else {
            outgoing += c.amount;
            outgoingCount += 1;
          }
        }
        return { incoming, outgoing, incomingCount, outgoingCount };
      },
      findDebt: (id) => state.debts.find((d) => d.id === id),
      addDebt: (debt) => dispatch({ type: "debt/add", debt }),
      updateDebt: (id, patch) => dispatch({ type: "debt/update", id, patch }),
      deleteDebt: (id) => dispatch({ type: "debt/delete", id }),
      setDebtStatus: (id, status) => dispatch({ type: "debt/setStatus", id, status }),
      getCashFlow: ({
        from = null,
        to = null,
        types = ["check", "debt", "invoice"],
        direction = "all",
        includeSettled = false,
      } = {}) => {
        const items: CashFlowItem[] = [];
        const inRange = (iso: string | null): boolean => {
          if (!iso) return true; // null due_date = always in range
          if (from && iso < from) return false;
          if (to && iso > to) return false;
          return true;
        };

        // ─── Checks ────────────────────────────────────────────────────────
        if (types.includes("check")) {
          for (const c of state.checks) {
            if (!includeSettled && c.status !== "pending" && c.status !== "bounced") continue;
            if (!inRange(c.due_date)) continue;
            const status: CashFlowItemStatus =
              c.status === "cashed" ? "settled"
              : c.status === "bounced" ? "bounced"
              : c.status === "cancelled" ? "cancelled"
              : daysUntil(c.due_date) < 0 ? "overdue"
              : "pending";
            items.push({
              id: `check:${c.id}`,
              sourceType: "check",
              sourceId: c.id,
              direction: c.direction,
              amount: c.amount,
              party_name: c.party_name,
              due_date: c.due_date,
              status,
              ref: `#${c.number}`,
              description: c.notes || (c.bank ? `بنك ${c.bank}` : undefined),
            });
          }
        }

        // ─── Informal debts ────────────────────────────────────────────────
        if (types.includes("debt")) {
          for (const d of state.debts) {
            if (!includeSettled && d.status !== "pending") continue;
            if (!inRange(d.due_date ?? null)) continue;
            const status: CashFlowItemStatus =
              d.status === "settled" ? "settled"
              : d.status === "cancelled" ? "cancelled"
              : d.due_date && daysUntil(d.due_date) < 0 ? "overdue"
              : "pending";
            items.push({
              id: `debt:${d.id}`,
              sourceType: "debt",
              sourceId: d.id,
              direction: d.direction,
              amount: d.amount,
              party_name: d.party_name,
              due_date: d.due_date || null,
              status,
              ref: "على الحساب",
              description: d.description,
            });
          }
        }

        // ─── Invoice balances (unpaid portions of آجل/تقسيط invoices) ─────
        if (types.includes("invoice")) {
          for (const inv of state.invoices) {
            const remaining = inv.total - inv.paid;
            if (remaining <= 0 && !includeSettled) continue;
            // Invoices use Arabic date strings; we don't have ISO here.
            // Include with null due_date (they'll sort to the end / "no date" bucket).
            const customer = state.customers.find((c) => c.id === inv.customerId);
            const status: CashFlowItemStatus =
              remaining <= 0 ? "settled" : "pending";
            if (direction !== "all" && direction !== "incoming") {
              // invoice balances are always money owed TO the shop
              continue;
            }
            items.push({
              id: `invoice:${inv.id}`,
              sourceType: "invoice",
              sourceId: inv.id,
              direction: "incoming",
              amount: remaining,
              party_name: customer?.name || "—",
              due_date: null, // invoice dates are Arabic strings, leave null
              status,
              ref: `فاتورة ${inv.no}`,
              description: `${inv.method}${inv.installment ? ` · قسط` : ""}`,
            });
          }
        }

        // Filter by direction
        const filtered = direction === "all" ? items : items.filter((i) => i.direction === direction);

        // Sort: by due_date ascending (null last), overdue first within same date
        filtered.sort((a, b) => {
          if (a.due_date && b.due_date) {
            if (a.due_date !== b.due_date) return a.due_date.localeCompare(b.due_date);
            return 0;
          }
          if (a.due_date && !b.due_date) return -1;
          if (!a.due_date && b.due_date) return 1;
          return 0;
        });

        return filtered;
      },
      // ─── Suppliers ─────────────────────────────────────────────────────────
      findSupplier: (id) => state.suppliers.find((s) => s.id === id),
      addSupplier: (supplier) => {
        const id = supplier.id ?? `sup${state.nextSupplierId}`;
        dispatch({ type: "supplier/add", supplier: { ...supplier, id } as any });
        return id;
      },
      updateSupplier: (id, patch) => dispatch({ type: "supplier/update", id, patch }),
      deleteSupplier: (id) => dispatch({ type: "supplier/delete", id }),
      supplierStats: (id) => {
        let totalPaid = 0;
        let outstanding = 0;
        let invoiceCount = 0;
        let lastPurchaseIso: string | null = null;
        const sup = state.suppliers.find((s) => s.id === id);
        if (!sup) return { totalPaid: 0, outstanding: 0, invoiceCount: 0, lastPurchaseIso: null };
        // Cashed outgoing checks to this party_name
        for (const c of state.checks) {
          if (c.direction !== "outgoing") continue;
          if (c.party_name !== sup.name) continue;
          invoiceCount += 1;
          if (c.status === "cashed") totalPaid += c.amount;
          else if (c.status === "pending") outstanding += c.amount;
          if (!lastPurchaseIso || c.issued_date > lastPurchaseIso) lastPurchaseIso = c.issued_date;
        }
        // Outgoing debts
        for (const d of state.debts) {
          if (d.direction !== "outgoing") continue;
          if (d.party_name !== sup.name) continue;
          invoiceCount += 1;
          if (d.status === "settled") totalPaid += d.amount;
          else if (d.status === "pending") outstanding += d.amount;
          if (!lastPurchaseIso || d.issued_date > lastPurchaseIso) lastPurchaseIso = d.issued_date;
        }
        return { totalPaid, outstanding, invoiceCount, lastPurchaseIso };
      },
      // ─── Goals ─────────────────────────────────────────────────────────────
      findGoal: (id) => state.goals.find((g) => g.id === id),
      addGoal: (goal) => dispatch({ type: "goal/add", goal }),
      updateGoal: (id, patch) => dispatch({ type: "goal/update", id, patch }),
      deleteGoal: (id) => dispatch({ type: "goal/delete", id }),
      setGoalStatus: (id, status) => dispatch({ type: "goal/setStatus", id, status }),
      goalProgress: (goal) => {
        // Compute current value based on goal type + period
        let current = 0;
        if (goal.type === "revenue") {
          // Sum of invoice.total in period — using all invoices as approximation
          // (real data model uses Arabic dates; this is honest best-effort)
          current = state.invoices.reduce((s, inv) => s + inv.total, 0);
        } else if (goal.type === "net_profit") {
          const revenue = state.invoices.reduce((s, inv) => s + inv.total, 0);
          const expenses = state.expenses.reduce((s, e) => s + e.amount, 0);
          current = revenue - expenses;
        } else if (goal.type === "expense_reduction") {
          // For expense reduction: current = total spent on that category in period
          current = state.expenses
            .filter((e) => !goal.target_category || e.category === goal.target_category)
            .reduce((s, e) => s + e.amount, 0);
        }
        const percentage = goal.target_amount > 0
          ? Math.min(100, Math.round((current / goal.target_amount) * 100))
          : 0;
        // Simple projection — assume linear rate through the period.
        // For this stub, just return current as projected.
        const projected = current;
        return { current, percentage, projected };
      },
      // ─── App notifications ─────────────────────────────────────────────────
      unreadNotifications: () => state.appNotifications.filter((n) => !n.is_read).length,
      markNotificationRead: (id) => dispatch({ type: "notif/markRead", id }),
      markAllNotificationsRead: () => dispatch({ type: "notif/markAllRead" }),
      deleteNotification: (id) => dispatch({ type: "notif/delete", id }),
      // ─── Custom field definitions ──────────────────────────────────────────
      customFieldsFor: (entityType) =>
        state.customFields
          .filter((f) => f.entity_type === entityType && f.is_active)
          .sort((a, b) => a.sort_order - b.sort_order),
      addCustomField: (def) => dispatch({ type: "customField/add", def }),
      updateCustomField: (id, patch) => dispatch({ type: "customField/update", id, patch }),
      deleteCustomField: (id) => dispatch({ type: "customField/delete", id }),
      resetStore: (mode) => dispatch({ type: "store/reset", mode }),
      replaceStore: (newState) => dispatch({ type: "store/replace", state: newState }),
      findRecurring: (id) => state.recurringExpenses.find((r) => r.id === id),
      addRecurring: (recurring) => dispatch({ type: "recurring/add", recurring }),
      updateRecurring: (id, patch) => dispatch({ type: "recurring/update", id, patch }),
      deleteRecurring: (id) => dispatch({ type: "recurring/delete", id }),
      projectMonth: (ym) => {
        const { from, to } = yearMonthRange(ym);
        const isCurrent = isSameYearMonth(ym, currentYearMonth());

        // Expand recurring expenses for this month
        const recurringOccurrences: RecurringOccurrence[] = [];
        for (const r of state.recurringExpenses) {
          recurringOccurrences.push(...expandRecurring(r, from, to));
        }
        const recurring = recurringOccurrences.reduce((s, o) => s + o.amount, 0);

        // Incoming checks due in month (pending)
        let incoming_checks = 0;
        for (const c of state.checks) {
          if (c.status !== "pending") continue;
          if (c.direction !== "incoming") continue;
          if (c.due_date < from || c.due_date > to) continue;
          incoming_checks += c.amount;
        }

        // Incoming debts due in month (pending with a due_date)
        let incoming_debts = 0;
        for (const d of state.debts) {
          if (d.status !== "pending") continue;
          if (d.direction !== "incoming") continue;
          if (!d.due_date) continue;
          if (d.due_date < from || d.due_date > to) continue;
          incoming_debts += d.amount;
        }

        // Outgoing checks due in month (pending)
        let outgoing_checks = 0;
        for (const c of state.checks) {
          if (c.status !== "pending") continue;
          if (c.direction !== "outgoing") continue;
          if (c.due_date < from || c.due_date > to) continue;
          outgoing_checks += c.amount;
        }

        // Outgoing debts due in month (pending with a due_date)
        let outgoing_debts = 0;
        for (const d of state.debts) {
          if (d.status !== "pending") continue;
          if (d.direction !== "outgoing") continue;
          if (!d.due_date) continue;
          if (d.due_date < from || d.due_date > to) continue;
          outgoing_debts += d.amount;
        }

        // Actual billed sales: prototype has mock stats only for "current" month.
        const actual_sales = isCurrent ? state.stats.monthRevenue : 0;

        // Actual expenses: prototype doesn't date-filter recorded expenses, so
        // we count all of them for the current month and 0 for future months.
        const actualExpenses = isCurrent
          ? state.expenses.reduce((s, e) => s + e.amount, 0)
          : 0;

        const revenue = {
          actual_sales,
          incoming_checks,
          incoming_debts,
          total: actual_sales + incoming_checks + incoming_debts,
        };
        const expenses = {
          actual: actualExpenses,
          recurring,
          outgoing_checks,
          outgoing_debts,
          total: actualExpenses + recurring + outgoing_checks + outgoing_debts,
        };
        return {
          ym,
          isCurrent,
          revenue,
          expenses,
          net: revenue.total - expenses.total,
          recurringOccurrences,
        };
      },
    };
  }, [state]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}
