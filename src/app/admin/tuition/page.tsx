import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { toISODate } from "@/lib/month";
import { getInvoiceViews } from "@/mocks/tuition";
import { InvoicesView } from "./_components/InvoicesView";

export const metadata: Metadata = { title: "Học phí & công nợ | Quản trị" };

async function InvoicesContent() {
  await connection(); // dữ liệu thay đổi mỗi khi ghi nhận thanh toán
  const today = toISODate(new Date());
  const currentMonth = today.slice(0, 7);
  const invoices = await getInvoiceViews(today);
  const months = [...new Set([currentMonth, ...invoices.map((v) => v.month)])].sort().reverse();

  return <InvoicesView invoices={invoices} months={months} currentMonth={currentMonth} />;
}

export default function TuitionPage() {
  return (
    <>
      <PageHeader title="Học phí & công nợ" subtitle="Hóa đơn theo tháng, thu tiền và theo dõi ai còn nợ · Dữ liệu mẫu" />
      <Suspense fallback={<p>Đang tải hóa đơn...</p>}>
        <InvoicesContent />
      </Suspense>
    </>
  );
}
