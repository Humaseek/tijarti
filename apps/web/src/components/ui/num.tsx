import type { CSSProperties, ReactNode } from "react";

interface NumProps {
  children: ReactNode;
  size?: number;
  className?: string;
  weight?: number;
  style?: CSSProperties;
  /** Trigger number-bump animation (use via key change). */
  bump?: boolean;
}

/** Inter + tabular-nums, LTR. */
export function Num({ children, size = 14, className, weight = 500, style, bump }: NumProps) {
  return (
    <span
      className={`inline-block tj-num ${bump ? "animate-number-bump" : ""} ${className ?? ""}`.trim()}
      style={{
        fontSize: size,
        fontWeight: weight,
        letterSpacing: size >= 22 ? "-0.01em" : 0,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

interface ShekelProps {
  amt: number | string;
  size?: number;
  className?: string;
  weight?: number;
  bump?: boolean;
  style?: CSSProperties;
}

/**
 * Shekel — shekel amount with tabular-nums + ₪ suffix.
 * Accepts number or preformatted string.
 */
export function Shekel({ amt, size = 18, className, weight = 500, bump, style }: ShekelProps) {
  const formatted = typeof amt === "number" ? amt.toLocaleString() : amt;
  return (
    <span
      className={`inline-flex items-baseline tj-num ${bump ? "animate-number-bump" : ""} ${className ?? ""}`.trim()}
      style={{
        fontSize: size,
        fontWeight: weight,
        letterSpacing: size >= 22 ? "-0.02em" : "-0.01em",
        lineHeight: 1,
        ...style,
      }}
    >
      <span>{formatted}</span>
      <span
        style={{
          fontSize: size * 0.72,
          fontWeight: 500,
          marginInlineStart: size * 0.18,
        }}
      >
        ₪
      </span>
    </span>
  );
}
