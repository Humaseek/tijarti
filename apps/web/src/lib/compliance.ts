/**
 * Compliance checklist — list of items for legal/record-keeping hygiene.
 */

export interface ComplianceItem {
  id: string;
  title: string;
  description: string;
  category: "records" | "legal" | "tax" | "backup";
}

export const COMPLIANCE_ITEMS: ComplianceItem[] = [
  { id: "invoice_archive",    title: "أرشيف فواتير كامل",              description: "كل الفواتير محفوظة بترتيب يوم/شهر/سنة",              category: "records" },
  { id: "check_log",          title: "سجل مدفوعات شيكات",                description: "كل الشيكات (واردة وصادرة) مسجلة بتواريخ صرفها",     category: "records" },
  { id: "expense_log",        title: "سجل مصاريف منتظم",                 description: "مصاريف يومية مسجلة مع إيصالات",                     category: "records" },
  { id: "supplier_contracts", title: "عقود مع موردين رئيسيين",           description: "عقد مكتوب مع كل مورد رئيسي",                        category: "legal" },
  { id: "business_license",   title: "رخصة مصلحة سارية",                  description: "الرخصة الأساسية سارية المفعول",                      category: "legal" },
  { id: "vat_registration",   title: "تسجيل ضريبة القيمة المضافة",        description: "مسجلة عوسك/عوسك مرشة حسب الحاجة",                  category: "tax" },
  { id: "tax_payments",       title: "دفعات ضريبية محدّثة",               description: "مقدمات ومدفوعات محاسب/ضرائب سارية",                 category: "tax" },
  { id: "bookkeeping",        title: "محاسبة شهرية منتظمة",              description: "محاسبية مع محاسب أو برنامج كل شهر",                category: "tax" },
  { id: "customer_data",      title: "قاعدة بيانات زبائن محدّثة",         description: "أسماء، هواتف، ملاحظات",                              category: "records" },
  { id: "product_data",       title: "قاعدة بيانات منتجات محدّثة",       description: "أسعار، كميات، باركود",                              category: "records" },
  { id: "backup_weekly",      title: "نسخة احتياطية أسبوعية",             description: "تصدير البيانات كل أسبوع",                           category: "backup" },
  { id: "backup_cloud",       title: "نسخة احتياطية سحابية",              description: "نسخة احتياطية خارج الجهاز",                         category: "backup" },
  { id: "receipts_scanned",   title: "إيصالات ممسوحة",                    description: "صور لجميع إيصالات المصاريف",                        category: "records" },
  { id: "insurance",          title: "تأمين المحل",                        description: "تأمين ضد الحريق والسرقة",                           category: "legal" },
  { id: "employee_contracts", title: "عقود موظفين (إن وُجدوا)",           description: "كل موظف معه عقد مكتوب",                             category: "legal" },
  { id: "salary_records",     title: "سجلات رواتب",                        description: "رواتب مدفوعة موثّقة",                                category: "records" },
  { id: "bank_statements",    title: "كشوفات بنكية محفوظة",              description: "كشوفات بنكية آخر 12 شهر",                           category: "records" },
  { id: "health_permits",     title: "تصاريح صحية (إن تطلّب)",            description: "للمحلات الغذائية/الصحية",                           category: "legal" },
  { id: "privacy_policy",     title: "سياسة خصوصية للزبائن",             description: "توضّح كيفية استخدام بيانات الزبائن",                category: "legal" },
  { id: "annual_review",      title: "مراجعة سنوية للأرقام",             description: "مراجعة مالية سنوية مع محاسب",                       category: "tax" },
];
