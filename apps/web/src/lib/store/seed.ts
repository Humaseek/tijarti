import type {
  Customer,
  Supplier,
  Product,
  Invoice,
  Expense,
  Check,
  Debt,
  RecurringExpense,
  Goal,
  AppNotification,
  CustomFieldDefinition,
  StoreState,
  StoreSettings,
  NotificationSettings,
  SecuritySettings,
  UserProfile,
} from "./types";

/**
 * Mock data — ported from the HTML prototype's store.js.
 * Shop: بوتيك ليلى — الناصرة.
 */

export const seedCustomers: Customer[] = [
  { id: "c1", name: "أم خالد",       initial: "خ", tag: "VIP",    debt: 1270, invoices: 14, totalSpent: 18400, phone: "054-111-2233", lastVisit: "قبل 3 أيام" },
  { id: "c2", name: "ميسون أبو أحمد", initial: "م", tag: "VIP",    debt: 0,    invoices: 18, totalSpent: 24800, phone: "052-445-6781", lastVisit: "أمس" },
  { id: "c3", name: "رنا عبد الله",  initial: "ر", tag: "VIP",    debt: 450,  invoices: 11, totalSpent: 12200, phone: "053-220-8844", lastVisit: "قبل أسبوع" },
  { id: "c4", name: "غادة سليمان",   initial: "غ", tag: "عادية",  debt: 0,    invoices: 9,  totalSpent: 8600,  phone: "054-778-3311", lastVisit: "قبل أسبوعين" },
  { id: "c5", name: "سناء خلف",      initial: "س", tag: "عادية",  debt: 320,  invoices: 7,  totalSpent: 6200,  phone: "052-117-9023", lastVisit: "قبل 5 أيام" },
  { id: "c6", name: "ليلى قاسم",     initial: "ل", tag: "عادية",  debt: 0,    invoices: 6,  totalSpent: 5100,  phone: "054-230-1144", lastVisit: "قبل 3 أيام" },
  { id: "c7", name: "نورا القاسم",   initial: "ن", tag: "جديدة",  debt: 0,    invoices: 2,  totalSpent: 890,   phone: "053-992-4456", lastVisit: "قبل شهر" },
  { id: "c8", name: "فاطمة حسن",     initial: "ف", tag: "جديدة",  debt: 0,    invoices: 3,  totalSpent: 1340,  phone: "052-334-8821", lastVisit: "قبل 45 يوم" },
];

export const seedProducts: Product[] = [
  { id: "p1", name: "عباءة مطرزة",       sku: "00412", price: 780, cost: 420, stock: 4,  category: "عبايات",    is_active: true, low_stock_threshold: 5 },
  { id: "p2", name: "حجاب حرير",         sku: "00287", price: 180, cost: 85,  stock: 12, category: "حجابات",    is_active: true, low_stock_threshold: 5 },
  { id: "p3", name: "فستان سهرة",        sku: "00501", price: 950, cost: 510, stock: 2,  category: "فساتين",    is_active: true, low_stock_threshold: 5 },
  { id: "p4", name: "بلوزة صيفية",       sku: "00329", price: 220, cost: 95,  stock: 18, category: "بلوزات",    is_active: true, low_stock_threshold: 5 },
  { id: "p5", name: "عطر عود",           sku: "00612", price: 340, cost: 180, stock: 7,  category: "عطور",      is_active: true, low_stock_threshold: 5 },
  { id: "p6", name: "جاكيت شتوي أزرق",   sku: "00098", price: 690, cost: 310, stock: 3,  category: "جاكيتات",   is_active: true, low_stock_threshold: 5 },
  { id: "p7", name: "حذاء جلد كلاسيك",   sku: "00455", price: 520, cost: 260, stock: 5,  category: "أحذية",     is_active: true, low_stock_threshold: 5 },
  { id: "p8", name: "حقيبة يد مصغرة",    sku: "00377", price: 380, cost: 170, stock: 9,  category: "حقائب",     is_active: true, low_stock_threshold: 5 },
];

