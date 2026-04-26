import type { CSSProperties } from "react";
import { icons, type IconName } from "@/lib/icons";

interface IcoProps {
  name: IconName;
  size?: number;
  className?: string;
  /** Stroke width (default 1.6). */
  sw?: number;
  /** Fill — usually "none" or "currentColor". */
  fill?: string;
  style?: CSSProperties;
}

/**
 * Ico — SVG icon wrapper.
 * Color comes from currentColor, so set text-color on the parent.
 */
export function Ico({ name, size = 20, className, sw = 1.6, fill = "none", style }: IcoProps) {
  const def = icons[name];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`flex-shrink-0 ${className ?? ""}`.trim()}
      style={style}
      aria-hidden="true"
    >
      {typeof def === "string" ? <path d={def} /> : def}
    </svg>
  );
}
