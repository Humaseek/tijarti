/**
 * Domain types — ported from the HTML prototype.
 * These are the source of truth for the Tijarti data model.
 */

export type CustomerTag = "VIP" | "عادية" | "جديدة";

export interface Customer {
  id: string;
  name: string;
  initial: string;
  tag: CustomerTag;
  debt: number;
  invoices: number; // count
  totalSpent: number;
  phone: string;
  lastVisit: string;
  address?: string;
  whatsapp?: string;
  birthday?: string | null;
  notes?: string;
  avatar_color?: string | null;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  cost: number;
  stock: number;
  category: string;
  description?: string;
  image_url?: string | null;
  low_stock_threshold?: number;
  barcode?: string;
  is_active?: boolean;
}

// ─── Supplier (المورد) ──────────────────────────────────────────────────────
// Suppliers the shop buys from. Expenses + outgoing checks/debts link to them.
export interface Supplier {
  id: string;
  name: string;
  initial: string;
  phone?: string;
  email?: string;
  address?: string;
  business_number?: string;     // رقم עוסק/ח.פ
  default_category?: ExpenseCategory;  // تصنيف افتراضي للفواتير من هذا المورد
  payment_terms?: string;        // "Net 30" / "دفع فوري" / etc.
  notes?: string;
  is_active: boolean;
  avatar_color?: string | null;
  created_at: string;
}

export type InvoiceMethod = "نقدي" | "بطاقة" | "آجل" | "تقسيط";

export interface InvoiceItem {
  pid: string;
  qty: number;
  price: number;
}

export interface InstallmentPlan {
  total: number;
  plan: number; // number of installments
  paid: number; // cumulative amount paid through plan
}

export interface Invoice {
  id: string;
  no: string;
  customerId: string;
  date: string;
  time: string;
  total: number;
  paid: number;
  method: InvoiceMethod;
  items: InvoiceItem[];
  installment?: InstallmentPlan | null;
  /** Transient — set on commit, cleared on next state mutation. */
  _new?: boolean;
}

export type ExpenseCategory =
  | "إيجار"
  | "كهرباء"
  | "اتصالات"
  | "وقود"
  | "مواصلات"
  | "صيانة"
  | "رواتب"
  | "طعام ومطاعم"
  | "بضاعة ومشتريات"
  | "تسويق وإعلان"
  | "خدمات مكتبية"
  | "بنوك ومدفوعات"
  | "ضرائب ورسوم"
  | "قروض وتقسيط"
  | "أخرى";

export type PaymentMethod = "نقدي" | "بطاقة" | "تحويل" | "شيك";

export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  payment_method: PaymentMethod;
  expense_date: string;
  receipt_url?: string | null;
  created_at: string;
}

export interface Stats {
  todayRevenue: number;
  monthRevenue: number;
  totalDebts: number;
  debtCount: number;
}

// ─── Checks (شيكات) — the #1 pain point for Arab-Israeli SMBs ───────────────
// outgoing = شيك أصدرتُه (لمورّد مثلاً) — التزام عليّ
// incoming = شيك استلمتُه من زبونة — أحصّله
export type CheckDirection = "outgoing" | "incoming";

// pending  = لم يُصرف بعد (قد يكون post-dated)
// cashed   = صُرف / حُصِّل
// bounced  = مرتجع (لم يُصرف)
// cancelled = ملغى
export type CheckStatus = "pending" | "cashed" | "bounced" | "cancelled";

export interface Check {
  id: string;
  direction: CheckDirection;
  number: string;              // رقم الشيك
  amount: number;
  party_name: string;          // اسم المورد / الزبونة
  party_id?: string | null;    // FK to customer (for incoming) — optional
  due_date: string;            // ISO YYYY-MM-DD — تاريخ الاستحقاق
  issued_date: string;         // ISO YYYY-MM-DD — تاريخ الإصدار
  bank?: string;               // بنك الشيك
  status: CheckStatus;
  notes?: string;
  cashed_date?: string | null; // ISO — عند التحصيل
  created_at: string;
}

// ─── Informal debts (على الحساب) — no check, no bank, just a promise ────────
export type DebtDirection = "outgoing" | "incoming";
// outgoing = أنا عليّ (أخذت خدمة/بضاعة ولم أدفع)
// incoming = عليّ له (زبونة اشترت ولم تدفع بدون فاتورة رسمية)

export type DebtStatus = "pending" | "settled" | "cancelled";

export interface Debt {
  id: string;
  direction: DebtDirection;
  amount: number;
  party_name: string;          // اسم الشخص/المصلحة
  party_id?: string | null;    // FK to customer — optional
  description: string;         // "أخذت خدمة كهربائي" / "بعت بدون فاتورة"
  due_date?: string | null;    // ISO — optional (مفتوح = بدون تاريخ)
  issued_date: string;         // ISO — متى نشأ الدَين
  status: DebtStatus;
  settled_date?: string | null;
  notes?: string;
  created_at: string;
}

export interface DraftInvoice {
  customerId: string | null;
  items: InvoiceItem[];
  method: InvoiceMethod;
  installment: { plan: number } | null;
}

// ─── Settings entities ──────────────────────────────────────────────────────
// NOTE: Tijarti is a neutral record-keeping tool — it does NOT compute VAT.
// Taxes paid are recorded as expenses under the "ضرائب ورسوم" category.

export interface WorkingHours {
  from: string; // HH:MM
  to: string;   // HH:MM
  days: string[]; // ['sun','mon',...]
}

/** Entry mode — determines how the shop records income (per spec 2.2 + 6.2.4).
 *  - aggregate: one number per day (أبو محمد, يوسف)
 *  - per_product: each sale is a full transaction with line items (ليلى)  */
export type EntryMode = "aggregate" | "per_product";

