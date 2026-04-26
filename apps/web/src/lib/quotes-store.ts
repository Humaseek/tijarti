"use client";

/**
 * Lightweight quotes store — localStorage-backed.
 *
 * Stays out of the main store-context to avoid tangling with invoice
 * generation logic. Quotes convert to invoices via a regular flow.
 */

import { useEffect, useState } from "react";

export type QuoteStatus = "draft" | "sent" | "accepted" | "rejected" | "converted";

export interface QuoteItem {
  pid: string;
  qty: number;
  price: number;
}

export interface Quote {
  id: string;
  no: string;
  customerId: string;
  date: string;      // ISO
  items: QuoteItem[];
  total: number;
  notes?: string;
  status: QuoteStatus;
  valid_until?: string;
  convertedToInvoiceId?: string;
  created_at: string;
}

const STORAGE_KEY = "tj_quotes_v1";

function load(): Quote[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Quote[];
  } catch { return []; }
}

function save(quotes: Quote[]) {
  if (typeof localStorage === "undefined") return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes)); } catch { /* ignore */ }
}

/** React hook for reading + mutating quotes. */
export function useQuotes() {
  const [quotes, setQuotes] = useState<Quote[]>([]);

  useEffect(() => {
    setQuotes(load());
  }, []);

  const add = (q: Omit<Quote, "id" | "no" | "created_at" | "status"> & { status?: QuoteStatus }) => {
    const next: Quote = {
      ...q,
      id: `q_${Date.now()}`,
      no: `Q-${(quotes.length + 1).toString().padStart(4, "0")}`,
      status: q.status ?? "draft",
      created_at: new Date().toISOString(),
    };
    const list = [next, ...quotes];
    setQuotes(list);
    save(list);
    return next;
  };

  const update = (id: string, patch: Partial<Quote>) => {
    const list = quotes.map((q) => (q.id === id ? { ...q, ...patch } : q));
    setQuotes(list);
    save(list);
  };

  const remove = (id: string) => {
    const list = quotes.filter((q) => q.id !== id);
    setQuotes(list);
    save(list);
  };

  const find = (id: string) => quotes.find((q) => q.id === id);

  return { quotes, add, update, remove, find };
}

export const STATUS_LABEL: Record<QuoteStatus, string> = {
  draft: "مسودة",
  sent: "مُرسل",
  accepted: "مقبول",
  rejected: "مرفوض",
  converted: "تحوّل لفاتورة",
};

export const STATUS_STYLE: Record<QuoteStatus, { bg: string; text: string }> = {
  draft: { bg: "bg-surface2 dark:bg-surface2-dark", text: "text-muted dark:text-muted-dark" },
  sent: { bg: "bg-info-soft dark:bg-info-soft-dark", text: "text-info dark:text-info-dark" },
  accepted: { bg: "bg-success-soft dark:bg-success-soft-dark", text: "text-success dark:text-success-dark" },
  rejected: { bg: "bg-danger-soft dark:bg-danger-soft-dark", text: "text-danger dark:text-danger-dark" },
  converted: { bg: "bg-primary-soft dark:bg-primary-soft/30", text: "text-primary" },
};
