"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Ico } from "./icon";
import { Row } from "./layout";

interface TopBarProps {
  title: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  /** Hide the back chevron even if there's history. */
  noBack?: boolean;
  /** Custom back handler — default uses router.back(). */
  onBack?: () => void;
}

export function TopBar({ title, leading, trailing, noBack, onBack }: TopBarProps) {
  const router = useRouter();
  const handleBack = onBack ?? (() => router.back());
  return (
    <div className="flex items-center justify-between gap-2 px-4 pt-1 pb-3.5">
      <Row className="gap-2.5 min-w-[40px]">
        {leading || (!noBack ? (
          <div className="tj-btn text-primary" onClick={handleBack} role="button" aria-label="رجوع" tabIndex={0}>
            <Ico name="forward" size={22} />
          </div>
        ) : <div style={{ width: 22 }} />)}
      </Row>
      <div className="flex-1 text-center text-base font-semibold text-text dark:text-text-dark">
        {title}
      </div>
      <Row className="gap-3.5 min-w-[40px] justify-end">{trailing}</Row>
    </div>
  );
}
