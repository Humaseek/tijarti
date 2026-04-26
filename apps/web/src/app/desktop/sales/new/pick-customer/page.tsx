"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { DesktopPage } from "@/components/shell/desktop-page";
import { Shekel, Num } from "@/components/ui/num";
import { Avatar } from "@/components/ui/avatar";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";

export default function Page() {
  const router = useRouter();
  const { state, setDraftCustomer } = useStore();
  const [q, setQ] = useState("");

  const list = useMemo(() => state.customers.filter((c) => !q.trim() || c.name.includes(q.trim())), [state.customers, q]);

  const select = (id: string) => { setDraftCustomer(id); router.push("/desktop/sales/new"); };

  return (
    <DesktopPage breadcrumb="فاتورة جديدة" backHref="/desktop/sales/new" title="اختيار زبونة">
      <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5 mb-4">
        <div className="flex items-center gap-2 px-3 py-2 bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded-tj">
          <Ico name="search" size={14} className="text-muted dark:text-muted-dark" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحثي عن زبونة..." className="flex-1 bg-transparent border-0 outline-none text-[12px] text-text dark:text-text-dark font-ar" dir="rtl" />
        </div>
      </div>

      {/* + Add new */}
      <Link href="/desktop/customers/new?select=1" className="block bg-primary-soft border-2 border-dashed border-primary rounded-tj p-4 mb-4 hover:opacity-90">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center">
            <Ico name="plus" size={18} sw={2.4} />
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-bold text-primary">إضافة زبونة جديدة</div>
            <div className="text-[11px] text-primary/80 mt-0.5">زبونة مش موجودة في القائمة</div>
          </div>
          <Ico name="chev" size={14} className="text-primary" style={{ transform: "scaleX(-1)" }} />
        </div>
      </Link>

      <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark overflow-hidden">
        {list.length === 0 ? (
          <div className="py-12 text-center text-[13px] text-muted dark:text-muted-dark">
            {q.trim() ? `لا زبونة بـ "${q}" — ممكن تضيفيها من الزر فوق` : "لا زبائن بعد — اضغطي الزر فوق"}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-bg dark:bg-bg-dark border-b border-divider dark:border-divider-dark">
                <th className="text-start px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">الاسم</th>
                <th className="text-start px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">التصنيف</th>
                <th className="text-end px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">فواتير</th>
                <th className="text-end px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">دَين</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id} onClick={() => select(c.id)} className="border-b border-divider/50 dark:border-divider-dark/50 last:border-0 hover:bg-bg dark:hover:bg-bg-dark cursor-pointer">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={c.name} initial={c.initial} size={32} bg={c.avatar_color || undefined} />
                      <span className="text-[12px] font-bold text-text dark:text-text-dark">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className={`text-[9px] font-bold px-2 py-1 rounded-tj ${c.tag === "VIP" ? "bg-warning-soft dark:bg-warning-soft-dark text-warning dark:text-warning-dark" : c.tag === "جديدة" ? "bg-info-soft dark:bg-info-soft-dark text-info dark:text-info-dark" : "bg-surface2 dark:bg-surface2-dark text-muted dark:text-muted-dark"}`}>{c.tag}</span></td>
                  <td className="px-4 py-3 text-end tj-num text-[12px] text-text dark:text-text-dark">{c.invoices}</td>
                  <td className="px-4 py-3 text-end">{c.debt > 0 ? <Shekel amt={c.debt} size={12} className="text-warning dark:text-warning-dark" weight={700} /> : <span className="text-[11px] text-muted dark:text-muted-dark">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DesktopPage>
  );
}
