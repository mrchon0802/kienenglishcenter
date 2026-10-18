"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { formatVND } from "@/lib/format";
import { METHOD_OPTIONS } from "@/lib/tuition";
import type { PaymentMethod } from "@/types/tuition";
import { recordPaymentAction } from "../../actions";
import styles from "./PaymentForm.module.css";

interface PaymentFormProps {
  invoiceId: string;
  remaining: number;
  today: string; // "yyyy-mm-dd"
}

/** Dùng `key={remaining}` ở trang cha để form tự làm mới sau mỗi lần ghi nhận. */
export function PaymentForm({ invoiceId, remaining, today }: PaymentFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [amount, setAmount] = useState(String(remaining));
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [paidAt, setPaidAt] = useState(today);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return setError("Nhập số tiền lớn hơn 0.");
    if (value > remaining) return setError(`Số tiền không được vượt quá ${formatVND(remaining)}.`);
    if (!paidAt) return setError("Chọn ngày thu.");
    setError("");

    startTransition(async () => {
      const res = await recordPaymentAction({ invoiceId, amount: value, method, paidAt, note });
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.fields}>
        <Input
          label="Số tiền thu (đ)"
          type="number"
          min={1000}
          step={1000}
          max={remaining}
          value={amount}
          hint={`Còn phải đóng: ${formatVND(remaining)}`}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Select label="Hình thức" value={method} options={METHOD_OPTIONS} onChange={(e) => setMethod(e.target.value as PaymentMethod)} />
        <Input label="Ngày thu" type="date" max={today} value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
        <Input label="Ghi chú (không bắt buộc)" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <div className={styles.actions}>
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Đang lưu..." : "Ghi nhận thanh toán"}
        </Button>
        <Button onClick={() => setAmount(String(remaining))}>Thu đủ {formatVND(remaining)}</Button>
        {error ? (
          <span className={styles.error} role="alert">
            {error}
          </span>
        ) : null}
      </div>
    </form>
  );
}
