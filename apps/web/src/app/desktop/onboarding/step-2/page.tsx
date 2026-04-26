"use client";
import MobilePage from "@/app/app/onboarding/step-2/page";
export default function Wrapped() {
  return (
    <div className="max-w-[860px] mx-auto h-full border-x border-divider dark:border-divider-dark bg-bg dark:bg-bg-dark">
      <MobilePage />
    </div>
  );
}
