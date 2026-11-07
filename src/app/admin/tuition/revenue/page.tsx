import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { toISODate } from "@/lib/month";
import {
  getInvoiceViews,
  getPaymentTransactions,
} from "@/mocks/tuition";
import { getPaymentReconciliations } from "@/mocks/tuition-reconciliation";
import { TuitionRevenueReport } from "./TuitionRevenueReport";

export const metadata: Metadata = {
  title: "Báo cáo thu học phí | Quản trị",
};

async function RevenueReportContent() {
  await connection();
  const today = toISODate(new Date());

  const [invoices, transactions, reconciliations] = await Promise.all([
    getInvoiceViews(today),
    getPaymentTransactions(today),
    getPaymentReconciliations(),
  ]);

  return (
    <TuitionRevenueReport
      today={today}
      invoices={invoices}
      transactions={transactions}
      reconciliations={reconciliations}
    />
  );
}

export default function RevenuePage() {
  return (
    <>
      <PageHeader
        title="Báo cáo thu học phí"
        subtitle="Theo dõi số phải thu, thực thu, công nợ và tình hình đối soát"
      />
      <Suspense fallback={<p>Đang tổng hợp báo cáo...</p>}>
        <RevenueReportContent />
      </Suspense>
    </>
  );
}
