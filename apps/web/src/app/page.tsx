"use client";

import Link from "next/link";
import { useDark, usePrimary } from "./providers";

const QUICK_COLORS = [
  { name: "Teal Blue", hex: "#5B9BD5" },
  { name: "Sky Blue",  hex: "#38BDF8" },
  { name: "Ocean",     hex: "#0EA5E9" },
  { name: "Cyan",      hex: "#06B6D4" },
  { name: "Slate",     hex: "#64748B" },
  { name: "Green",     hex: "#3FB892" },
];

export default function Home() {
  const { dark, toggle } = useDark();
  const { hex, setPrimary, reset } = usePrimary();

  return (
    <main className="min-h-screen bg-bg dark:bg-bg-dark text-text dark:text-text-dark p-6" dir="rtl">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Hero */}
        <div className="text-center space-y-4 pt-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-tj bg-primary text-white text-5xl font-bold tj-num shadow-lg">
            T
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Tijarti — تجارتي</h1>
          <p className="text-subtext dark:text-subtext-dark">
            Phase 0 — Scaffold + design tokens + fonts + RTL + providers
          </p>
          <span className="inline-block text-xs font-bold tracking-wider px-3 py-1 rounded-tj bg-warning-soft dark:bg-warning-soft-dark text-warning dark:text-warning-dark">
            BETA · v0.1
          </span>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/app"
              className="tj-btn inline-flex items-center gap-2 px-6 py-3 rounded-tj bg-primary text-white font-bold shadow-lg"
            >
              📱 الموبايل ←
            </Link>
            <Link
              href="/desktop"
              className="tj-btn inline-flex items-center gap-2 px-6 py-3 rounded-tj bg-info dark:bg-info-dark text-white font-bold shadow-lg"
            >
              🖥️ الكمبيوتر ←
            </Link>
            <Link
              href="/welcome"
              className="tj-btn inline-flex items-center gap-2 px-5 py-3 rounded-tj bg-surface2 dark:bg-surface2-dark text-text dark:text-text-dark font-semibold"
            >
              Welcome
            </Link>
            <Link
              href="/login"
              className="tj-btn inline-flex items-center gap-2 px-5 py-3 rounded-tj bg-surface2 dark:bg-surface2-dark text-text dark:text-text-dark font-semibold"
            >
              Auth
            </Link>
            <Link
              href="/app/onboarding/step-1"
              className="tj-btn inline-flex items-center gap-2 px-5 py-3 rounded-tj bg-surface2 dark:bg-surface2-dark text-text dark:text-text-dark font-semibold"
            >
              Onboarding
            </Link>
          </div>
        </div>

        {/* Design tokens preview */}
        <section className="bg-surface dark:bg-surface-dark border border-divider dark:border-divider-dark rounded-tj p-5 space-y-4">
          <h2 className="text-sm font-semibold text-subtext dark:text-subtext-dark uppercase tracking-wider">
            Palette
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Chip label="Primary" className="bg-primary text-white" />
            <Chip label="Success" className="bg-success dark:bg-success-dark text-white" />
            <Chip label="Warning" className="bg-warning dark:bg-warning-dark text-white" />
            <Chip label="Danger"  className="bg-danger dark:bg-danger-dark text-white" />
            <Chip label="Info"    className="bg-info dark:bg-info-dark text-white" />
            <Chip label="Chart"   className="bg-chart dark:bg-chart-dark text-white" />
            <Chip label="Surface" className="bg-surface2 dark:bg-surface2-dark text-text dark:text-text-dark border border-divider dark:border-divider-dark" />
            <Chip label="Text"    className="bg-text dark:bg-text-dark text-bg dark:text-bg-dark" />
          </div>
        </section>

        {/* Dark mode toggle */}
        <section className="bg-surface dark:bg-surface-dark border border-divider dark:border-divider-dark rounded-tj p-5 flex items-center justify-between">
          <div>
            <div className="font-semibold">الوضع الداكن</div>
            <div className="text-xs text-muted dark:text-muted-dark mt-1">
              {dark ? "داكن — مريح في الليل" : "فاتح — مريح في النهار"}
            </div>
          </div>
          <button
            onClick={toggle}
            className="tj-btn px-4 py-2 rounded-tj bg-primary text-white font-semibold"
          >
            {dark ? "☀ فاتح" : "☾ داكن"}
          </button>
        </section>

        {/* Primary color picker */}
        <section className="bg-surface dark:bg-surface-dark border border-divider dark:border-divider-dark rounded-tj p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">🎨 اللون الأساسي</div>
              <div className="text-xs text-muted dark:text-muted-dark mt-1 tj-num">
                {hex.toUpperCase()}
              </div>
            </div>
            <div className="w-10 h-10 rounded-tj bg-primary border-2 border-divider dark:border-divider-dark" />
          </div>

          <div className="grid grid-cols-6 gap-2">
            {QUICK_COLORS.map((c) => {
              const active = c.hex.toLowerCase() === hex.toLowerCase();
              return (
                <button
                  key={c.hex}
                  onClick={() => setPrimary(c.hex)}
                  title={c.name}
                  className="aspect-square rounded-tj transition-transform hover:scale-110 active:scale-95"
                  style={{
                    background: c.hex,
                    outline: active ? `2px solid ${dark ? "#F2EEE4" : "#1A1A1A"}` : "none",
                    outlineOffset: active ? "2px" : "0",
                  }}
                />
              );
            })}
          </div>

          <input
            type="color"
            value={hex}
            onChange={(e) => setPrimary(e.target.value)}
            className="w-full h-10 rounded-tj border border-divider dark:border-divider-dark cursor-pointer bg-transparent"
          />

          <button
            onClick={reset}
            className="tj-btn text-xs w-full py-2 rounded-tj bg-surface2 dark:bg-surface2-dark text-subtext dark:text-subtext-dark"
          >
            ↻ استعادة الافتراضي (Teal Blue)
          </button>
        </section>

        {/* Typography */}
        <section className="bg-surface dark:bg-surface-dark border border-divider dark:border-divider-dark rounded-tj p-5 space-y-3">
          <h2 className="text-sm font-semibold text-subtext dark:text-subtext-dark uppercase tracking-wider">
            Typography
          </h2>
          <div className="text-2xl font-bold">بوتيك ليلى — الناصرة</div>
          <div className="text-base">IBM Plex Sans Arabic · خط عربي احترافي</div>
          <div className="tj-num text-3xl font-bold text-success dark:text-success-dark">
            68,500 <span className="text-base opacity-70">₪</span>
          </div>
          <div className="text-xs text-muted dark:text-muted-dark">Inter + tabular-nums للأرقام</div>
        </section>

        {/* Phase roadmap */}
        <section className="bg-surface dark:bg-surface-dark border border-divider dark:border-divider-dark rounded-tj p-5">
          <h2 className="text-sm font-semibold text-subtext dark:text-subtext-dark uppercase tracking-wider mb-3">
            Phases
          </h2>
          <ul className="space-y-2 text-sm">
            <Phase done>0 — Scaffold + tokens + RTL + providers</Phase>
            <Phase done>1 — UI primitives + Shell + TabBar + SmartFab</Phase>
            <Phase done>2 — Home + Sale flow (5 screens)</Phase>
            <Phase done>3 — CRUD + Lists</Phase>
            <Phase done>4 — Debts + Expenses</Phase>
            <Phase done>5 — Settings + Help/About</Phase>
            <Phase done>6 — Auth + Onboarding</Phase>
            <Phase>7 — Coming Soon</Phase>
            <Phase>8 — Supabase integration (later)</Phase>
          </ul>
        </section>

        <div className="text-center text-xs text-muted dark:text-muted-dark pb-8">
          Next.js 14 · Tailwind · RTL · <span className="tj-num">2026</span>
        </div>
      </div>
    </main>
  );
}

function Chip({ label, className }: { label: string; className: string }) {
  return (
    <div className={`rounded-tj px-3 py-2 text-xs font-semibold text-center ${className}`}>
      {label}
    </div>
  );
}

function Phase({ done, children }: { done?: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3">
      <span
        className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold flex-shrink-0 ${
          done
            ? "bg-success dark:bg-success-dark text-white"
            : "bg-surface2 dark:bg-surface2-dark text-muted dark:text-muted-dark border border-divider dark:border-divider-dark"
        }`}
      >
        {done ? "✓" : "·"}
      </span>
      <span className={done ? "text-text dark:text-text-dark" : "text-subtext dark:text-subtext-dark"}>
        {children}
      </span>
    </li>
  );
}
