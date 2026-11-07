import { getPaymentTransactions } from "@/mocks/tuition";
import { toISODate } from "@/lib/month";
import type {
  PaymentReconciliation,
  ReconciliationHistoryItem,
  ReconciliationStatus,
} from "@/types/tuition-reconciliation";

interface ReconciliationStore {
  records: Record<string, PaymentReconciliation>;
  counter: number;
}

const globalStore = globalThis as typeof globalThis & {
  __ecTuitionReconciliationStore?: ReconciliationStore;
};

function getStore(): ReconciliationStore {
  if (!globalStore.__ecTuitionReconciliationStore) {
    globalStore.__ecTuitionReconciliationStore = { records: {}, counter: 0 };
  }
  return globalStore.__ecTuitionReconciliationStore;
}

function isValidStatus(value: string): value is ReconciliationStatus {
  return value === "pending" || value === "reconciled" || value === "needs_review";
}

export async function getPaymentReconciliations(): Promise<Record<string, PaymentReconciliation>> {
  const store = getStore();
  const transactions = await getPaymentTransactions(toISODate(new Date()));
  for (const transaction of transactions) {
    if (!store.records[transaction.id]) {
      store.records[transaction.id] = {
        paymentId: transaction.id,
        status: "pending",
        note: "",
        updatedAt: "",
        updatedBy: "",
        history: [],
      };
    }
  }
  return { ...store.records };
}

export async function updatePaymentReconciliation(input: {
  paymentId: string;
  status: ReconciliationStatus;
  note: string;
  changedBy?: string;
}): Promise<{ ok: true; record: PaymentReconciliation } | { ok: false; error: string }> {
  if (!input.paymentId.trim()) return { ok: false, error: "Thiếu mã giao dịch." };
  if (!isValidStatus(input.status)) return { ok: false, error: "Trạng thái đối soát không hợp lệ." };
  const note = input.note.trim();
  if (note.length > 300) return { ok: false, error: "Ghi chú tối đa 300 ký tự." };

  const transactions = await getPaymentTransactions(toISODate(new Date()));
  if (!transactions.some((item) => item.id === input.paymentId)) {
    return { ok: false, error: "Không tìm thấy giao dịch thanh toán." };
  }

  const store = getStore();
  const previous = store.records[input.paymentId];
  store.counter += 1;
  const now = new Date().toISOString();
  const historyItem: ReconciliationHistoryItem = {
    id: `recon-${store.counter}`,
    status: input.status,
    note,
    changedAt: now,
    changedBy: input.changedBy?.trim() || "Admin",
  };
  const record: PaymentReconciliation = {
    paymentId: input.paymentId,
    status: input.status,
    note,
    updatedAt: now,
    updatedBy: historyItem.changedBy,
    history: [...(previous?.history ?? []), historyItem],
  };
  store.records[input.paymentId] = record;
  return { ok: true, record };
}
