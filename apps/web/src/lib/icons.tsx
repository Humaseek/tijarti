import type { ReactNode } from "react";

/**
 * Icon dictionary — ported from the HTML prototype.
 * Each value is either a `d` string (single path) or JSX of sub-elements
 * rendered inside an SVG by the <Ico /> component.
 */
export type IconDef = string | ReactNode;

export const icons: Record<string, IconDef> = {
  forward: "M9 6l6 6-6 6",
  back:    "M15 6l-6 6 6 6",
  chev:    "M9 18l6-6-6-6",
  chevDown:"M6 9l6 6 6-6",
  chevUp:  "M18 15l-6-6-6 6",
  plus:    "M12 5v14M5 12h14",
  minus:   "M5 12h14",
  close:   "M6 6l12 12M18 6L6 18",
  check:   "M5 12l5 5L20 7",
  search:  <><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></>,
  home:    "M4 11l8-7 8 7v9h-5v-6H9v6H4z",
  card:    <><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/></>,
  users:   <><circle cx="9" cy="8" r="3"/><path d="M3 20c1-3 3.5-5 6-5s5 2 6 5"/><circle cx="17" cy="7" r="2.5"/><path d="M15 15c1-2 3-3 5-3"/></>,
  chart:   <><path d="M4 20V8M10 20v-6M16 20V4M22 20H2"/></>,
  dots:    <><circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/></>,
  bell:    <><path d="M18 16H6l2-3V9a4 4 0 018 0v4z"/><path d="M10 19a2 2 0 004 0"/></>,
  store:   <><path d="M4 9l2-5h12l2 5"/><path d="M4 9v11h16V9"/><path d="M9 20v-6h6v6"/></>,
  box:     <><path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/></>,
  user:    <><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6"/></>,
  phone:   "M5 4h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a1 1 0 0 1-1 1A17 17 0 0 1 4 5a1 1 0 0 1 1-1z",
  msg:     "M4 5h16v12H8l-4 4z",
  money:   <><circle cx="12" cy="12" r="9"/><text x="12" y="16" fontSize="11" textAnchor="middle" fontFamily="serif" fontWeight="bold" fill="currentColor" stroke="none">₪</text></>,
  calendar:<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></>,
  tag:     "M3 12V5a2 2 0 012-2h7l9 9-9 9z",
  trash:   <><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></>,
  edit:    "M15 4l5 5-11 11H4v-5z",
  lightbulb:<><path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 00-4 10c1 1 1 2 1 3h6c0-1 0-2 1-3a6 6 0 00-4-10z"/></>,
  camera:  <><rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="12" cy="13.5" r="4"/><path d="M8 7l2-3h4l2 3"/></>,
  download:<><path d="M12 4v12M6 10l6 6 6-6"/><path d="M4 20h16"/></>,
  share:   <><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8 11l8-4M8 13l8 4"/></>,
  filter:  "M3 5h18l-7 8v6l-4-2v-4z",
  star:    "M12 3l2.5 6 6.5.5-5 4.5 1.5 6.5L12 17l-5.5 3.5L8 14l-5-4.5 6.5-.5z",
  settings:<><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></>,
  receipt: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h4"/></>,
  trendUp: "M3 17l6-6 4 4 8-8",
  clock:   <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  target:  <><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1" fill="currentColor"/></>,
  warn:    <><path d="M12 3l10 18H2z"/><path d="M12 10v5" fill="none"/><circle cx="12" cy="17.5" r="0.8" fill="currentColor"/></>,
  info:    <><circle cx="12" cy="12" r="9"/><path d="M12 10v6" fill="none"/><circle cx="12" cy="7.5" r="0.8" fill="currentColor"/></>,
  zap:     "M13 3L4 14h7l-1 7 9-11h-7l1-7z",
  truck:   <><rect x="1" y="7" width="13" height="10" rx="1"/><path d="M14 10h4l3 3v4h-7z"/><circle cx="6" cy="19" r="2"/><circle cx="17" cy="19" r="2"/></>,
  tool:    "M14 6l3.5-3.5a5 5 0 00-5 7L4 18l2 2 8.5-8.5a5 5 0 007-5L18 10l-4-4z",
  minusCircle:<><circle cx="12" cy="12" r="9"/><path d="M8 12h8"/></>,
  mic:     <><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3M8 21h8"/></>,
  ai:      <><path d="M12 3l2 4 4 2-4 2-2 4-2-4-4-2 4-2z"/><path d="M19 14l1 2 2 1-2 1-1 2-1-2-2-1 2-1z"/></>,
  lock:    <><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></>,
  mail:    <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></>,
  shield:  "M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z",
  logout:  <><path d="M14 8V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h7a2 2 0 002-2v-3"/><path d="M21 12H9M17 8l4 4-4 4"/></>,
  globe:   <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/></>,
  help:    <><circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 016 0c0 2-3 2-3 4"/><circle cx="12" cy="17" r="0.8" fill="currentColor"/></>,
  whatsapp:"M20 12a8 8 0 11-14.5 4.5L4 20l3.5-1.5A8 8 0 0120 12z",
  userPlus:<><circle cx="9" cy="8" r="4"/><path d="M1 21c1.5-4 5-6 8-6c1 0 2 0.1 3 0.35"/><path d="M19 11v6M16 14h6"/></>,
};

export type IconName = keyof typeof icons;