export interface StoreSettings {
  store_name: string;
  store_address: string;
  store_phone: string;
  store_email: string;
  business_type: string;
  logo_url: string | null;
  currency: string;
  currency_symbol: string;
  vip_discount_rate: number;
  low_stock_default: number;
  working_hours: WorkingHours;
  timezone: string;
  language: string;
  /** How income is recorded. Defaults to per_product if not set. */
  entry_mode?: EntryMode;
}

export interface NotificationAlerts {
  debt: boolean;
  stock: boolean;
  goals: boolean;
  payments: boolean;
}
export interface NotificationChannels {
  inapp: boolean;
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
}
export interface QuietHours {
  enabled: boolean;
  from: string;
  to: string;
  weekdays_only: boolean;
}
export interface NotificationSettings {
  alerts: NotificationAlerts;
  channels: NotificationChannels;
  quiet_hours: QuietHours;
}

export interface Session {
  id: string;
  device: string;
  location: string;
  last_active: string;
  current: boolean;
}
export type TwoFaMethod = "sms" | "email" | "app" | null;
export interface SecuritySettings {
  password_last_changed: string;
  two_fa_enabled: boolean;
  two_fa_method: TwoFaMethod;
  sessions: Session[];
}

export interface UserProfile {
  full_name: string;
  email: string;
  phone: string;
  avatar_url: string | null;
  role: "owner" | "staff";
}

export interface StoreState {
  customers: Customer[];
  suppliers: Supplier[];
  products: Product[];
  invoices: Invoice[];
  expenses: Expense[];
  checks: Check[];
  debts: Debt[];
  recurringExpenses: RecurringExpense[];
  goals: Goal[];
  appNotifications: AppNotification[];
  stats: Stats;
  draft: DraftInvoice | null;
  storeSettings: StoreSettings;
  notificationSettings: NotificationSettings;
  securitySettings: SecuritySettings;
  userProfile: UserProfile;
  customFields: CustomFieldDefinition[];
  nextInvoiceNo: number;
  nextExpenseId: number;
  nextProductId: number;
  nextCustomerId: number;
  nextSupplierId: number;
  nextCheckId: number;
  nextDebtId: number;
  nextRecurringId: number;
  nextGoalId: number;
  nextCustomFieldId: number;
}

// ─── Goals (الأهداف الشهرية) ───────────────────────────────────────────────
export type GoalType = "revenue" | "net_profit" | "expense_reduction" | "product_sales";
export type GoalStatus = "active" | "achieved" | "failed" | "cancelled";

export interface Goal {
  id: string;
  type: GoalType;
  title: string;                 // "دخل 80,000 شيقل"
  target_amount: number;
  period_start: string;          // ISO YYYY-MM-01
  period_end: string;            // ISO YYYY-MM-end
  target_category?: ExpenseCategory;
  target_product_id?: string;
  auto_repeat: boolean;
  status: GoalStatus;
  created_at: string;
}

// ─── App Notifications (inside the app's notification center) ──────────────
export type NotificationType =
  | "daily_reminder"
  | "weekly_summary"
  | "unusual_spending"
  | "debt_due"
  | "goal_progress"
  | "recurring_expense"
  | "check_due"
  | "system";

export type NotificationPriority = "low" | "normal" | "high" | "urgent";

export interface AppNotification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  body: string;
  link?: string;                 // deep link to a page
  is_read: boolean;
  created_at: string;
  expires_at?: string;
}

// ─── Custom Field Definition (الحقول الديناميكية — feature 3.15) ──────────
export type CustomFieldEntityType =
  | "product" | "customer" | "supplier" | "expense" | "invoice" | "debt";

export type CustomFieldType =
  | "text" | "number" | "date" | "select" | "multi_select"
  | "boolean" | "url" | "list";

export interface CustomFieldDefinition {
  id: string;
  entity_type: CustomFieldEntityType;
  field_key: string;             // unique within entity_type (e.g. "color")
  field_name: string;            // display name (e.g. "اللون")
  field_type: CustomFieldType;
  is_required: boolean;
  default_value?: unknown;
  options?: string[];            // for select/multi_select
  help_text?: string;
  sort_order: number;
  show_in_list: boolean;
  show_in_search: boolean;
  is_active: boolean;
  created_at: string;
}

// ─── Recurring monthly/weekly expenses (مصاريف ثابتة) ──────────────────────
export type RecurringFrequency = "monthly" | "weekly";

export interface RecurringExpense {
  id: string;
  name: string;                   // "إيجار المحل"
  amount: number;
  category: ExpenseCategory;
  frequency: RecurringFrequency;
  /** For monthly: day of month (1–31). 31 clamps to last day of short months. */
  day_of_month?: number;
  /** For weekly: 0=Sun … 6=Sat (like JS Date.getDay()). */
  day_of_week?: number;
  start_date: string;             // ISO YYYY-MM-DD — earliest occurrence
  end_date?: string | null;       // ISO, optional — stops after this date
  is_active: boolean;
  notes?: string;
  created_at: string;
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "إيجار",
  "كهرباء",
  "اتصالات",
  "وقود",
  "مواصلات",
  "صيانة",
  "رواتب",
  "طعام ومطاعم",
  "بضاعة ومشتريات",
  "تسويق وإعلان",
  "خدمات مكتبية",
  "بنوك ومدفوعات",
  "ضرائب ورسوم",
  "قروض وتقسيط",
  "أخرى",
];

export const PRODUCT_CATEGORIES: string[] = [
  "فساتين",
  "بلوزات",
  "عبايات",
  "اكسسوارات",
  "بناطيل",
  "أحذية",
  "حقائب",
  "عطور",
  "حجابات",
  "جاكيتات",
  "أخرى",
];
