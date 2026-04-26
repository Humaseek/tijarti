"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  TIJARTI_PRIMARY_DEFAULT_HEX,
  PRIMARY_STORAGE_KEY,
  parseHex,
  rgbToCssVar,
  rgbToHex,
  type Rgb,
} from "@/lib/theme/color";
import { ToastProvider } from "@/components/ui/toast";
import { StoreProvider } from "@/lib/store/store-context";
import { PwaRegister } from "@/components/pwa-register";
import { CelebrationHost } from "@/components/ui/confetti";
import { SeedBootstrapper } from "@/components/seed-bootstrapper";

// ─── Dark mode ───────────────────────────────────────────────────────────────
const DARK_KEY = "tijarti_dark";

interface DarkCtx {
  dark: boolean;
  toggle: () => void;
}

const DarkContext = createContext<DarkCtx | null>(null);

export function useDark(): DarkCtx {
  const ctx = useContext(DarkContext);
  if (!ctx) throw new Error("useDark must be used within <Providers>");
  return ctx;
}

// ─── Primary color ───────────────────────────────────────────────────────────
interface PrimaryCtx {
  hex: string;
  setPrimary: (hex: string) => void;
  reset: () => void;
}

const PrimaryContext = createContext<PrimaryCtx | null>(null);

export function usePrimary(): PrimaryCtx {
  const ctx = useContext(PrimaryContext);
  if (!ctx) throw new Error("usePrimary must be used within <Providers>");
  return ctx;
}

// Apply primary color to the CSS variable on :root
function applyPrimary(rgb: Rgb) {
  if (typeof document === "undefined") return;
  document.documentElement.style.setProperty("--tj-primary", rgbToCssVar(rgb));
}

// ─── Root Providers ──────────────────────────────────────────────────────────
export function Providers({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState<boolean>(false);
  const [hex, setHex] = useState<string>(TIJARTI_PRIMARY_DEFAULT_HEX);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const savedDark = localStorage.getItem(DARK_KEY);
      if (savedDark === "1") {
        setDark(true);
        document.documentElement.classList.add("dark");
      }
      const savedHex = localStorage.getItem(PRIMARY_STORAGE_KEY);
      const parsed = savedHex && parseHex(savedHex);
      if (parsed) {
        setHex(rgbToHex(parsed));
        applyPrimary(parsed);
      } else {
        const defaultRgb = parseHex(TIJARTI_PRIMARY_DEFAULT_HEX);
        if (defaultRgb) applyPrimary(defaultRgb);
      }
    } catch {
      // localStorage blocked — use defaults
      const defaultRgb = parseHex(TIJARTI_PRIMARY_DEFAULT_HEX);
      if (defaultRgb) applyPrimary(defaultRgb);
    }
  }, []);

  const toggleDark = () => {
    setDark((prev) => {
      const next = !prev;
      if (next) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
      try {
        localStorage.setItem(DARK_KEY, next ? "1" : "0");
      } catch {}
      return next;
    });
  };

  const setPrimary = (input: string) => {
    const rgb = parseHex(input);
    if (!rgb) return;
    applyPrimary(rgb);
    setHex(rgbToHex(rgb));
    try {
      localStorage.setItem(PRIMARY_STORAGE_KEY, rgbToHex(rgb));
    } catch {}
  };

  const reset = () => setPrimary(TIJARTI_PRIMARY_DEFAULT_HEX);

  return (
    <DarkContext.Provider value={{ dark, toggle: toggleDark }}>
      <PrimaryContext.Provider value={{ hex, setPrimary, reset }}>
        <ToastProvider>
          <StoreProvider>
            <SeedBootstrapper />
            {children}
            <CelebrationHost />
          </StoreProvider>
          <PwaRegister />
        </ToastProvider>
      </PrimaryContext.Provider>
    </DarkContext.Provider>
  );
}