export const seedInvoices: Invoice[] = [
  { id: "i4123", no: "4123", customerId: "c1", date: "28 أكتوبر 2026", time: "15:42", total: 1270, paid: 0,   method: "تقسيط", items: [{ pid: "p1", qty: 1, price: 780 }, { pid: "p2", qty: 1, price: 180 }, { pid: "p5", qty: 1, price: 310 }], installment: { total: 1270, plan: 3, paid: 0 } },
  { id: "i4122", no: "4122", customerId: "c2", date: "28 أكتوبر 2026", time: "11:15", total: 950,  paid: 950, method: "نقدي", items: [{ pid: "p3", qty: 1, price: 950 }] },
  { id: "i4121", no: "4121", customerId: "c3", date: "27 أكتوبر 2026", time: "17:20", total: 450,  paid: 0,   method: "آجل",   items: [{ pid: "p2", qty: 1, price: 180 }, { pid: "p8", qty: 1, price: 270 }] },
  { id: "i4120", no: "4120", customerId: "c4", date: "27 أكتوبر 2026", time: "14:05", total: 340,  paid: 340, method: "بطاقة", items: [{ pid: "p5", qty: 1, price: 340 }] },
  { id: "i4119", no: "4119", customerId: "c5", date: "26 أكتوبر 2026", time: "19:30", total: 620,  paid: 300, method: "آجل",   items: [{ pid: "p4", qty: 1, price: 220 }, { pid: "p8", qty: 1, price: 380 }, { pid: "p2", qty: 1, price: 20 }] },
  { id: "i4118", no: "4118", customerId: "c6", date: "26 أكتوبر 2026", time: "12:10", total: 180,  paid: 180, method: "نقدي", items: [{ pid: "p2", qty: 1, price: 180 }] },
];

export const seedExpenses: Expense[] = [
  { id: "e1", amount: 3500, category: "إيجار",       description: "إيجار المحل · أبريل",         payment_method: "تحويل", expense_date: "21 أبريل 2026", receipt_url: null, created_at: "21 أبريل 2026" },
  { id: "e2", amount: 4500, category: "رواتب",       description: "راتب سناء — دوام جزئي",       payment_method: "تحويل", expense_date: "15 أبريل 2026", receipt_url: null, created_at: "15 أبريل 2026" },
  { id: "e3", amount: 420,  category: "كهرباء",      description: "فاتورة كهرباء — مارس",        payment_method: "بطاقة", expense_date: "18 أبريل 2026", receipt_url: null, created_at: "18 أبريل 2026" },
  { id: "e4", amount: 180,  category: "مواصلات",     description: "تكسي لجلب بضاعة من تل أبيب",  payment_method: "نقدي",  expense_date: "12 أبريل 2026", receipt_url: null, created_at: "12 أبريل 2026" },
  { id: "e5", amount: 150,  category: "اتصالات",     description: "انترنت + خط هاتف المحل",      payment_method: "بطاقة", expense_date: "10 أبريل 2026", receipt_url: null, created_at: "10 أبريل 2026" },
  { id: "e6", amount: 320,  category: "صيانة",       description: "تصليح مكيّف",                 payment_method: "نقدي",  expense_date: "07 أبريل 2026", receipt_url: null, created_at: "07 أبريل 2026" },
  { id: "e7", amount: 280,  category: "أخرى",        description: "مواد تنظيف وأكياس",           payment_method: "نقدي",  expense_date: "05 أبريل 2026", receipt_url: null, created_at: "05 أبريل 2026" },
  { id: "e8", amount: 1200, category: "ضرائب ورسوم", description: "ضريبة الربع الأول",           payment_method: "تحويل", expense_date: "03 أبريل 2026", receipt_url: null, created_at: "03 أبريل 2026" },
  { id: "e9", amount: 1400, category: "قروض وتقسيط", description: "دفعة قرض البنك — أبريل",      payment_method: "تحويل", expense_date: "01 أبريل 2026", receipt_url: null, created_at: "01 أبريل 2026" },
];

export const seedStoreSettings: StoreSettings = {
  store_name: "بوتيك ليلى",
  store_address: "الناصرة، شارع بولس السادس",
  store_phone: "+972 4 612 8844",
  store_email: "layla@tijarti.app",
  business_type: "ملابس نسائية",
  logo_url: null,
  currency: "ILS",
  currency_symbol: "₪",
  vip_discount_rate: 8.0,
  low_stock_default: 5,
  working_hours: {
    from: "09:00",
    to: "21:00",
    days: ["sun", "mon", "tue", "wed", "thu"],
  },
  timezone: "Asia/Jerusalem",
  language: "ar",
  entry_mode: "per_product",
};

