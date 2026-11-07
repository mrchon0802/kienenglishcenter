import { Suspense } from "react";
import { connection } from "next/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { toISODate } from "@/lib/month";
import { getPaymentTransactions } from "@/mocks/tuition";
import { getPaymentReconciliations } from "@/mocks/tuition-reconciliation";
import { TransactionsView } from "./TransactionsView";

async function TransactionsContent() {
  await connection();
  const today = toISODate(new Date());
  const [transactions, reconciliations] = await Promise.all([
    getPaymentTransactions(today),
    getPaymentReconciliations(),
  ]);
  return <TransactionsView transactions={transactions} reconciliations={reconciliations} />;
}

export default function TransactionsPage() {
  return (
    <>
      <PageHeader
        title="Giao dịch thu học phí"
        subtitle="Theo dõi khoản thu và đối soát từng giao dịch"
      />
      <Suspense fallback={<p>Đang tải giao dịch...</p>}>
        <TransactionsContent />
      </Suspense>
    </>
  );
}
