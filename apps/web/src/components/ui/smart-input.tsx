"use client";

/**
 * SmartInput — input with autocomplete suggestions drawn from existing state.
 * Pulls historical values (expense descriptions, customer notes, product names)
 * and surfaces matching ones in a dropdown under the field.
 */

import { useMemo, useRef, useState, type InputHTMLAttributes } from "react";
import { useStore } from "@/lib/store/store-context";

type EntityType = "expense_description" | "customer_note" | "product_name";

interface SmartInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  entityType: EntityType;
  value: string;
  onChange: (value: string) => void;
  /** Max number of suggestions to show. */
  maxSuggestions?: number;
}

export function SmartInput({
  entityType,
  value,
  onChange,
  maxSuggestions = 6,
  className,
  onFocus,
  onBlur,
  ...rest
}: SmartInputProps) {
  const { state } = useStore();
  const [focused, setFocused] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pool = useMemo(() => {
    const set = new Set<string>();
    if (entityType === "expense_description") {
      for (const e of state.expenses) if (e.description?.trim()) set.add(e.description.trim());
    } else if (entityType === "customer_note") {
      for (const c of state.customers) if (c.notes?.trim()) set.add(c.notes.trim());
    } else if (entityType === "product_name") {
      for (const p of state.products) if (p.name?.trim()) set.add(p.name.trim());
    }
    return Array.from(set);
  }, [entityType, state.expenses, state.customers, state.products]);

  const matches = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return pool.slice(0, maxSuggestions);
    return pool
      .filter((v) => v.toLowerCase().includes(q) && v.toLowerCase() !== q)
      .slice(0, maxSuggestions);
  }, [value, pool, maxSuggestions]);

  const show = focused && matches.length > 0;

  return (
    <div className="relative">
      <input
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => {
          setFocused(true);
          if (blurTimer.current) {
            clearTimeout(blurTimer.current);
            blurTimer.current = null;
          }
          onFocus?.(e);
        }}
        onBlur={(e) => {
          // slight delay so click on suggestion registers
          blurTimer.current = setTimeout(() => setFocused(false), 120);
          onBlur?.(e);
        }}
        className={className}
        autoComplete="off"
      />
      {show && (
        <div className="absolute top-full left-0 right-0 mt-1 z-20 bg-surface dark:bg-surface-dark border border-divider dark:border-divider-dark rounded-tj shadow-lg max-h-[240px] overflow-auto">
          {matches.map((m) => (
            <div
              key={m}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(m);
                setFocused(false);
              }}
              className="px-3 py-2 text-[12px] text-text dark:text-text-dark hover:bg-primary-soft cursor-pointer border-b border-divider dark:border-divider-dark last:border-0 truncate"
            >
              {m}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