export const seedNotificationSettings: NotificationSettings = {
  alerts: { debt: true, stock: true, goals: true, payments: true },
  channels: { inapp: true, email: true, sms: false, whatsapp: true },
  quiet_hours: { enabled: true, from: "22:00", to: "07:00", weekdays_only: false },
};

export const seedSecuritySettings: SecuritySettings = {
  password_last_changed: "قبل 3 أشهر",
  two_fa_enabled: false,
  two_fa_method: null,
  sessions: [
    { id: "s1", device: "iPhone — ليلى", location: "الناصرة", last_active: "الآن",       current: true  },
    { id: "s2", device: "iPad",           location: "الناصرة", last_active: "قبل يومين",  current: false },
    { id: "s3", device: "MacBook Pro",    location: "الناصرة", last_active: "قبل ساعتين", current: false },
  ],
};

// ─── Checks — mixed timeline around MOCK_TODAY = 2026-04-23 ─────────────────
// Deliberately crafted to exercise: overdue, today, upcoming, bounced, cashed.
export const seedChecks: Check[] = [
  // Incoming — من زبائن
  { id: "ch1",  direction: "incoming", number: "125443", amount: 2800, party_name: "ميسون أبو أحمد", party_id: "c2", due_date: "2026-04-20", issued_date: "2026-02-20", bank: "لئومي",  status: "pending", notes: "قسط #2 من 4", created_at: "2026-02-20" },
  { id: "ch2",  direction: "incoming", number: "125444", amount: 2800, party_name: "ميسون أبو أحمد", party_id: "c2", due_date: "2026-05-20", issued_date: "2026-02-20", bank: "لئومي",  status: "pending", notes: "قسط #3 من 4", created_at: "2026-02-20" },
  { id: "ch3",  direction: "incoming", number: "77891",  amount: 1270, party_name: "أم خالد",        party_id: "c1", due_date: "2026-04-25", issued_date: "2026-03-25", bank: "ديسكونت", status: "pending", notes: "",             created_at: "2026-03-25" },
  { id: "ch4",  direction: "incoming", number: "77892",  amount: 1270, party_name: "أم خالد",        party_id: "c1", due_date: "2026-05-25", issued_date: "2026-03-25", bank: "ديسكونت", status: "pending", notes: "",             created_at: "2026-03-25" },
  { id: "ch5",  direction: "incoming", number: "55201",  amount: 450,  party_name: "رنا عبد الله",   party_id: "c3", due_date: "2026-04-15", issued_date: "2026-03-15", bank: "هبوعليم", status: "bounced", notes: "ارتد — لا رصيد", created_at: "2026-03-15" },
  { id: "ch6",  direction: "incoming", number: "88100",  amount: 3200, party_name: "محل الهدايا",     party_id: null, due_date: "2026-04-10", issued_date: "2026-03-10", bank: "لئومي",  status: "cashed",  notes: "",             cashed_date: "2026-04-10", created_at: "2026-03-10" },

  // Outgoing — لمورّدين
  { id: "ch7",  direction: "outgoing", number: "9104",   amount: 5200, party_name: "مورد تركيا أحمد", due_date: "2026-04-28", issued_date: "2026-03-01", bank: "لئومي",  status: "pending", notes: "شحنة فساتين", created_at: "2026-03-01" },
  { id: "ch8",  direction: "outgoing", number: "9105",   amount: 5200, party_name: "مورد تركيا أحمد", due_date: "2026-05-28", issued_date: "2026-03-01", bank: "لئومي",  status: "pending", notes: "شحنة فساتين", created_at: "2026-03-01" },
  { id: "ch9",  direction: "outgoing", number: "9106",   amount: 3400, party_name: "جملة الشام",     due_date: "2026-04-30", issued_date: "2026-03-30", bank: "لئومي",  status: "pending", notes: "بلوزات",       created_at: "2026-03-30" },
  { id: "ch10", direction: "outgoing", number: "9107",   amount: 1800, party_name: "مصنع يافا",      due_date: "2026-05-05", issued_date: "2026-04-05", bank: "لئومي",  status: "pending", notes: "اكسسوارات",   created_at: "2026-04-05" },
  { id: "ch11", direction: "outgoing", number: "9108",   amount: 2100, party_name: "بيت الأقمشة",    due_date: "2026-04-18", issued_date: "2026-03-18", bank: "لئومي",  status: "cashed",  notes: "",             cashed_date: "2026-04-18", created_at: "2026-03-18" },
];

