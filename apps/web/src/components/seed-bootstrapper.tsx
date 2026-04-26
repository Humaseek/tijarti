"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store/store-context";
import { seedAllExtensions } from "@/lib/seed-extensions";

/**
 * Mounts once at the providers level. On first load (or whenever the seed
 * version changes), populates all localStorage-backed feature stores
 * with realistic Arabic seed data so the user can immediately see every
 * feature page in action.
 *
 * Idempotent — once `tj_seed_extensions_done_v1` is set with the current
 * version, this becomes a no-op.
 */
export function SeedBootstrapper() {
  const { state } = useStore();

  useEffect(() => {
    // Wait until the main store hydrates with at least some entities,
    // then seed the extensions.
    if (typeof window === "undefined") return;
    if (!state || !state.customers || state.customers.length === 0) return;
    try {
      seedAllExtensions(state);
    } catch {
      // silent fail — don't block the app
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.customers.length, state.products.length, state.suppliers.length]);

  return null;
}
