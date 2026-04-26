"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Btn } from "@/components/ui/controls";
import { Ico } from "@/components/ui/icon";
import type { IconName } from "@/lib/icons";

interface Slide {
  icon: IconName;
  title: string;
  sub: string;
  tint: string;
  soft: string;
}

const SLIDES: Slide[] = [
  {
    icon: "chart",
    title: "اعرفي كم ربحتِ فعلاً",
    sub: "صورة واضحة لربحك الحقيقي — كل يوم، كل شهر. بدون وجع راس.",
    tint: "text-primary",
    soft: "bg-primary-soft",
  },
  {
    icon: "receipt",
    title: "شيكات وذمم تحت السيطرة",
    sub: "سجّلي الشيكات و\"على الحساب\" — النظام يذكّرك قبل كل استحقاق.",
    tint: "text-warning dark:text-warning-dark",
    soft: "bg-warning-soft dark:bg-warning-soft-dark",
  },
  {
    icon: "target",
    title: "قرارات مبنية على أرقام",
    sub: "اعرفي لوين بتروح مصاريفك، ووين ممكن تحسّني الربح.",
    tint: "text-success dark:text-success-dark",
    soft: "bg-success-soft dark:bg-success-soft-dark",
  },
];

export default function WelcomeCarousel() {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const isLast = idx === SLIDES.length - 1;
  const slide = SLIDES[idx];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg dark:bg-bg-dark px-6">
      <div className="w-full max-w-[400px] flex flex-col items-center">
        {/* Skip button (top-right) */}
        <div className="self-end mb-6">
          <div
            role="button"
            tabIndex={0}
            onClick={() => router.push("/login")}
            className="tj-btn text-[13px] text-muted dark:text-muted-dark font-medium"
          >
            تخطي
          </div>
        </div>

        {/* Big icon */}
        <div className={`w-24 h-24 rounded-[24px] ${slide.soft} flex items-center justify-center mb-6 animate-fade-in`}>
          <Ico name={slide.icon} size={44} className={slide.tint} sw={1.6} />
        </div>

        {/* Title + sub */}
        <div className="text-center mb-8 animate-fade-in" key={idx}>
          <h1 className="text-[22px] font-bold text-text dark:text-text-dark mb-3 leading-tight">
            {slide.title}
          </h1>
          <p className="text-[14px] text-subtext dark:text-subtext-dark leading-relaxed">
            {slide.sub}
          </p>
        </div>

        {/* Dots */}
        <div className="flex gap-2 mb-10">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              onClick={() => setIdx(i)}
              role="button"
              tabIndex={0}
              className={`tj-btn h-2 rounded-full transition-all duration-300 cursor-pointer ${
                i === idx
                  ? "w-8 bg-primary"
                  : "w-2 bg-surface2 dark:bg-surface2-dark"
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="w-full">
          {isLast ? (
            <Btn primary fullWidth onClick={() => router.push("/login")}>
              يلا نبلش
            </Btn>
          ) : (
            <Btn primary fullWidth onClick={() => setIdx(idx + 1)}>
              التالي
            </Btn>
          )}
        </div>

        <div className="text-[11px] text-muted dark:text-muted-dark mt-5 text-center">
          Tijarti — للمصالح العربية في الداخل
        </div>
      </div>
    </div>
  );
}