// ─── Informal debts (على الحساب) — no checks involved ───────────────────────
export const seedDebts: Debt[] = [
  // Outgoing (عليّ لحدا)
  { id: "d1", direction: "outgoing", amount: 350, party_name: "أحمد الكهربائي",    description: "تصليح كهرباء المحل",  due_date: "2026-04-30", issued_date: "2026-04-15", status: "pending", notes: "قال: ادفعي لما تقدري", created_at: "2026-04-15" },
  { id: "d2", direction: "outgoing", amount: 180, party_name: "مغسلة الحي",         description: "غسيل الستائر",         due_date: null,           issued_date: "2026-04-10", status: "pending", notes: "",                        created_at: "2026-04-10" },
  // Incoming (عليه لي)
  { id: "d3", direction: "incoming", amount: 420, party_name: "هيا منصور",          party_id: null, description: "فستان بدون فاتورة",    due_date: "2026-05-05", issued_date: "2026-04-18", status: "pending", notes: "صديقة — وثّقت بالكلمة", created_at: "2026-04-18" },
  { id: "d4", direction: "incoming", amount: 890, party_name: "نورا القاسم",        party_id: "c7", description: "3 قطع على الحساب",    due_date: "2026-04-28", issued_date: "2026-03-28", status: "pending", notes: "",                        created_at: "2026-03-28" },
  { id: "d5", direction: "outgoing", amount: 220, party_name: "محل التغليف",        description: "أكياس + ورق",          due_date: "2026-04-20", issued_date: "2026-04-02", status: "settled", settled_date: "2026-04-20", notes: "", created_at: "2026-04-02" },
];

// ─── Recurring monthly expenses — typical for a small boutique ──────────────
export const seedRecurringExpenses: RecurringExpense[] = [
  { id: "r1", name: "إيجار المحل",       amount: 3500, category: "إيجار",   frequency: "monthly", day_of_month: 1,  start_date: "2026-01-01", end_date: null, is_active: true, notes: "مالك المحل",               created_at: "2026-01-01" },
  { id: "r2", name: "راتب سناء",          amount: 4500, category: "رواتب",  frequency: "monthly", day_of_month: 28, start_date: "2026-01-28", end_date: null, is_active: true, notes: "آخر كل شهر",                created_at: "2026-01-28" },
  { id: "r3", name: "إنترنت + هاتف",      amount: 150,  category: "اتصالات", frequency: "monthly", day_of_month: 25, start_date: "2026-01-25", end_date: null, is_active: true, notes: "باقة بيزك",                 created_at: "2026-01-25" },
  { id: "r4", name: "دفعة قرض البنك",     amount: 1400, category: "قروض وتقسيط", frequency: "monthly", day_of_month: 1, start_date: "2025-06-01", end_date: "2027-06-01", is_active: true, notes: "24 قسط متبقّي", created_at: "2025-06-01" },
  { id: "r5", name: "تأمين المحل",        amount: 220,  category: "أخرى",    frequency: "monthly", day_of_month: 5,  start_date: "2026-01-05", end_date: null, is_active: true, notes: "مجموعة مجدال",              created_at: "2026-01-05" },
];

