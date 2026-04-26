"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useStore } from "@/lib/store/store-context";
import { Ico } from "@/components/ui/icon";
import type { IconName } from "@/lib/icons";

/**
 * Global command palette (⌘K / Ctrl+K).
 *
 * Searches across customers, suppliers, products, invoices, checks, debts.
 * Keyboard-first: arrows to navigate, Enter to open, Esc to close.
 *
 * Mount once at the layout level. Automatically picks /desktop/ vs /app/
 * result links based on the current pathname.
 */

type ResultKind = "customer" | "supplier" | "product" | "invoice" | "check" | "debt" | "action";

interface CommandResult {
  id: string;
  kind: ResultKind;
  title: string;
  subtitle?: string;
  href: string;
  icon: IconName;
}

const KIND_LABEL: Record<ResultKind, string> = {
  customer: "زبون",
  supplier: "مورّد",
  product: "منتج",
  invoice: "فاتورة",
  check: "شيك",
  debt: "ذمّة",
  action: "إجراء",
};

const KIND_GROUP_ORDER: ResultKind[] = ["action", "invoice", "customer", "supplier", "product", "check", "debt"];

function matches(haystack: string | number | null | undefined, query: string) {
  if (haystack === null || haystack === undefined) return false;
  return String(haystack).toLowerCase().includes(query);
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const pathname = usePathname();
  const { state } = useStore();

  // Is this a mobile (/app) or desktop (/desktop) context?
  const isDesktop = pathname.startsWith("/desktop");
  const base = isDesktop ? "/desktop" : "/app";

  // Global keyboard listener for ⌘K / Ctrl+K and Esc
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 10);
      setQuery("");
      setActiveIdx(0);
    }
  }, [open]);

  // Compute results
  const results = useMemo<CommandResult[]>(() => {
    const q = query.trim().toLowerCase();
    const out: CommandResult[] = [];

    // Quick actions (always shown, filtered by query)
    const actions: Array<{ title: string; href: string; icon: IconName; keys?: string }> = [
      { title: "فاتورة جديدة", href: `${base}/sales/new`, icon: "plus", keys: "invoice new faktora sale mabi3" },
      { title: "زبون جديد", href: `${base}/customers/new`, icon: "userPlus", keys: "customer new zabun" },
      { title: "منتج جديد", href: `${base}/products/new`, icon: "box", keys: "product new montaj" },
      { title: "مصروف جديد", href: `${base}/expenses/new`, icon: "card", keys: "expense new masroof" },
      { title: "شيك جديد", href: `${base}/checks/new`, icon: "receipt", keys: "check new sheek" },
      { title: "مورّد جديد", href: `${base}/suppliers/new`, icon: "store", keys: "supplier new" },
      { title: "التقارير", href: `${base}/reports`, icon: "chart", keys: "reports taqarir" },
      { title: "المالية", href: `${base}/finances`, icon: "chart", keys: "finances malya" },
      { title: "الإعدادات", href: `${base}/settings`, icon: "settings", keys: "settings i3dadat" },
    ];
    for (const a of actions) {
      if (!q || a.title.toLowerCase().includes(q) || a.keys?.toLowerCase().includes(q)) {
        out.push({ id: `action:${a.href}`, kind: "action", title: a.title, href: a.href, icon: a.icon });
      }
    }

    if (q.length === 0) return out.slice(0, 9);

    // Customers
    for (const c of state.customers) {
      if (matches(c.name, q) || matches(c.phone, q) || matches(c.whatsapp, q)) {
        out.push({
          id: `customer:${c.id}`, kind: "customer",
          title: c.name,
          subtitle: [c.phone, c.tag].filter(Boolean).join(" · "),
          href: `${base}/customers/${c.id}`,
          icon: "user",
        });
      }
    }

    // Suppliers
    for (const s of state.suppliers) {
      if (matches(s.name, q) || matches(s.phone, q) || matches(s.default_category, q)) {
        out.push({
          id: `supplier:${s.id}`, kind: "supplier",
          title: s.name,
          subtitle: [s.phone, s.default_category].filter(Boolean).join(" · "),
          href: `${base}/suppliers/${s.id}`,
          icon: "store",
        });
      }
    }

    // Products
    for (const p of state.products) {
      if (matches(p.name, q) || matches(p.sku, q) || matches(p.barcode, q) || matches(p.category, q)) {
        out.push({
          id: `product:${p.id}`, kind: "product",
          title: p.name,
          subtitle: `SKU ${p.sku} · ${p.price.toLocaleString()} ₪ · مخزون ${p.stock}`,
          href: `${base}/products/${p.id}`,
          icon: "box",
        });
      }
    }

    // Invoices
    for (const inv of state.invoices) {
      const cust = state.customers.find((c) => c.id === inv.customerId);
      if (matches(inv.no, q) || matches(cust?.name, q)) {
        out.push({
          id: `invoice:${inv.id}`, kind: "invoice",
          title: `فاتورة #${inv.no}`,
          subtitle: `${cust?.name || "—"} · ${inv.total.toLocaleString()} ₪ · ${inv.date}`,
          href: `${base}/invoices/${inv.id}`,
          icon: "receipt",
        });
      }
    }

    // Checks
    for (const ch of state.checks) {
      if (matches(ch.number, q) || matches(ch.party_name, q) || matches(ch.bank, q)) {
        out.push({
          id: `check:${ch.id}`, kind: "check",
          title: `شيك #${ch.number}`,
          subtitle: `${ch.party_name} · ${ch.amount.toLocaleString()} ₪ · ${ch.direction === "incoming" ? "وارد" : "صادر"}`,
          href: `${base}/checks/${ch.id}`,
          icon: "receipt",
        });
      }
    }

    // Debts
    for (const d of state.debts) {
      if (matches(d.party_name, q) || matches(d.description, q)) {
        out.push({
          id: `debt:${d.id}`, kind: "debt",
          title: d.description || "ذمّة",
          subtitle: `${d.party_name} · ${d.amount.toLocaleString()} ₪ · ${d.direction === "incoming" ? "لكِ" : "عليكِ"}`,
          href: `${base}/debts/${d.id}`,
          icon: "money",
        });
      }
    }

    return out.slice(0, 30);
  }, [query, state, base]);

  // Group results by kind (preserving order)
  const grouped = useMemo(() => {
    const map = new Map<ResultKind, CommandResult[]>();
    for (const r of results) {
      const arr = map.get(r.kind) || [];
      arr.push(r);
      map.set(r.kind, arr);
    }
    return KIND_GROUP_ORDER
      .map((k) => ({ kind: k, items: map.get(k) || [] }))
      .filter((g) => g.items.length > 0);
  }, [results]);

  // Flat list for keyboard navigation
  const flatResults = useMemo(() => grouped.flatMap((g) => g.items), [grouped]);

  // Clamp activeIdx when results change
  useEffect(() => {
    if (activeIdx >= flatResults.length) setActiveIdx(Math.max(0, flatResults.length - 1));
  }, [flatResults.length, activeIdx]);

  // Keyboard navigation inside the modal
  const onInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(flatResults.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = flatResults[activeIdx];
      if (target) navigate(target);
    }
  };

  const navigate = (r: CommandResult) => {
    setOpen(false);
    router.push(r.href);
  };

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIdx}"]`);
    if (el && "scrollIntoView" in el) {
      (el as HTMLElement).scrollIntoView({ block: "nearest" });
    }
  }, [activeIdx]);

  if (!open) return null;

  let flatIdx = -1;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] bg-black/40 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[640px] mx-4 bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark shadow-2xl overflow-hidden"
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-divider dark:border-divider-dark">
          <Ico name="search" size={16} className="text-muted dark:text-muted-dark flex-shrink-0" sw={1.8} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIdx(0); }}
            onKeyDown={onInputKey}
            placeholder="ابحثي عن زبون، منتج، فاتورة…"
            className="flex-1 bg-transparent outline-none text-[14px] text-text dark:text-text-dark placeholder:text-muted dark:placeholder:text-muted-dark"
          />
          <kbd className="text-[10px] font-mono text-muted dark:text-muted-dark bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded px-1.5 py-0.5">Esc</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[60vh] overflow-auto">
          {grouped.length === 0 ? (
            <div className="py-10 text-center text-[12px] text-muted dark:text-muted-dark">
              {query ? "لا نتائج" : "ابحثي عن أي شيء…"}
            </div>
          ) : (
            grouped.map((group) => (
              <div key={group.kind} className="py-1">
                <div className="text-[9px] font-bold text-muted dark:text-muted-dark tracking-wider px-4 pt-2 pb-1">
                  {KIND_LABEL[group.kind]}
                </div>
                {group.items.map((r) => {
                  flatIdx += 1;
                  const active = flatIdx === activeIdx;
                  return (
                    <button
                      key={r.id}
                      data-idx={flatIdx}
                      onClick={() => navigate(r)}
                      onMouseEnter={() => setActiveIdx(flatIdx)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-start transition-colors ${
                        active ? "bg-primary/10 dark:bg-primary/20" : "hover:bg-surface2 dark:hover:bg-surface2-dark"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-tj flex items-center justify-center flex-shrink-0 ${
                        active ? "bg-primary text-white" : "bg-surface2 dark:bg-surface2-dark text-muted dark:text-muted-dark"
                      }`}>
                        <Ico name={r.icon} size={14} sw={1.8} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-text dark:text-text-dark truncate">{r.title}</div>
                        {r.subtitle && (
                          <div className="text-[10px] text-muted dark:text-muted-dark truncate">{r.subtitle}</div>
                        )}
                      </div>
                      {active && (
                        <Ico name="forward" size={12} className="text-muted dark:text-muted-dark flex-shrink-0" sw={1.8} style={{ transform: "scaleX(-1)" }} />
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hints */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-divider dark:border-divider-dark text-[10px] text-muted dark:text-muted-dark">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="font-mono bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded px-1">↑</kbd>
              <kbd className="font-mono bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded px-1">↓</kbd>
              للتنقل
            </span>
            <span className="flex items-center gap-1">
              <kbd className="font-mono bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded px-1">Enter</kbd>
              فتح
            </span>
          </div>
          <span>{flatResults.length} نتيجة</span>
        </div>
      </div>
    </div>
  );
}

/** Trigger button that opens the command palette. Plug into toolbars. */
export function CommandPaletteTrigger({ className = "" }: { className?: string }) {
  const [hasMeta, setHasMeta] = useState(false);
  useEffect(() => {
    setHasMeta(typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform));
  }, []);
  return (
    <button
      onClick={() => {
        // Dispatch a synthetic keyboard event the palette listens for
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: !hasMeta, metaKey: hasMeta }));
      }}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-tj bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark text-[11px] text-muted dark:text-muted-dark hover:bg-surface2 dark:hover:bg-surface2-dark transition-colors ${className}`}
      aria-label="بحث شامل"
    >
      <Ico name="search" size={13} sw={1.8} />
      <span className="hidden sm:inline">بحث…</span>
      <kbd className="text-[9px] font-mono bg-surface dark:bg-surface-dark border border-divider dark:border-divider-dark rounded px-1 py-0.5">
        {hasMeta ? "⌘K" : "Ctrl+K"}
      </kbd>
    </button>
  );
}
