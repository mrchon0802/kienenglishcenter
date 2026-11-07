import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { toISODate } from "@/lib/month";
import { getInvoiceViews } from "@/mocks/tuition";
import { DebtReport } from "./DebtReport";

export const metadata: Metadata = {
  title: "Báo cáo công nợ | Quản trị",
};

async function DebtReportContent() {
  await connection();
  const today = toISODate(new Date());
  const invoices = await getInvoiceViews(today);
  return <DebtReport today={today} invoices={invoices} />;
}

export default function DebtReportPage() {
  return (
    <>
      <PageHeader
        title="Báo cáo công nợ"
        subtitle="Theo dõi số dư học phí còn phải thu và mức độ quá hạn theo hóa đơn"
      />
      <Suspense fallback={<p>Đang tải báo cáo công nợ...</p>}>
        <DebtReportContent />
      </Suspense>
    </>
  );
}