// ─── Suppliers — typical for a small boutique ───────────────────────────────
export const seedSuppliers: Supplier[] = [
  { id: "sup1", name: "مورد تركيا أحمد",  initial: "م", phone: "+90 531 445 2312",  email: "ahmad@turksuppliers.com", business_number: "",          default_category: "أخرى",         payment_terms: "شيكات مؤجلة 30 يوم", notes: "فساتين وأقمشة — شريك أساسي منذ 3 سنوات",       is_active: true,  avatar_color: "#2563A6", created_at: "2024-06-12" },
  { id: "sup2", name: "جملة الشام",       initial: "ج", phone: "04-612-9911",        email: "sham.wholesale@example.il", business_number: "514823771", default_category: "أخرى",         payment_terms: "شيك 60 يوم",         notes: "بلوزات وصيفيات",                               is_active: true,  avatar_color: "#BA7517", created_at: "2024-08-20" },
  { id: "sup3", name: "مصنع يافا",        initial: "م", phone: "03-622-1184",        email: "",                          business_number: "512990011", default_category: "أخرى",         payment_terms: "نقدي / شيك شهر",     notes: "اكسسوارات وحقائب",                             is_active: true,  avatar_color: "#0F6E56", created_at: "2025-01-10" },
  { id: "sup4", name: "بيت الأقمشة",      initial: "ب", phone: "04-998-2241",        email: "",                          business_number: "",          default_category: "أخرى",         payment_terms: "شيك 45 يوم",         notes: "",                                              is_active: true,  avatar_color: "#6B4B8F", created_at: "2025-03-18" },
  { id: "sup5", name: "مالك المحل",       initial: "م", phone: "054-661-2200",       email: "",                          business_number: "",          default_category: "إيجار",       payment_terms: "أول كل شهر",         notes: "إيجار المحل — دفع شهري ثابت",                  is_active: true,  avatar_color: "#C2185B", created_at: "2023-12-01" },
];

// ─── Goals — mix of active + one achieved ──────────────────────────────────
export const seedGoals: Goal[] = [
  { id: "g1", type: "revenue",           title: "دخل 75,000 ₪ في أبريل",     target_amount: 75000, period_start: "2026-04-01", period_end: "2026-04-30", auto_repeat: true,  status: "active",   created_at: "2026-04-01" },
  { id: "g2", type: "net_profit",        title: "ربح صافي 25,000 ₪ في أبريل",target_amount: 25000, period_start: "2026-04-01", period_end: "2026-04-30", auto_repeat: true,  status: "active",   created_at: "2026-04-01" },
  { id: "g3", type: "expense_reduction", title: "تخفيض مصاريف الصيانة",       target_amount: 400,   period_start: "2026-04-01", period_end: "2026-04-30", target_category: "صيانة", auto_repeat: false, status: "active",   created_at: "2026-04-01" },
  { id: "g4", type: "revenue",           title: "دخل 70,000 ₪ في مارس",      target_amount: 70000, period_start: "2026-03-01", period_end: "2026-03-31", auto_repeat: false, status: "achieved", created_at: "2026-03-01" },
];

// ─── App notifications — realistic mix ─────────────────────────────────────
export const seedNotifications: AppNotification[] = [
  { id: "n1", type: "debt_due",         priority: "high",   title: "شيك من ميسون أبو أحمد",       body: "مستحق تحصيل قبل 3 أيام — 2,800 ₪", link: "/app/checks/ch1", is_read: false, created_at: "2026-04-23T09:15:00Z" },
  { id: "n2", type: "unusual_spending", priority: "normal", title: "صرف أعلى من المعتاد",         body: "مصاريف الصيانة هذا الشهر ضعف متوسط آخر 3 شهور",    link: "/app/expenses", is_read: false, created_at: "2026-04-22T14:20:00Z" },
  { id: "n3", type: "goal_progress",    priority: "normal", title: "هدف أبريل — 64%",             body: "عندك أسبوع لتصلي لـ 75,000 ₪",                      link: "/app",                    is_read: true,  created_at: "2026-04-22T08:00:00Z" },
  { id: "n4", type: "recurring_expense",priority: "low",    title: "إيجار المحل — مايو",          body: "رح يُسجَّل تلقائياً أول مايو (3,500 ₪)",            link: "/app/expenses/recurring", is_read: true,  created_at: "2026-04-21T08:00:00Z" },
  { id: "n5", type: "weekly_summary",   priority: "low",    title: "ملخص الأسبوع الماضي",         body: "ربحت 12,300 ₪ — زيادة 8% عن الأسبوع السابق",       link: "/app",                    is_read: true,  created_at: "2026-04-20T08:00:00Z" },
];

