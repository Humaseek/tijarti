/**
 * Print route layout — deliberately minimal. No sidebar, no tab bar, no shell.
 * Pages under /print/* render on a plain white A4-friendly page so they can
 * be printed or saved as PDF directly from the browser.
 */
export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-black" dir="rtl">
      {children}
    </div>
  );
}
