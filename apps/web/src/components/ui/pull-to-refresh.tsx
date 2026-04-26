"use client";

import { useRef, useState, type ReactNode, type TouchEvent } from "react";
import { Ico } from "@/components/ui/icon";

/**
 * PullToRefresh — wraps a scrollable area and shows a spinner when the user
 * pulls down from the top. Invokes `onRefresh` which can be sync or async.
 *
 * The indicator drops into an absolutely-positioned strip above the content,
 * revealing progressively as the user drags. Past a threshold the icon flips
 * to "ready to release" state.
 */

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => void | Promise<void>;
  /** Pull distance in px required to trigger. Default 70. */
  threshold?: number;
  className?: string;
}

export function PullToRefresh({ children, onRefresh, threshold = 70, className = "" }: PullToRefreshProps) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef(0);
  const active = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const atTop = () => {
    const el = containerRef.current;
    if (!el) return false;
    // the wrapping element may not be the scroller — look at scroll on self or parent Screen
    return el.scrollTop <= 0;
  };

  const onTouchStart = (e: TouchEvent) => {
    if (refreshing) return;
    if (!atTop()) return;
    startYRef.current = e.touches[0].clientY;
    active.current = true;
  };

  const onTouchMove = (e: TouchEvent) => {
    if (!active.current) return;
    const dy = e.touches[0].clientY - startYRef.current;
    if (dy < 0) {
      active.current = false;
      setPull(0);
      return;
    }
    // Apply damping so it feels rubbery
    const damped = Math.min(120, dy * 0.55);
    setPull(damped);
  };

  const onTouchEnd = async () => {
    if (!active.current) return;
    active.current = false;
    if (pull >= threshold) {
      setRefreshing(true);
      setPull(threshold);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPull(0);
      }
    } else {
      setPull(0);
    }
  };

  const ready = pull >= threshold;

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ overflowY: "auto" }}
    >
      {/* Indicator strip */}
      <div
        className="absolute top-0 inset-x-0 flex items-center justify-center pointer-events-none z-20"
        style={{
          height: pull,
          opacity: pull > 0 ? 1 : 0,
          transition: active.current ? "none" : "height 200ms, opacity 200ms",
        }}
      >
        <div
          className="w-8 h-8 rounded-full bg-surface dark:bg-surface-dark border border-divider dark:border-divider-dark flex items-center justify-center shadow"
          style={{
            transform: `rotate(${Math.min(360, (pull / threshold) * 360)}deg)`,
            transition: refreshing ? "none" : "transform 80ms",
          }}
        >
          <Ico
            name={ready || refreshing ? "chev" : "chevDown"}
            size={15}
            className={ready ? "text-primary" : "text-muted dark:text-muted-dark"}
            sw={1.8}
            style={refreshing ? { animation: "tj-spin 900ms linear infinite" } : undefined}
          />
        </div>
      </div>

      <div style={{ transform: `translateY(${pull}px)`, transition: active.current ? "none" : "transform 200ms" }}>
        {children}
      </div>
    </div>
  );
}