// ─── Custom field definitions — example for a boutique ─────────────────────
export const seedCustomFields: CustomFieldDefinition[] = [
  { id: "cf1", entity_type: "product",  field_key: "color",   field_name: "اللون",    field_type: "select",       is_required: false, options: ["أحمر","أسود","أبيض","أزرق","بيج","وردي","ذهبي"], help_text: "لون القطعة",         sort_order: 1, show_in_list: true,  show_in_search: true,  is_active: true, created_at: "2026-01-01" },
  { id: "cf2", entity_type: "product",  field_key: "size",    field_name: "المقاس",   field_type: "multi_select", is_required: false, options: ["XS","S","M","L","XL","XXL"],                      help_text: "المقاسات المتوفرة",   sort_order: 2, show_in_list: true,  show_in_search: true,  is_active: true, created_at: "2026-01-01" },
  { id: "cf3", entity_type: "customer", field_key: "birthday_month", field_name: "شهر الميلاد", field_type: "select", is_required: false, options: ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"], help_text: "لإرسال تهنئة", sort_order: 1, show_in_list: false, show_in_search: false, is_active: true, created_at: "2026-01-01" },
];

export const seedUserProfile: UserProfile = {
  full_name: "ليلى حسن",
  email: "layla@tijarti.app",
  phone: "+972 50 234 1180",
  avatar_url: null,
  role: "owner",
};

/**
 * Demo seed state — pre-populated boutique for exploring the app.
 */
export function createDemoState(): StoreState {
  return {
    customers: seedCustomers,
    suppliers: seedSuppliers,
    products: seedProducts,
    invoices: seedInvoices,
    expenses: seedExpenses,
    checks: seedChecks,
    debts: seedDebts,
    recurringExpenses: seedRecurringExpenses,
    goals: seedGoals,
    appNotifications: seedNotifications,
    customFields: seedCustomFields,
    stats: {
      todayRevenue: 2630,
      monthRevenue: 68500,
      totalDebts: 14300,
      debtCount: 4,
    },
    draft: null,
    storeSettings: seedStoreSettings,
    notificationSettings: seedNotificationSettings,
    securitySettings: seedSecuritySettings,
    userProfile: seedUserProfile,
    nextInvoiceNo: 4124,
    nextExpenseId: 10,
    nextProductId: 9,
    nextCustomerId: 9,
    nextSupplierId: 6,
    nextCheckId: 12,
    nextDebtId: 6,
    nextRecurringId: 6,
    nextGoalId: 5,
    nextCustomFieldId: 4,
  };
}

/**
 * Empty state — brand-new install with no data. Settings still have sane defaults
 * (store name/phone are placeholders the user will fill during onboarding).
 */
export function createEmptyState(): StoreState {
  return {
    customers: [],
    suppliers: [],
    products: [],
    invoices: [],
    expenses: [],
    checks: [],
    debts: [],
    recurringExpenses: [],
    goals: [],
    appNotifications: [],
    customFields: [],
    stats: {
      todayRevenue: 0,
      monthRevenue: 0,
      totalDebts: 0,
      debtCount: 0,
    },
    draft: null,
    storeSettings: {
      ...seedStoreSettings,
      store_name: "متجري",
      store_address: "",
      store_phone: "",
      store_email: "",
    },
    notificationSettings: seedNotificationSettings,
    securitySettings: {
      ...seedSecuritySettings,
      sessions: [
        { id: "s1", device: "هذا الجهاز", location: "—", last_active: "الآن", current: true },
      ],
    },
    userProfile: {
      ...seedUserProfile,
      full_name: "",
      email: "",
      phone: "",
    },
    nextInvoiceNo: 1001,
    nextExpenseId: 1,
    nextProductId: 1,
    nextCustomerId: 1,
    nextSupplierId: 1,
    nextCheckId: 1,
    nextDebtId: 1,
    nextRecurringId: 1,
    nextGoalId: 1,
    nextCustomFieldId: 1,
  };
}

/**
 * Default initial state. Reads `NEXT_PUBLIC_TJ_SEED` env var:
 *  - "empty" → fresh install (no data)
 *  - anything else (default) → demo boutique
 */
export function createInitialState(): StoreState {
  const mode = process.env.NEXT_PUBLIC_TJ_SEED;
  if (mode === "empty") return createEmptyState();
  return createDemoState();
}
