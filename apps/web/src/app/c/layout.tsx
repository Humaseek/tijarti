/**
 * Public customer portal layout — minimal, no app chrome.
 * Renders full-width so customers opening the shared link get a clean read-only view.
 */
export default function CustomerPortalLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-bg dark:bg-bg-dark font-ar" dir="rtl">{children}</div>;
}
