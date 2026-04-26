"use client";

import { useRef, useState, type ReactNode, type TouchEvent, type PointerEvent } from "react";
import { Ico } from "@/components/ui/icon";
import type { IconName } from "@/lib/icons";

/**
 * SwipeableRow — a list item that reveals quick actions when swiped.
 *
 * Swipe **left** (finger right → left, which in RTL visually moves the card
 * AWAY from the trailing side) reveals the actions panel. Swipe right (or
 * tap anywhere outside the actions) closes it.
 *
 * Works with touch events + pointer events (so mouse-drag on desktop works
 * too for testing). Uses CSS transform for buttery motion — no layout thrash.
 */

export interface SwipeAction {
  icon: IconName;
  label: string;
  /** Tailwind background class for the action pill. */
  bg: string;
  /** Tailwind text color. Default white. */
  text?: string;
  onClick: () => void;
}

interface SwipeableRowProps {
  children: ReactNode;
  /** Actions revealed on swipe. Rendered in order from leading edge inward. */
  actions: SwipeAction[];
  /** Width of each action pill in px. Default 72. */
  actionWidth?: number;
  className?: string;
}

export function SwipeableRow({ children, actions, actionWidth = 72, className = "" }: SwipeableRowProps) {
  const [offset, setOffset] = useState(0);          // current translate (negative = revealed)
  const [dragging, setDragging] = useState(false);
  const startXRef = useRef(0);
  const startOffsetRef = useRef(0);
  const rowRef = useRef<HTMLDivElement>(null);

  const revealedWidth = actions.length * actionWidth;
  const openThreshold = revealedWidth * 0.4;

  // In RTL, visual "left" swipe = translateX in the negative direction still,
  // because our layout flips but the CSS transform axis doesn't. We reveal on
  // negative offset (visually: content moves to the INLINE-START side).

  const handleStart = (clientX: number) => {
    startXRef.current = clientX;
    startOffsetRef.current = offset;
    setDragging(true);
  };

  const handleMove = (clientX: number) => {
    if (!dragging) return;
    const delta = clientX - startXRef.current;
    // In RTL: a positive pixel delta (right-moving finger) corresponds to
    // "visually moving start" → opens actions (which we render on trailing).
    // We detect RTL from the row itself.
    const dir = getComputedStyle(rowRef.current!).direction === "rtl" ? 1 : -1;
    const next = startOffsetRef.current + delta * dir;
    // Clamp: can go from -revealedWidth (fully open) to 0 (closed).
    setOffset(Math.min(0, Math.max(-revealedWidth, next)));
  };

  const handleEnd = () => {
    if (!dragging) return;
    setDragging(false);
    // Snap open or closed
    if (offset < -openThreshold) {
      setOffset(-revealedWidth);
    } else {
      setOffset(0);
    }
  };

  // Touch handlers
  const onTouchStart = (e: TouchEvent) => handleStart(e.touches[0].clientX);
  const onTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX);
  const onTouchEnd = () => handleEnd();

  // Pointer handlers (mouse + pen) — only engage after a small horizontal drag
  const pointerActiveRef = useRef(false);
  const pointerStartYRef = useRef(0);
  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    pointerStartYRef.current = e.clientY;
    pointerActiveRef.current = false;
    startXRef.current = e.clientX;
    startOffsetRef.current = offset;
  };
  const onPointerMove = (e: PointerEvent) => {
    const dx = Math.abs(e.clientX - startXRef.current);
    const dy = Math.abs(e.clientY - pointerStartYRef.current);
    if (!pointerActiveRef.current) {
      // Only engage if horizontal intent is clear (avoid fighting with page scroll)
      if (dx > 6 && dx > dy) {
        pointerActiveRef.current = true;
        setDragging(true);
      } else {
        return;
      }
    }
    handleMove(e.clientX);
  };
  const onPointerUp = () => {
    if (pointerActiveRef.current) handleEnd();
    pointerActiveRef.current = false;
  };

  const close = () => setOffset(0);

  return (
    <div
      ref={rowRef}
      className={`relative overflow-hidden rounded-tj ${className}`}
      style={{ touchAction: dragging ? "none" : "pan-y" }}
    >
      {/* Actions layer — positioned on the trailing (end) side */}
      <div
        className="absolute inset-y-0 flex items-stretch pointer-events-auto"
        style={{
          insetInlineEnd: 0,
          width: revealedWidth,
        }}
      >
        {actions.map((a, i) => (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              a.onClick();
              close();
            }}
            className={`flex flex-col items-center justify-center gap-1 ${a.bg} ${a.text ?? "text-white"} transition-opacity active:opacity-80`}
            style={{ width: actionWidth }}
          >
            <Ico name={a.icon} size={18} sw={1.8} />
            <span className="text-[9px] font-bold">{a.label}</span>
          </button>
        ))}
      </div>

      {/* Foreground content */}
      <div
        className="relative bg-surface dark:bg-surface-dark"
        style={{
          transform: `translateX(${offset}px)`,
          transition: dragging ? "none" : "transform 240ms cubic-bezier(0.16, 1, 0.3, 1)",
          willChange: "transform",
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={() => offset !== 0 && close()}
      >
        {children}
      </div>
    </div>
  );
}
