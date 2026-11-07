export type ReconciliationStatus = "pending" | "reconciled" | "needs_review";

export interface ReconciliationHistoryItem {
  id: string;
  status: ReconciliationStatus;
  note: string;
  changedAt: string;
  changedBy: string;
}

export interface PaymentReconciliation {
  paymentId: string;
  status: ReconciliationStatus;
  note: string;
  updatedAt: string;
  updatedBy: string;
  history: ReconciliationHistoryItem[];
}

export const RECONCILIATION_STATUS_LABEL: Record<ReconciliationStatus, string> = {
  pending: "Chưa đối soát",
  reconciled: "Đã đối soát",
  needs_review: "Cần kiểm tra",
};
