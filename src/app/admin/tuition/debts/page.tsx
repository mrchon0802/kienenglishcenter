import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { toISODate } from "@/lib/month";
import { getDebtors } from "@/mocks/tuition";
import { DebtsView } from "../_components/DebtsView";

export const metadata: Metadata = { title: "Công nợ | Quản trị" };

async function DebtsContent() {
  await connection();
  const debtors = await getDebtors(toISODate(new Date()));
  return <DebtsView debtors={debtors} />;
}

export default function DebtsPage() {
  return (
    <>
      <PageHeader title="Công nợ" subtitle="Những học sinh còn nợ học phí · Dữ liệu mẫu" />
      <Suspense fallback={<p>Đang tải công nợ...</p>}>
        <DebtsContent />
      </Suspense>
    </>
  );
}
