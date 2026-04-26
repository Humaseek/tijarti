"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ar" dir="rtl">
      <body style={{ fontFamily: "system-ui", padding: 40, textAlign: "center" }}>
        <h1 style={{ fontSize: 22, marginBottom: 12 }}>حدث خطأ غير متوقّع</h1>
        <p style={{ fontSize: 14, color: "#666", marginBottom: 20 }}>
          حاول إعادة تحميل الصفحة. إذا استمرت المشكلة، تحقّقي من اتصال الإنترنت.
        </p>
        <button
          onClick={reset}
          style={{ padding: "10px 20px", background: "#0F6E56", color: "#fff", border: 0, borderRadius: 8, fontWeight: 700, cursor: "pointer" }}
        >
          إعادة المحاولة
        </button>
      </body>
    </html>
  );
}
