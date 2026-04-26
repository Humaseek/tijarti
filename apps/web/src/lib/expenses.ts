import type { ExpenseCategory } from "./store/types";
import type { IconName } from "./icons";

/**
 * Per-category UI tokens — icon + tint class + soft background class.
 *
 * Note: Tijarti doesn't compute VAT. "ضرائب ورسوم" here is simply a category
 * for expenses the user paid to tax authorities — stored like any other expense.
 */
export interface CatMeta {
  icon: IconName;
  tint: string;   // Tailwind text/color class (light + dark via `dark:`)
  soft: string;   // Tailwind bg class (light + dark)
  border: string; // Tailwind border class (light + dark)
}

export function catMeta(category: ExpenseCategory): CatMeta {
  switch (category) {
    case "إيجار":
      return {
        icon: "home",
        tint: "text-success dark:text-success-dark",
        soft: "bg-success-soft dark:bg-success-soft-dark",
        border: "border-success dark:border-success-dark",
      };
    case "كهرباء":
      return {
        icon: "zap",
        tint: "text-warning dark:text-warning-dark",
        soft: "bg-warning-soft dark:bg-warning-soft-dark",
        border: "border-warning dark:border-warning-dark",
      };
    case "اتصالات":
      return {
        icon: "phone",
        tint: "text-info dark:text-info-dark",
        soft: "bg-info-soft dark:bg-info-soft-dark",
        border: "border-info dark:border-info-dark",
      };
    case "مواصلات":
      return {
        icon: "truck",
        tint: "text-chart dark:text-chart-dark",
        soft: "bg-warning-soft dark:bg-warning-soft-dark",
        border: "border-chart dark:border-chart-dark",
      };
    case "صيانة":
      return {
        icon: "tool",
        tint: "text-danger dark:text-danger-dark",
        soft: "bg-danger-soft dark:bg-danger-soft-dark",
        border: "border-danger dark:border-danger-dark",
      };
    case "رواتب":
      return {
        icon: "users",
        tint: "text-info dark:text-info-dark",
        soft: "bg-info-soft dark:bg-info-soft-dark",
        border: "border-info dark:border-info-dark",
      };
    case "ضرائب ورسوم":
      return {
        icon: "shield",
        tint: "text-warning dark:text-warning-dark",
        soft: "bg-warning-soft dark:bg-warning-soft-dark",
        border: "border-warning dark:border-warning-dark",
      };
    case "قروض وتقسيط":
      return {
        icon: "card",
        tint: "text-danger dark:text-danger-dark",
        soft: "bg-danger-soft dark:bg-danger-soft-dark",
        border: "border-danger dark:border-danger-dark",
      };
    case "أخرى":
    default:
      return {
        icon: "dots",
        tint: "text-muted dark:text-muted-dark",
        soft: "bg-surface2 dark:bg-surface2-dark",
        border: "border-divider dark:border-divider-dark",
      };
  }
}
