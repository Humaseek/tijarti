/**
 * Comprehensive seed data for ALL localStorage-backed feature stores.
 *
 * The main store-context.tsx seeds the core entities (customers, products,
 * invoices, expenses, suppliers, etc.) but the new feature pages (quotes,
 * gift-cards, tasks, contracts, reviews, ...) all live in their own
 * localStorage keys and start EMPTY.
 *
 * This module fills them with rich Arabic seed data that:
 *   1. Uses references to the existing customers / products / suppliers / invoices
 *   2. Looks realistic (varied dates, statuses, amounts)
 *   3. Demonstrates EVERY page's full UI
 *
 * Auto-runs once via `tj_seed_extensions_done_v1` flag. Manual reseed
 * available via `seedAllExtensions(force=true)`.
 */

import type { StoreState } from "@/lib/store/types";

const SEED_FLAG_KEY = "tj_seed_extensions_done_v1";
const SEED_VERSION = 4;

const todayIso = () => new Date().toISOString().slice(0, 10);
const today = () => new Date();
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};
const daysFromNow = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};
const isoNow = (offsetMin = 0) => {
  const d = new Date();
  d.setMinutes(d.getMinutes() + offsetMin);
  return d.toISOString();
};

function lsSet(key: string, value: unknown) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* ignore */ }
}

function lsGet<T>(key: string, fallback: T): T {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    if (v == null) return fallback;
    return JSON.parse(v) as T;
  } catch {
    return fallback;
  }
}

/**
 * Pick the first N items from a list, falling back to []
 * if list is empty/undefined.
 */
function pick<T>(list: T[] | undefined, n: number): T[] {
  if (!list) return [];
  return list.slice(0, n);
}

/** Round to 2 decimals. */
const r = (n: number) => Math.round(n * 100) / 100;

// ─── Main seed function ───────────────────────────────────────────────────

