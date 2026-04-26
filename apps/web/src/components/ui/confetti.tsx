"use client";

/**
 * Confetti — lightweight SVG-based celebration overlay.
 * No deps. Renders a fixed overlay that auto-dismisses after ~2s.
 *
 * Usage:
 *   fireCelebration(); // anywhere — shows confetti once
 *   <CelebrationHost /> // place once near the app root to enable fireCelebration()
 *   useCelebrationTrigger(); // optional — watches store for milestones
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/lib/store/store-context";
import { lsRead, lsWrite } from "@/lib/local-storage";

const COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#6366f1", "#a855f7", "#ec4899",
];

type FireFn = () => void;
let GLOBAL_FIRE: FireFn | null = null;

export function fireCelebration(): void {
  if (GLOBAL_FIRE) GLOBAL_FIRE();
}

interface Piece {
  id: number;
  left: number;  // %
  delay: number; // s
  duration: number; // s
  rotate: number;  // deg
  color: string;
  size: number;
  shape: "square" | "circle" | "triangle";
}

export function CelebrationHost() {
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [active, setActive] = useState(false);
  const idRef = useRef(0);

  useEffect(() => {
    GLOBAL_FIRE = () => {
      const prefs = lsRead<{ animations?: boolean; sound?: boolean }>("tj_preferences_v1", {});
      if (prefs.animations === false) return;
      const next: Piece[] = [];
      for (let i = 0; i < 60; i++) {
        next.push({
          id: ++idRef.current,
          left: Math.random() * 100,
          delay: Math.random() * 0.4,
          duration: 1.4 + Math.random() * 0.8,
          rotate: Math.random() * 360,
          color: COLORS[i % COLORS.length],
          size: 6 + Math.random() * 8,
          shape: (["square", "circle", "triangle"] as const)[i % 3],
        });
      }
      setPieces(next);
      setActive(true);
      // sound (if enabled and available)
      if (prefs.sound) {
        try {
          // simple browser beep via AudioContext
          const AC = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext
            ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
          if (AC) {
            const ctx = new AC();
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.connect(g); g.connect(ctx.destination);
            o.type = "sine"; o.frequency.value = 880;
            g.gain.setValueAtTime(0.1, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
            o.start(); o.stop(ctx.currentTime + 0.5);
          }
        } catch {
          // ignore
        }
      }
      setTimeout(() => setActive(false), 2200);
    };
    return () => {
      GLOBAL_FIRE = null;
    };
  }, []);

  if (!active || pieces.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            position: "absolute",
            top: "-5%",
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.shape === "triangle" ? "transparent" : p.color,
            borderRadius: p.shape === "circle" ? "50%" : p.shape === "square" ? 2 : 0,
            borderLeft: p.shape === "triangle" ? `${p.size / 2}px solid transparent` : undefined,
            borderRight: p.shape === "triangle" ? `${p.size / 2}px solid transparent` : undefined,
            borderBottom: p.shape === "triangle" ? `${p.size}px solid ${p.color}` : undefined,
            animation: `tj-confetti ${p.duration}s ${p.delay}s cubic-bezier(0.1,0.8,0.5,1) forwards`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes tj-confetti {
          0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0.2; }
        }
      `}</style>
    </div>
  );
}

/**
 * Watches store for milestones and auto-fires celebrations once.
 * Uses localStorage to dedupe.
 */
export function useCelebrationTrigger() {
  const { state } = useStore();
  const invoiceCount = state.invoices.length;
  const totalRevenue = useMemo(
    () => state.invoices.reduce((s, i) => s + i.total, 0),
    [state.invoices]
  );

  useEffect(() => {
    const seen = lsRead<Record<string, boolean>>("tj_celebrations_v1", {});
    const mark = (key: string) => {
      if (seen[key]) return;
      seen[key] = true;
      lsWrite("tj_celebrations_v1", seen);
      fireCelebration();
    };
    if (invoiceCount >= 1) mark("first_invoice");
    if (invoiceCount >= 100) mark("100_invoices");
    if (invoiceCount >= 500) mark("500_invoices");
    if (totalRevenue >= 1_000_000) mark("1m_revenue");
    // goals reached
    for (const g of state.goals) {
      if (g.status === "achieved") mark(`goal_${g.id}`);
    }
  }, [invoiceCount, totalRevenue, state.goals]);
}
