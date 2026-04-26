"use client";

/**
 * Extensions store — localStorage-backed for newer features that don't belong
 * in the primary store yet. Returns/Credit notes, Gift cards, Loyalty points,
 * Purchase orders, Product bundles, Budgets. Keeping these separate lets the
 * main store stay stable while we iterate.
 */

import { useEffect, useState } from "react";

// ─── Returns / Credit Notes ────────────────────────────────────────────────
export interface ReturnEntry {
  id: string;
  invoiceId: string;
  invoiceNo: string;
  customerId: string;
  customerName: string;
  items: Array<{ pid: string; qty: number; price: number; reason?: string }>;
  total: number;
  refund_method: "cash" | "credit" | "replacement";
  note?: string;
  created_at: string;
}

// ─── Gift Cards ────────────────────────────────────────────────────────────
export interface GiftCard {
  id: string;
  code: string;
  amount: number;
  balance: number;
  buyer_customer_id?: string;
  recipient_name?: string;
  issued_at: string;
  expires_at?: string;
  status: "active" | "redeemed" | "expired";
  used_history: Array<{ amount: number; at: string; invoiceId?: string }>;
}

// ─── Loyalty Points ────────────────────────────────────────────────────────
export interface LoyaltyTxn {
  id: string;
  customerId: string;
  delta: number;         // positive = earned, negative = redeemed
  reason: string;        // "فاتورة #123" or "استبدال نقاط"
  balance_after: number;
  at: string;
}

// ─── Purchase Orders ───────────────────────────────────────────────────────
export type POStatus = "draft" | "sent" | "received" | "cancelled";
export interface PurchaseOrder {
  id: string;
  no: string;
  supplierId: string;
  supplierName: string;
  items: Array<{ pid: string; qty: number; price: number; received?: number }>;
  total: number;
  status: POStatus;
  order_date: string;
  expected_date?: string;
  received_date?: string;
  notes?: string;
  created_at: string;
}

// ─── Product Bundles ───────────────────────────────────────────────────────
export interface ProductBundle {
  id: string;
  name: string;
  description?: string;
  price: number;
  items: Array<{ pid: string; qty: number }>;
  is_active: boolean;
  created_at: string;
}

// ─── Budgets (vs actual) ───────────────────────────────────────────────────
export interface BudgetLine {
  id: string;
  category: string;      // expense category
  monthly_amount: number;
  created_at: string;
}

// ─── Coupons / Discount Codes ──────────────────────────────────────────────
export interface Coupon {
  id: string;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  max_uses?: number;
  current_uses: number;
  valid_from?: string;
  valid_until?: string;
  is_active: boolean;
  created_at: string;
}

// ─── Generic LocalStorage Hook ─────────────────────────────────────────────
function useLocalList<T extends { id: string }>(key: string) {
  const [list, setList] = useState<T[]>([]);
  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    try { setList(JSON.parse(localStorage.getItem(key) || "[]")); } catch { /* ignore */ }
  }, [key]);
  const commit = (next: T[]) => { setList(next); try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* ignore */ } };
  return {
    list,
    add: (item: T) => commit([item, ...list]),
    update: (id: string, patch: Partial<T>) => commit(list.map((x) => (x.id === id ? { ...x, ...patch } : x))),
    remove: (id: string) => commit(list.filter((x) => x.id !== id)),
    find: (id: string) => list.find((x) => x.id === id),
    commit,
  };
}

export const useReturns = () => useLocalList<ReturnEntry>("tj_returns_v1");
export const useGiftCards = () => useLocalList<GiftCard>("tj_giftcards_v1");
export const useLoyaltyLog = () => useLocalList<LoyaltyTxn>("tj_loyalty_v1");
export const usePurchaseOrders = () => useLocalList<PurchaseOrder>("tj_po_v1");
export const useBundles = () => useLocalList<ProductBundle>("tj_bundles_v1");
export const useBudgets = () => useLocalList<BudgetLine>("tj_budgets_v1");
export const useCoupons = () => useLocalList<Coupon>("tj_coupons_v1");

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Compute customer's loyalty points balance from the log. */
export function loyaltyBalance(log: LoyaltyTxn[], customerId: string): number {
  return log.filter((t) => t.customerId === customerId).reduce((s, t) => s + t.delta, 0);
}

/** Generate a random 8-char alphanumeric code (for gift cards / coupons). */
export function randomCode(prefix = "GC"): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}-${s}`;
}