export function seedAllExtensions(state: StoreState, force = false): {
  seeded: boolean;
  counts: Record<string, number>;
} {
  if (typeof localStorage === "undefined") return { seeded: false, counts: {} };

  const existing = lsGet<{ version: number } | null>(SEED_FLAG_KEY, null);
  if (!force && existing && existing.version === SEED_VERSION) {
    return { seeded: false, counts: {} };
  }

  const counts: Record<string, number> = {};

  const customers = state.customers || [];
  const suppliers = state.suppliers || [];
  const products = state.products || [];
  const invoices = state.invoices || [];

  // ─── 1. Quotes (different statuses showing the funnel) ──────────────────
  if (customers.length > 0 && products.length > 0) {
    const quoteStatuses: Array<"draft" | "sent" | "accepted" | "rejected" | "converted"> =
      ["accepted", "sent", "draft", "converted", "rejected", "sent", "accepted", "draft"];
    const quotes = quoteStatuses.map((status, i) => {
      const cust = customers[i % customers.length];
      const items = pick(products, 2 + (i % 3)).map((p) => ({
        pid: p.id,
        qty: 1 + (i % 3),
        price: p.price,
      }));
      const total = items.reduce((s, it) => s + it.qty * it.price, 0);
      return {
        id: `seed_q_${i}`,
        no: `Q-${(i + 1).toString().padStart(4, "0")}`,
        customerId: cust.id,
        date: daysAgo(20 - i * 2),
        items,
        total,
        notes: i % 2 === 0 ? "نُرجى الردّ خلال 7 أيام" : undefined,
        status,
        valid_until: daysFromNow(14 - i),
        created_at: new Date(Date.now() - (20 - i * 2) * 86400000).toISOString(),
      };
    });
    lsSet("tj_quotes_v1", quotes);
    counts.quotes = quotes.length;
  }

  // ─── 2. Gift Cards ──────────────────────────────────────────────────────
  if (customers.length > 0) {
    const gcAmounts = [200, 500, 100, 300, 1000, 250];
    const giftCards = gcAmounts.map((amount, i) => {
      const used = i < 2 ? amount * (0.3 + i * 0.2) : i === 2 ? amount : 0;
      const balance = amount - used;
      return {
        id: `seed_gc_${i}`,
        code: `GC-${(["7H4N", "9KM2", "P3RQ", "5XZK", "Y8VW", "B2NT"][i] || "AAAA")}`,
        amount,
        balance,
        buyer_customer_id: customers[i % customers.length].id,
        recipient_name: ["فاطمة الخالد", "أم محمد", "هدى نصار", "نور أيوب", "سارة حداد", "ليلى بدر"][i],
        issued_at: daysAgo(60 - i * 8),
        expires_at: daysFromNow(305 - i * 5),
        status: balance <= 0 ? "redeemed" as const : "active" as const,
        used_history: used > 0 ? [{ amount: used, at: daysAgo(30 - i * 5) }] : [],
      };
    });
    lsSet("tj_giftcards_v1", giftCards);
    counts.giftCards = giftCards.length;
  }

  // ─── 3. Loyalty Points (auto-earned from invoices) ──────────────────────
  if (customers.length > 0 && invoices.length > 0) {
    const loyaltyTxns: Array<{
      id: string; customerId: string; delta: number; reason: string; balance_after: number; at: string;
    }> = [];
    customers.slice(0, 8).forEach((c, ci) => {
      let balance = 0;
      const earnCount = 1 + (ci % 4);
      for (let i = 0; i < earnCount; i++) {
        const points = 50 + Math.floor(Math.random() * 200);
        balance += points;
        loyaltyTxns.push({
          id: `seed_l_${ci}_${i}`,
          customerId: c.id,
          delta: points,
          reason: `فاتورة #${invoices[(ci + i) % invoices.length]?.no || "—"}`,
          balance_after: balance,
          at: daysAgo(60 - ci * 5 - i * 3),
        });
      }
      // Some redemptions
      if (ci % 3 === 0 && balance > 100) {
        balance -= 100;
        loyaltyTxns.push({
          id: `seed_l_${ci}_r`,
          customerId: c.id,
          delta: -100,
          reason: "استبدال نقاط — خصم 10 ₪",
          balance_after: balance,
          at: daysAgo(7),
        });
      }
    });
    lsSet("tj_loyalty_v1", loyaltyTxns);
    counts.loyalty = loyaltyTxns.length;
  }

  // Loyalty tiers config
  lsSet("tj_loyalty_tiers_v1", {
    bronze: { min: 0, label: "برونزي", benefit: "خصم 5% على الفواتير" },
    silver: { min: 501, label: "فضّي", benefit: "خصم 8% + شحن مجاني" },
    gold: { min: 2001, label: "ذهبي", benefit: "خصم 12% + هدية شهرية" },
    diamond: { min: 5001, label: "ماسي", benefit: "خصم 18% + معاملة VIP" },
  });

  // ─── 4. Purchase Orders ─────────────────────────────────────────────────
  if (suppliers.length > 0 && products.length > 0) {
    const poStatuses: Array<"draft" | "sent" | "received" | "cancelled"> =
      ["received", "received", "sent", "sent", "draft", "received"];
    const purchaseOrders = poStatuses.map((status, i) => {
      const sup = suppliers[i % suppliers.length];
      const items = pick(products, 2 + (i % 3)).map((p) => ({
        pid: p.id,
        qty: 5 + (i % 5) * 2,
        price: r(p.cost * 0.95), // wholesale price
      }));
      const total = items.reduce((s, it) => s + it.qty * it.price, 0);
      const orderDate = daysAgo(45 - i * 7);
      return {
        id: `seed_po_${i}`,
        no: `PO-${(i + 1).toString().padStart(4, "0")}`,
        supplierId: sup.id,
        supplierName: sup.name,
        items,
        total,
        status,
        order_date: orderDate,
        expected_date: daysAgo(45 - i * 7 - 5),
        received_date: status === "received" ? daysAgo(45 - i * 7 - 3) : undefined,
        notes: i % 2 === 0 ? "بضاعة موسمية — أولوية عالية" : undefined,
        created_at: new Date(Date.now() - (45 - i * 7) * 86400000).toISOString(),
      };
    });
    lsSet("tj_po_v1", purchaseOrders);
    counts.po = purchaseOrders.length;
  }

  // ─── 5. Product Bundles ─────────────────────────────────────────────────
  if (products.length >= 3) {
    const bundles = [
      {
        id: "seed_b_1",
        name: "باقة الإطلاق",
        description: "أفضل 3 منتجات بسعر مخفّض",
        items: products.slice(0, 3).map((p) => ({ pid: p.id, qty: 1 })),
        price: r(products.slice(0, 3).reduce((s, p) => s + p.price, 0) * 0.85),
        is_active: true,
        created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      },
      {
        id: "seed_b_2",
        name: "باقة العائلة",
        description: "5 منتجات للعائلة الكبيرة",
        items: products.slice(0, Math.min(5, products.length)).map((p) => ({ pid: p.id, qty: 2 })),
        price: r(products.slice(0, 5).reduce((s, p) => s + p.price * 2, 0) * 0.8),
        is_active: true,
        created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
      },
      {
        id: "seed_b_3",
        name: "باقة هدية",
        description: "هدية أنيقة بسعر ثابت",
        items: products.slice(1, 3).map((p) => ({ pid: p.id, qty: 1 })),
        price: 199,
        is_active: false,
        created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
      },
    ];
    lsSet("tj_bundles_v1", bundles);
    counts.bundles = bundles.length;
  }

  // ─── 6. Coupons ─────────────────────────────────────────────────────────
  const coupons = [
    {
      id: "seed_co_1", code: "EID15", discount_type: "percent" as const, discount_value: 15,
      max_uses: 100, current_uses: 23, valid_from: daysAgo(30), valid_until: daysFromNow(15),
      is_active: true, created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: "seed_co_2", code: "WELCOME10", discount_type: "percent" as const, discount_value: 10,
      max_uses: 500, current_uses: 187, is_active: true,
      created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
    },
    {
      id: "seed_co_3", code: "VIP20", discount_type: "percent" as const, discount_value: 20,
      max_uses: 50, current_uses: 8, valid_until: daysFromNow(60),
      is_active: true, created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    },
    {
      id: "seed_co_4", code: "SUMMER50", discount_type: "fixed" as const, discount_value: 50,
      max_uses: 200, current_uses: 45, valid_from: daysAgo(60), valid_until: daysAgo(5),
      is_active: false, created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    },
    {
      id: "seed_co_5", code: "BLACKFRI", discount_type: "percent" as const, discount_value: 30,
      max_uses: 1000, current_uses: 0, valid_from: daysFromNow(20), valid_until: daysFromNow(25),
      is_active: true, created_at: new Date().toISOString(),
    },
  ];
  lsSet("tj_coupons_v1", coupons);
  counts.coupons = coupons.length;

  // ─── 7. Returns ─────────────────────────────────────────────────────────
  if (invoices.length > 0 && customers.length > 0) {
    const refundMethods: Array<"cash" | "credit" | "replacement"> = ["cash", "credit", "replacement", "cash"];
    const returns = invoices.slice(0, 4).map((inv, i) => {
      const cust = customers.find((c) => c.id === inv.customerId);
      const items = inv.items.slice(0, 1).map((it) => ({
        pid: it.pid,
        qty: 1,
        price: it.price,
        reason: ["لون مختلف عن المتوقّع", "مقاس غير مناسب", "بضاعة معطوبة", "غيّرت رأيي"][i],
      }));
      const total = items.reduce((s, it) => s + it.qty * it.price, 0);
      return {
        id: `seed_r_${i}`,
        invoiceId: inv.id,
        invoiceNo: inv.no,
        customerId: inv.customerId,
        customerName: cust?.name || "—",
        items,
        total,
        refund_method: refundMethods[i],
        note: i === 0 ? "زبونة كريمة — تم الإرجاع كاملاً" : undefined,
        created_at: new Date(Date.now() - (15 - i * 3) * 86400000).toISOString(),
      };
    });
    lsSet("tj_returns_v1", returns);
    counts.returns = returns.length;
  }

  // ─── 8. Tasks ───────────────────────────────────────────────────────────
  if (customers.length > 0) {
    const tasksData = [
      { title: "تابعي أبو علي حول دفع الـ 1500 ₪", due: 2, link: "customer", done: false },
      { title: "اطلبي بضاعة جديدة من المورّد الرئيسي", due: 5, link: "supplier", done: false },
      { title: "راجعي مخزون قميص الكتّان", due: -2, link: "product", done: false },
      { title: "أرسلي تذكيرات واتساب للديون المعلّقة", due: 1, link: null, done: false },
      { title: "حدّثي صور المنتجات على إنستقرام", due: 7, link: null, done: false },
      { title: "اتصلي بمحاسبة لتقرير الشهر", due: -1, link: null, done: false },
      { title: "نسخة احتياطية من البيانات", due: 14, link: null, done: false },
      { title: "راجعي عقد الإيجار قبل التجديد", due: 30, link: null, done: false },
      { title: "تواصلي مع زبائن خاملين", due: 0, link: null, done: false },
      { title: "أنشئي عرض سعر جديد لشركة X", due: -3, link: "customer", done: true },
      { title: "أرسلت فاتورة الكهرباء", due: -5, link: null, done: true },
      { title: "حدّثي قائمة الموردين", due: -10, link: null, done: true },
    ];
    const tasks = tasksData.map((t, i) => ({
      id: `seed_t_${i}`,
      title: t.title,
      due_date: daysFromNow(t.due),
      status: t.done ? "done" as const : "pending" as const,
      link: t.link === "customer" && customers[i % customers.length]
        ? { kind: "customer" as const, id: customers[i % customers.length].id, label: customers[i % customers.length].name }
        : t.link === "supplier" && suppliers[i % suppliers.length]
        ? { kind: "supplier" as const, id: suppliers[i % suppliers.length].id, label: suppliers[i % suppliers.length].name }
        : t.link === "product" && products[i % products.length]
        ? { kind: "product" as const, id: products[i % products.length].id, label: products[i % products.length].name }
        : undefined,
      created_at: new Date(Date.now() - (10 - i) * 86400000).toISOString(),
      completed_at: t.done ? new Date(Date.now() - 86400000).toISOString() : undefined,
    }));
    lsSet("tj_tasks_v1", tasks);
    counts.tasks = tasks.length;
  }

  // ─── 9. Rules ───────────────────────────────────────────────────────────
  const rules = [
    {
      id: "seed_rule_1", name: "زبون تأخّر عن الدفع 30 يوم", trigger: { type: "customer_overdue", value: 30 },
      action: { type: "create_task" }, is_active: true,
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: "seed_rule_2", name: "مخزون منتج نزل تحت 5 قطعة", trigger: { type: "low_stock", value: 5 },
      action: { type: "notify_app" }, is_active: true,
      created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    },
    {
      id: "seed_rule_3", name: "مصروف تجاوز 1500 ₪", trigger: { type: "expense_threshold", value: 1500 },
      action: { type: "notify_app" }, is_active: true,
      created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    },
    {
      id: "seed_rule_4", name: "منتج ما باع من 60 يوم", trigger: { type: "dead_stock", value: 60 },
      action: { type: "create_task" }, is_active: false,
      created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
    },
  ];
  lsSet("tj_rules_v1", rules);
  counts.rules = rules.length;

  // ─── 10. Notes (sticky) ─────────────────────────────────────────────────
  const notes = [
    { id: "seed_n_1", title: "أفكار للعرض القادم", body: "خصم 20% على المجموعة الصيفية، حملة سوشيال 3 أيام، قسائم للأمهات", color: "yellow", pinned: true, created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
    { id: "seed_n_2", title: "اتصل المورد X", body: "بدّو رد على عرض الأسعار قبل الجمعة. السعر اللي عرضو 12 ₪ للقطعة بدل 15.", color: "blue", pinned: true, created_at: new Date(Date.now() - 2 * 86400000).toISOString() },
    { id: "seed_n_3", title: "ملاحظة سريعة", body: "زبائن VIP بيحبوا الباقات الخاصة، فكّري بإصدار باقة شهرية لهم", color: "green", pinned: false, created_at: new Date(Date.now() - 7 * 86400000).toISOString() },
    { id: "seed_n_4", title: "موعد ضريبة دخل", body: "آخر موعد لتقديم التقرير: 15 من الشهر القادم", color: "pink", pinned: false, created_at: new Date(Date.now() - 14 * 86400000).toISOString() },
    { id: "seed_n_5", title: "كلمة سر البنك", body: "غيّريها قبل آخر الشهر (قاعدة الأمن الداخلي)", color: "yellow", pinned: false, created_at: new Date(Date.now() - 30 * 86400000).toISOString() },
  ];
  lsSet("tj_notes_v1", notes);
  counts.notes = notes.length;

  // ─── 11. Tags ───────────────────────────────────────────────────────────
  const tags = [
    { id: "seed_tag_1", name: "حساس", color: "#A32D2D", entity_type: "customer" },
    { id: "seed_tag_2", name: "بيحب جديد", color: "#0F6E56", entity_type: "customer" },
    { id: "seed_tag_3", name: "موسمي", color: "#BA7517", entity_type: "all" },
    { id: "seed_tag_4", name: "VIP طويل الأمد", color: "#6B4B8F", entity_type: "customer" },
    { id: "seed_tag_5", name: "تخفيض قريب", color: "#2563A6", entity_type: "product" },
    { id: "seed_tag_6", name: "مخزون استراتيجي", color: "#0F6E56", entity_type: "product" },
  ];
  lsSet("tj_tags_v1", tags);
  // Link a few tags to entities
  if (customers.length > 0 && products.length > 0) {
    const entityTags: Record<string, string[]> = {};
    if (customers[0]) entityTags[customers[0].id] = ["seed_tag_4", "seed_tag_2"];
    if (customers[1]) entityTags[customers[1].id] = ["seed_tag_1"];
    if (customers[2]) entityTags[customers[2].id] = ["seed_tag_2"];
    if (products[0]) entityTags[products[0].id] = ["seed_tag_5"];
    if (products[1]) entityTags[products[1].id] = ["seed_tag_6"];
    if (products[2]) entityTags[products[2].id] = ["seed_tag_3"];
    lsSet("tj_entity_tags_v1", entityTags);
  }
  counts.tags = tags.length;

  // ─── 12. Reviews ────────────────────────────────────────────────────────
  if (customers.length > 0) {
    const reviews = [
      { id: "seed_rv_1", customerId: customers[0]?.id, customerName: customers[0]?.name, rating: 5, comment: "خدمة ممتازة وزبائن دائمين! بنصح فيهم.", at: daysAgo(3), read: false, replied: false },
      { id: "seed_rv_2", customerId: customers[1]?.id, customerName: customers[1]?.name, rating: 4, comment: "منتجات حلوة بس الأسعار غالية شوي", at: daysAgo(7), read: true, replied: true, reply: "شكراً لرأيك — راجعي عروض الباقات تجدي خصم جيد" },
      { id: "seed_rv_3", customerId: customers[2]?.id, customerName: customers[2]?.name, rating: 5, comment: "أحسن بوتيك في المنطقة، فاطمة دائماً بتساعدني باختيار اللي يناسبني", at: daysAgo(14), read: true, replied: false },
      { id: "seed_rv_4", customerId: customers[3]?.id, customerName: customers[3]?.name, rating: 3, comment: "البضاعة وصلت متأخرة يومين", at: daysAgo(21), read: true, replied: true, reply: "نعتذر — هذا الأسبوع كان فيه ضغط من المورّد. دفعنا خصم 10% للمرة الجاية." },
      { id: "seed_rv_5", customerId: customers[4]?.id, customerName: customers[4]?.name, rating: 5, comment: "بصراحة أكثر من ممتاز ❤️", at: daysAgo(30), read: true, replied: false },
      { id: "seed_rv_6", customerId: customers[0]?.id, customerName: customers[0]?.name, rating: 2, comment: "المنتج الأخير ما عجبني، اللون مختلف عن الصورة", at: daysAgo(45), read: false, replied: false },
    ].filter((r) => r.customerId);
    lsSet("tj_reviews_v1", reviews);
    counts.reviews = reviews.length;
  }

  // ─── 13. Customer Chat ──────────────────────────────────────────────────
  if (customers.length > 0) {
    const chats = customers.slice(0, 4).map((c, ci) => ({
      customerId: c.id,
      customerName: c.name,
      messages: [
        { from: "customer" as const, text: ["مرحبا، عندكم القميص الأزرق متوفر؟", "السلام عليكم", "هلو، سؤال صغير", "صباح الخير"][ci], at: daysAgo(2 - (ci % 2)) + "T10:30:00" },
        { from: "store" as const, text: ["أهلاً وسهلاً 👋 أكيد عندنا، تحبي مقاس كذا؟", "وعليكم السلام، تفضّلي", "أهلين 🙋", "صباح النور"][ci], at: daysAgo(2 - (ci % 2)) + "T10:35:00" },
        { from: "customer" as const, text: ["مقاس M لو سمحتي", "بدي أعرف موعد البضاعة الجديدة", "بدي أرجع الفستان اللي اشتريته", "هل في توصيل لمنطقتي؟"][ci], at: daysAgo(2 - (ci % 2)) + "T10:38:00" },
        { from: "store" as const, text: ["تمام، 150 ₪ — تحبي توصيل ولا استلام؟", "ان شاء الله الأسبوع الجاي", "أكيد، بنرجّعه نقداً أو رصيد للمحل", "أكيد، ساعة من الطلب"][ci], at: daysAgo(2 - (ci % 2)) + "T10:42:00" },
      ],
    }));
    lsSet("tj_chat_v1", chats);
    counts.chats = chats.length;
  }

  // ─── 14. Subscriptions ──────────────────────────────────────────────────
  if (customers.length > 0) {
    const subs = customers.slice(0, 5).map((c, i) => ({
      id: `seed_sub_${i}`,
      customerId: c.id,
      customerName: c.name,
      amount: [99, 199, 49, 299, 149][i],
      frequency: (["monthly", "monthly", "weekly", "monthly", "quarterly"] as const)[i],
      start_date: daysAgo(90 - i * 15),
      next_billing: daysFromNow(15 - i * 3),
      status: i < 4 ? "active" as const : "paused" as const,
      description: ["اشتراك شهري ذهبي", "خدمة استشارة شهرية", "صندوق أسبوعي", "اشتراك VIP", "خدمة ربعية"][i],
      created_at: new Date(Date.now() - (90 - i * 15) * 86400000).toISOString(),
    }));
    lsSet("tj_subscriptions_v1", subs);
    counts.subs = subs.length;
  }

  // ─── 15. Referrals ──────────────────────────────────────────────────────
  if (customers.length >= 3) {
    const referrals = [
      { id: "seed_ref_1", referrerId: customers[0].id, referrerName: customers[0].name, refereeId: customers[2].id, refereeName: customers[2].name, code: `REF-${customers[0].id.slice(-4).toUpperCase()}`, reward_value: 50, reward_type: "credit", at: daysAgo(20) },
      { id: "seed_ref_2", referrerId: customers[1].id, referrerName: customers[1].name, refereeId: customers[3]?.id || customers[0].id, refereeName: customers[3]?.name || customers[0].name, code: `REF-${customers[1].id.slice(-4).toUpperCase()}`, reward_value: 50, reward_type: "credit", at: daysAgo(45) },
      { id: "seed_ref_3", referrerId: customers[0].id, referrerName: customers[0].name, refereeId: customers[4]?.id || customers[1].id, refereeName: customers[4]?.name || customers[1].name, code: `REF-${customers[0].id.slice(-4).toUpperCase()}`, reward_value: 50, reward_type: "credit", at: daysAgo(7) },
    ];
    lsSet("tj_referrals_v1", referrals);
    lsSet("tj_referrals_cfg_v1", { reward_type: "credit", reward_value: 50, is_active: true });
    counts.referrals = referrals.length;
  }

  // ─── 16. Appointments ───────────────────────────────────────────────────
  if (customers.length > 0) {
    const apptStatuses: Array<"scheduled" | "completed" | "cancelled" | "no-show"> = ["scheduled", "scheduled", "scheduled", "completed", "completed", "no-show", "scheduled", "completed"];
    const appts = apptStatuses.map((status, i) => ({
      id: `seed_appt_${i}`,
      customerId: customers[i % customers.length].id,
      customerName: customers[i % customers.length].name,
      service: ["استشارة تسوّق", "تجربة فستان", "قياسات خاصة", "زيارة لدى الستايلست", "مراجعة طلبيّة كبرى", "فحص قياسات", "اقتراحات هدية", "متابعة طلب"][i],
      date: i < 4 ? daysFromNow(1 + i * 2) : daysAgo(2 + (i - 4) * 5),
      time: ["10:00", "11:30", "14:00", "16:30", "12:00", "15:00", "09:30", "13:00"][i],
      duration_min: 30 + (i % 4) * 15,
      status,
      notes: i === 0 ? "زبونة جديدة — مهم نتركّ انطباع" : undefined,
      created_at: new Date(Date.now() - (10 - i) * 86400000).toISOString(),
    }));
    lsSet("tj_appointments_v1", appts);
    counts.appts = appts.length;
  }

  // ─── 17. Deliveries ─────────────────────────────────────────────────────
  if (invoices.length > 0) {
    const dStatuses: Array<"preparing" | "out_for_delivery" | "delivered" | "failed"> = ["preparing", "out_for_delivery", "delivered", "delivered", "failed", "preparing"];
    const deliveries = dStatuses.map((status, i) => {
      const inv = invoices[i % invoices.length];
      return {
        id: `seed_d_${i}`,
        invoiceId: inv.id,
        invoiceNo: inv.no,
        customerId: inv.customerId,
        driver: ["أحمد", "محمد", "سعيد", "خالد"][i % 4],
        address: ["شارع الرشيد، الناصرة", "شارع يافا، حيفا", "حي الزيتون، عكا", "شارع الجليل، شفاعمرو", "حي الكرمل، حيفا", "وسط البلد، الناصرة"][i],
        estimated_time: i < 2 ? "30 دقيقة" : undefined,
        actual_time: status === "delivered" ? "25 دقيقة" : undefined,
        status,
        notes: status === "failed" ? "العنوان غير صحيح — إعادة المحاولة غداً" : undefined,
        created_at: new Date(Date.now() - (3 - i % 3) * 86400000).toISOString(),
      };
    });
    lsSet("tj_deliveries_v1", deliveries);
    counts.deliveries = deliveries.length;
  }

  // ─── 18. Posts (social) ─────────────────────────────────────────────────
  if (products.length > 0) {
    const posts = [
      { id: "seed_p_1", productId: products[0]?.id, caption: `🌟 منتج جديد وصلنا!\n\n${products[0]?.name}\n💰 ${products[0]?.price} ₪\n\nاطلبيه الآن — كميات محدودة! 📩`, template: "منتج جديد", created_at: daysAgo(2), used_count: 12 },
      { id: "seed_p_2", productId: products[1]?.id, caption: `🔥 عرض اليوم فقط!\n\n${products[1]?.name} بـ ${products[1]?.price} ₪\nالعرض ينتهي الليلة 🕛`, template: "عرض اليوم", created_at: daysAgo(5), used_count: 47 },
      { id: "seed_p_3", productId: products[2]?.id, caption: `⭐ الأكثر مبيعاً\n\n${products[2]?.name}\nاكتشفي السر وراء الانتشار! 💕`, template: "الأكثر مبيعاً", created_at: daysAgo(10), used_count: 23 },
    ].filter((p) => p.productId);
    lsSet("tj_posts_v1", posts);
    counts.posts = posts.length;
  }

  // ─── 19. Email Campaigns ────────────────────────────────────────────────
  const emailCampaigns = [
    { id: "seed_em_1", subject: "عيد سعيد + خصم 20% خاص", body: "مرحباً عزيزتنا، بمناسبة العيد، نقدّم لكِ خصم 20% على كل المشتريات لمدة 3 أيام فقط. استخدمي كود EID20 عند الفاتورة. كل عام وأنتِ بألف خير ✨", segment: "all", sent_at: daysAgo(15), opens: 142, clicks: 38, sent_count: 200 },
    { id: "seed_em_2", subject: "ملابس الصيف الجديدة 🌞", body: "وصلتنا تشكيلة جديدة من ملابس الصيف — تصاميم عصرية بأسعار مذهلة. اطلعي على المجموعة الكاملة في المحل أو اتصلي بنا للاستشارة.", segment: "vip", sent_at: daysAgo(30), opens: 28, clicks: 12, sent_count: 35 },
    { id: "seed_em_3", subject: "دعوة لافتتاح فرعنا الجديد", body: "نسعد بدعوتك لحضور افتتاح فرعنا الجديد يوم السبت في تمام الساعة 11 صباحاً. فطور خفيف + خصم خاص للحاضرات.", segment: "all", sent_at: daysAgo(60), opens: 87, clicks: 19, sent_count: 200 },
  ];
  lsSet("tj_email_campaigns_v1", emailCampaigns);
  counts.emails = emailCampaigns.length;

  // ─── 20. WhatsApp Blasts ────────────────────────────────────────────────
  const blasts = [
    { id: "seed_wb_1", message: "مرحباً {name} 👋 لديك دين معلّق بقيمة {debt} ₪ — نأمل التواصل معنا لترتيب الدفع. شكراً.", segment: "debtors", recipient_count: 12, sent_at: daysAgo(7) },
    { id: "seed_wb_2", message: "أهلاً {name} ⭐ كزبونة VIP، عرض حصري لكِ: 25% خصم على كامل التشكيلة هذا الأسبوع.", segment: "vip", recipient_count: 18, sent_at: daysAgo(14) },
    { id: "seed_wb_3", message: "صباح الخير {name} 🌸 اشتقنالك! آخر زيارة من زمان — تشرّفنا قريب وعندنا مفاجآت.", segment: "dormant", recipient_count: 22, sent_at: daysAgo(21) },
  ];
  lsSet("tj_whatsapp_blasts_v1", blasts);
  counts.blasts = blasts.length;

  // ─── 21. Auto Campaigns ─────────────────────────────────────────────────
  lsSet("tj_auto_campaigns_v1", {
    birthday: { enabled: true, template: "كل سنة وأنتِ بخير {name} 🎂🎉 خصم خاص 15% بمناسبة عيد ميلادك — استخدمي كود BIRTHDAY15 خلال أسبوع." },
    dormant: { enabled: true, template: "اشتقنالك يا {name} 💕 لو مرّت عليكِ، عندنا مفاجأة بانتظارك." },
    anniversary: { enabled: true, template: "سنة كاملة من تعاملنا معكِ {name} 🌟 شكراً على ثقتك — هدية خاصة بانتظارك." },
    abandoned_cart: { enabled: false, template: "{name}، تركتي سلتك ناقصة — تحبي نكمّلها معكِ؟" },
  });

  // ─── 22. Documents ──────────────────────────────────────────────────────
  const docs = [
    { id: "seed_doc_1", title: "عقد إيجار المحل 2025", category: "عقود", uploaded_at: daysAgo(180), size: "2.3 MB", linked_to: undefined },
    { id: "seed_doc_2", title: "رخصة المحل", category: "شهادات", uploaded_at: daysAgo(365), size: "1.1 MB", linked_to: undefined },
    { id: "seed_doc_3", title: "صورة المنتج الجديد", category: "صور منتجات", uploaded_at: daysAgo(7), size: "3.5 MB", linked_to: products[0]?.id },
    { id: "seed_doc_4", title: "إيصال شراء بضاعة - مارس", category: "إيصالات", uploaded_at: daysAgo(45), size: "0.8 MB", linked_to: undefined },
    { id: "seed_doc_5", title: "فاتورة الكهرباء - يناير", category: "فواتير", uploaded_at: daysAgo(60), size: "0.4 MB", linked_to: undefined },
    { id: "seed_doc_6", title: "كاتالوج موردين 2025", category: "أخرى", uploaded_at: daysAgo(120), size: "5.2 MB", linked_to: undefined },
    { id: "seed_doc_7", title: "صور الموسم الصيفي", category: "صور منتجات", uploaded_at: daysAgo(30), size: "8.7 MB", linked_to: undefined },
  ];
  lsSet("tj_documents_v1", docs);
  counts.docs = docs.length;

  // ─── 23. Contracts ──────────────────────────────────────────────────────
  if (suppliers.length > 0) {
    const contracts = [
      { id: "seed_ct_1", title: "عقد توريد بضاعة شهرية", counterparty: suppliers[0]?.name || "—", counterpartyId: suppliers[0]?.id, start_date: daysAgo(180), end_date: daysFromNow(180), value: 24000, status: "active", auto_renew: true, created_at: new Date(Date.now() - 180 * 86400000).toISOString() },
      { id: "seed_ct_2", title: "عقد إيجار المحل", counterparty: "شركة العقارات", start_date: daysAgo(365), end_date: daysFromNow(365), value: 36000, status: "active", auto_renew: false, created_at: new Date(Date.now() - 365 * 86400000).toISOString() },
      { id: "seed_ct_3", title: "اتفاقية شراكة لتسويق مشترك", counterparty: "متجر الموضة المجاور", start_date: daysAgo(60), end_date: daysFromNow(305), value: 0, status: "active", auto_renew: true, created_at: new Date(Date.now() - 60 * 86400000).toISOString() },
      { id: "seed_ct_4", title: "عقد توزيع منتهي", counterparty: suppliers[1]?.name || "مورّد سابق", counterpartyId: suppliers[1]?.id, start_date: daysAgo(450), end_date: daysAgo(30), value: 18000, status: "expired", auto_renew: false, created_at: new Date(Date.now() - 450 * 86400000).toISOString() },
    ];
    lsSet("tj_contracts_v1", contracts);
    counts.contracts = contracts.length;
  }

  // ─── 24. Licenses ───────────────────────────────────────────────────────
  const licenses = [
    { id: "seed_lic_1", name: "رخصة عمل تجاري", issuer: "بلدية الناصرة", issue_date: daysAgo(700), expiry_date: daysFromNow(180), renewal_period: "سنوي", document_url: "" },
    { id: "seed_lic_2", name: "ترخيص ضريبة دخل", issuer: "מס הכנסה", issue_date: daysAgo(900), expiry_date: daysFromNow(60), renewal_period: "سنوي", document_url: "" },
    { id: "seed_lic_3", name: "شهادة صحية للمنتجات", issuer: "وزارة الصحة", issue_date: daysAgo(180), expiry_date: daysFromNow(15), renewal_period: "نصف سنوي", document_url: "" },
    { id: "seed_lic_4", name: "ترخيص لافتة محل", issuer: "البلدية", issue_date: daysAgo(400), expiry_date: daysAgo(15), renewal_period: "سنوي", document_url: "" },
  ];
  lsSet("tj_licenses_v1", licenses);
  counts.licenses = licenses.length;

  // ─── 25. Compliance ─────────────────────────────────────────────────────
  lsSet("tj_compliance_v1", {
    "license_renewed": true,
    "tax_filings_current": true,
    "invoices_archived": true,
    "supplier_contracts_signed": true,
    "backup_recent": false,
    "insurance_valid": true,
    "permit_food": true,
    "compliance_review_quarterly": false,
    "data_protection_policy": true,
    "fire_safety_check": false,
    "employee_records": true,
    "supplier_records": true,
  });

  // ─── 26. Reports Snapshots ──────────────────────────────────────────────
  const snapshots = [
    { id: "seed_sn_1", name: "تقرير شهر يناير", type: "monthly", saved_at: daysAgo(30), period: "2026-01", revenue: 48500, expenses: 22300, profit: 26200 },
    { id: "seed_sn_2", name: "تقرير الربع الأول", type: "quarterly", saved_at: daysAgo(15), period: "Q1-2026", revenue: 142000, expenses: 68500, profit: 73500 },
    { id: "seed_sn_3", name: "تقرير العيد", type: "custom", saved_at: daysAgo(45), period: "Eid 2026", revenue: 28000, expenses: 12000, profit: 16000 },
  ];
  lsSet("tj_snapshots_v1", snapshots);
  counts.snapshots = snapshots.length;

  // ─── 27. Share Links ────────────────────────────────────────────────────
  const shareLinks = [
    { id: "seed_sl_1", title: "تقرير شهري للمحاسب", target_page: "/desktop/reports/monthly", access_count: 12, expiry: daysFromNow(30), created_at: daysAgo(15), is_active: true },
    { id: "seed_sl_2", title: "ملخص سيولة لمستثمر", target_page: "/desktop/liquidity", access_count: 3, expiry: daysFromNow(7), created_at: daysAgo(20), is_active: true },
    { id: "seed_sl_3", title: "كشف ديون الزبائن", target_page: "/desktop/receivables", access_count: 1, expiry: daysAgo(5), created_at: daysAgo(40), is_active: false },
  ];
  lsSet("tj_share_links_v1", shareLinks);
  counts.shareLinks = shareLinks.length;

  // ─── 28. Sent Messages Log ──────────────────────────────────────────────
  if (customers.length > 0) {
    const sent = customers.slice(0, 10).map((c, i) => ({
      id: `seed_sm_${i}`,
      recipient: c.name,
      recipient_phone: c.phone,
      type: i % 3 === 0 ? "email" : "whatsapp",
      message: ["تذكير بفاتورة معلّقة بقيمة 350 ₪", "شكراً لتسوّقك معنا اليوم!", "وصل طلبك للمحل، تشرّفي لأخذه", "عرض خاص لكِ بمناسبة عيد ميلادك", "نذكّرك بمواعيد العرض غداً", "فاتورتك جاهزة — رابط الدفع داخل الرسالة", "اشتقنالك يا غالية، شو أخبارك؟", "عندنا تشكيلة جديدة وصلت اليوم", "تذكير: شيك مستحق غداً", "خصم 15% على المشتريات اليوم"][i],
      sent_at: new Date(Date.now() - (i * 6 * 60 * 60 * 1000)).toISOString(),
      status: "delivered",
    }));
    lsSet("tj_sent_messages_v1", sent);
    counts.sentMessages = sent.length;
  }

  // ─── 29. Stock Adjustments ──────────────────────────────────────────────
  if (products.length > 0) {
    const adjustments = [
      { id: "seed_adj_1", date: daysAgo(7), productId: products[0].id, qty: 5, direction: "in", reason: "جرد دوري — اكتشاف 5 قطع غير مسجّلة" },
      { id: "seed_adj_2", date: daysAgo(14), productId: products[1]?.id || products[0].id, qty: 1, direction: "out", reason: "كسر بالعرض" },
      { id: "seed_adj_3", date: daysAgo(20), productId: products[2]?.id || products[0].id, qty: 2, direction: "out", reason: "هدية لزبون VIP" },
      { id: "seed_adj_4", date: daysAgo(30), productId: products[0].id, qty: 10, direction: "in", reason: "استلام طلبية متأخرة" },
    ];
    lsSet("tj_stock_adjustments_v1", adjustments);
    counts.adjustments = adjustments.length;
  }

  // ─── 30. Cash Drawer ────────────────────────────────────────────────────
  lsSet("tj_cash_drawer_v1", {
    today: {
      date: todayIso(),
      opening: 500,
      movements: [
        { type: "in", amount: 350, ref: "بيع نقدي", at: isoNow(-180) },
        { type: "in", amount: 1200, ref: "فاتورة #1242", at: isoNow(-90) },
        { type: "out", amount: 200, ref: "مصروف نقل", at: isoNow(-45) },
        { type: "in", amount: 500, ref: "تحصيل دين", at: isoNow(-15) },
      ],
      expected_close: 500 + 350 + 1200 - 200 + 500,
    },
    history: [
      { date: daysAgo(1), opening: 500, expected: 1980, actual: 1980, variance: 0 },
      { date: daysAgo(2), opening: 500, expected: 2400, actual: 2375, variance: -25 },
      { date: daysAgo(3), opening: 500, expected: 1750, actual: 1750, variance: 0 },
    ],
  });

  // ─── 31. Goals 2.0 ──────────────────────────────────────────────────────
  lsSet("tj_goals_v2", [
    { id: "seed_g_1", name: "مبيعات الشهر", target: 50000, current: 38500, metric: "revenue_month", deadline: daysFromNow(15), created_at: daysAgo(15) },
    { id: "seed_g_2", name: "زبائن جدد هذا الشهر", target: 20, current: 14, metric: "new_customers", deadline: daysFromNow(15), created_at: daysAgo(15) },
    { id: "seed_g_3", name: "تقليل المصاريف 10%", target: 15000, current: 12500, metric: "expenses_reduce", deadline: daysFromNow(45), created_at: daysAgo(30) },
  ]);

  // ─── 32. Achievements unlocked ──────────────────────────────────────────
  lsSet("tj_achievements_v1", {
    "first_invoice": daysAgo(120),
    "100_invoices": daysAgo(45),
    "first_customer": daysAgo(120),
    "10_customers": daysAgo(90),
    "month_streak": daysAgo(30),
  });

  // ─── 33. Budgets ────────────────────────────────────────────────────────
  lsSet("tj_budgets_v1", [
    { id: "seed_bud_1", category: "إيجار", monthly_amount: 5000, created_at: daysAgo(60) },
    { id: "seed_bud_2", category: "كهرباء", monthly_amount: 800, created_at: daysAgo(60) },
    { id: "seed_bud_3", category: "بضاعة", monthly_amount: 12000, created_at: daysAgo(60) },
    { id: "seed_bud_4", category: "تسويق", monthly_amount: 1500, created_at: daysAgo(45) },
    { id: "seed_bud_5", category: "نقل", monthly_amount: 600, created_at: daysAgo(30) },
  ]);

  // ─── 34. Store Profile ──────────────────────────────────────────────────
  if (!localStorage.getItem("tj_store_profile_v1")) {
    lsSet("tj_store_profile_v1", {
      tagline: "أناقة بأسعار تناسبك",
      hours: "السبت - الخميس: 9 صباحاً - 9 مساءً\nالجمعة: 10 - 5 مساءً",
      public_phone: "+972 4 123-4567",
      public_whatsapp: "+972 50 123-4567",
      address: "شارع الرشيد 24، الناصرة",
      instagram: "@boutique.layla",
      facebook: "boutique.layla",
    });
  }

  // ─── 35. Theme + AI prefs ───────────────────────────────────────────────
  lsSet("tj_ai_prefs_v1", {
    chat_assistant: true,
    voice_input: true,
    predictive_text: true,
    narrative_reports: true,
    smart_categorization: true,
  });

  lsSet("tj_preferences_v1", {
    sound: false,
    haptic: true,
    animations: true,
    dailyTip: true,
  });

  // ─── 36. Notification setup defaults ────────────────────────────────────
  lsSet("tj_notif_prefs_v1", {
    checks_due: true,
    overdue_customers: true,
    low_stock: true,
    birthdays: true,
    daily_summary: false,
  });

  // ─── 37. Onboarding marked partial complete ─────────────────────────────
  // Don't dismiss the onboarding card — let user see it works.

  // ─── 38. Scanner history ────────────────────────────────────────────────
  if (products.length > 0) {
    lsSet("tj_scanner_history_v1", products.slice(0, 5).map((p, i) => ({
      id: `seed_sc_${i}`,
      productId: p.id,
      productName: p.name,
      scanned_at: new Date(Date.now() - i * 3600000).toISOString(),
    })));
  }

  // ─── 39. Anomalies dismissed (none — show fresh) ────────────────────────
  lsSet("tj_anomalies_dismissed_v1", []);

  // ─── 40. Chart annotations ──────────────────────────────────────────────
  lsSet("tj_chart_annotations_v1", [
    { id: "seed_an_1", month: 2, label: "🎉 إطلاق المنتج الجديد", at: daysAgo(45) },
    { id: "seed_an_2", month: 5, label: "📉 شهر صعب — كورونا", at: daysAgo(120) },
    { id: "seed_an_3", month: 9, label: "✨ افتتاح الفرع الثاني", at: daysAgo(15) },
  ]);

  // ─── 41. Saved reports ──────────────────────────────────────────────────
  lsSet("tj_saved_reports_v1", [
    { id: "seed_sr_1", name: "إيرادات شهرية", metric: "revenue", group_by: "month", saved_at: daysAgo(20) },
    { id: "seed_sr_2", name: "أعلى الزبائن إنفاقاً", metric: "revenue", group_by: "customer", saved_at: daysAgo(10) },
  ]);

  // ─── 42. Printer config ─────────────────────────────────────────────────
  lsSet("tj_printer_v1", {
    type: "thermal",
    width_mm: 80,
    show_logo: true,
    footer_text: "شكراً لزيارتك — نراك قريباً ✨",
    auto_cut: true,
  });

  // ─── 43. Coupon usage log ───────────────────────────────────────────────
  lsSet("tj_coupon_log_v1", [
    { id: "seed_clog_1", coupon_code: "EID15", invoiceId: invoices[0]?.id, customerId: customers[0]?.id, discount_amount: 45, at: daysAgo(8) },
    { id: "seed_clog_2", coupon_code: "WELCOME10", invoiceId: invoices[1]?.id, customerId: customers[1]?.id, discount_amount: 25, at: daysAgo(12) },
  ]);

  // ─── 44. Biometric ──────────────────────────────────────────────────────
  lsSet("tj_biometric_enabled", "1");
  lsSet("tj_biometric_last_unlock", new Date(Date.now() - 7200000).toISOString());

  // ─── Mark seed done ─────────────────────────────────────────────────────
  lsSet(SEED_FLAG_KEY, { version: SEED_VERSION, at: new Date().toISOString() });

  return { seeded: true, counts };
}

/** Reset all extension data (for testing). */
export function resetAllExtensions() {
  if (typeof localStorage === "undefined") return;
  const keys = Object.keys(localStorage).filter((k) => k.startsWith("tj_") && k !== "tj_state" && k !== "tj_dark" && k !== "tijarti_dark" && k !== "tj_primary_color");
  for (const k of keys) {
    try { localStorage.removeItem(k); } catch { /* ignore */ }
  }
}
