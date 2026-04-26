import type { Config } from "tailwindcss";

/**
 * Tijarti design tokens — ported from the HTML prototype.
 *
 * Philosophy:
 * - `primary`   = UI identity (user-customizable via ColorPicker, CSS vars)
 * - `success`   = fixed semantic green (revenue / paid / verified / positive)
 * - `warning`   = orange (debts / pending / taxes)
 * - `danger`    = red (errors / destructive / losses)
 * - `info`      = blue (informational / tech)
 * - `chart`     = warm gold (premium / AI / charts)
 *
 * NOTE: Tijarti is a neutral record-keeping tool — does NOT calculate VAT.
 * Taxes are recorded as expenses under "ضرائب ورسوم".
 */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Neutrals (base surface / text)
        bg:        { DEFAULT: "#FAF7F0", dark: "#1C1B1A" },
        surface:   { DEFAULT: "#FFFFFF", dark: "#2C2B29" },
        surface2:  { DEFAULT: "#F1EBDD", dark: "#3D3C39" },
        text:      { DEFAULT: "#1A1A1A", dark: "#F2EEE4" },
        subtext:   { DEFAULT: "#6B7280", dark: "#BFBBB1" },
        muted:     { DEFAULT: "#a89f91", dark: "#A19D94" },
        divider:   { DEFAULT: "rgba(0,0,0,0.08)", dark: "rgba(242,238,228,0.10)" },

        // Primary (dynamic via CSS variables — ColorPicker updates these)
        primary:       "rgb(var(--tj-primary) / <alpha-value>)",
        "primary-soft": "rgb(var(--tj-primary) / 0.14)",

        // Semantic (fixed)
        success:       { DEFAULT: "#0F6E56", dark: "#3fb892" },
        "success-soft": { DEFAULT: "#e3efe9", dark: "rgba(63,184,146,0.14)" },
        danger:        { DEFAULT: "#A32D2D", dark: "#e05a5a" },
        "danger-soft":  { DEFAULT: "#f5e3db", dark: "rgba(224,90,90,0.14)" },
        warning:       { DEFAULT: "#BA7517", dark: "#e39347" },
        "warning-soft": { DEFAULT: "#f7ecd7", dark: "rgba(227,147,71,0.14)" },
        info:          { DEFAULT: "#2563A6", dark: "#7aabd9" },
        "info-soft":    { DEFAULT: "#e3edf6", dark: "rgba(122,171,217,0.14)" },
        chart:         { DEFAULT: "#BA7517", dark: "#D4A15E" },
      },
      borderRadius: {
        tj: "2px", // Tijarti's signature tight radius
      },
      fontFamily: {
        ar:  ["var(--font-ibm-plex-arabic)", "Noto Sans Arabic", "SF Arabic", "Geeza Pro", "Tahoma", "sans-serif"],
        num: ["var(--font-inter)", "-apple-system", "SF Pro Text", "system-ui", "sans-serif"],
      },
      fontSize: {
        "10": ["10px", { lineHeight: "1" }],
        "11": ["11px", { lineHeight: "1" }],
        "13": ["13px", { lineHeight: "1.4" }],
      },
      keyframes: {
        slideInRTL: {
          from: { transform: "translateX(-100%)" },
          to:   { transform: "translateX(0)" },
        },
        slideOutRTL: {
          from: { transform: "translateX(0)" },
          to:   { transform: "translateX(-100%)" },
        },
        slideOutRTLBehind: {
          from: { transform: "translateX(0)", opacity: "1" },
          to:   { transform: "translateX(28%)", opacity: "0.6" },
        },
        slideInRTLBehind: {
          from: { transform: "translateX(28%)", opacity: "0.6" },
          to:   { transform: "translateX(0)", opacity: "1" },
        },
        toastIn: {
          from: { transform: "translateY(-14px)", opacity: "0" },
          to:   { transform: "translateY(0)", opacity: "1" },
        },
        numberBump: {
          "0%":   { transform: "scale(1)" },
          "40%":  { transform: "scale(1.12)" },
          "100%": { transform: "scale(1)" },
        },
        fadeIn: {
          from: { opacity: "0", transform: "translateY(6px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        pulseRing: {
          "0%":   { transform: "scale(0.95)", opacity: "0.55" },
          "100%": { transform: "scale(1.45)", opacity: "0" },
        },
        shakeX: {
          "0%,100%": { transform: "translateX(0)" },
          "20%,60%": { transform: "translateX(-6px)" },
          "40%,80%": { transform: "translateX(6px)" },
        },
      },
      animation: {
        "slide-in-rtl":         "slideInRTL 340ms cubic-bezier(.2,.8,.2,1) forwards",
        "slide-out-rtl":        "slideOutRTL 320ms cubic-bezier(.2,.8,.2,1) forwards",
        "slide-out-rtl-behind": "slideOutRTLBehind 340ms cubic-bezier(.2,.8,.2,1) forwards",
        "slide-in-rtl-behind":  "slideInRTLBehind 320ms cubic-bezier(.2,.8,.2,1) forwards",
        "toast-in":             "toastIn 260ms cubic-bezier(.2,.8,.2,1) forwards",
        "number-bump":          "numberBump 520ms cubic-bezier(.2,.8,.2,1)",
        "fade-in":              "fadeIn 240ms cubic-bezier(.2,.8,.2,1) both",
        "pulse-ring":           "pulseRing 2.2s ease-out infinite",
        "shake-x":              "shakeX 440ms cubic-bezier(.36,.07,.19,.97)",
      },
    },
  },
  plugins: [require("tailwindcss-rtl")],
};
export default config;
