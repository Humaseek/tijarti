/**
 * Auth layout — full-screen (outside iPhone frame).
 *
 * The dim backdrop of the landing showcase doesn't apply here;
 * we render with the app's theme-aware background + subtle radial primary glow.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main
      dir="rtl"
      className="min-h-screen bg-bg dark:bg-bg-dark font-ar text-text dark:text-text-dark overflow-auto"
      style={{
        backgroundImage:
          "radial-gradient(circle at 50% -10%, rgb(var(--tj-primary) / 0.10), transparent 55%)",
      }}
    >
      <div className="min-h-screen flex flex-col items-center px-5 py-6">
        <div className="w-full max-w-[420px] animate-fade-in">{children}</div>
      </div>
    </main>
  );
}
