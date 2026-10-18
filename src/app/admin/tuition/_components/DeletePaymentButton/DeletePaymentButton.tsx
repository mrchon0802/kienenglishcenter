"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { deletePaymentAction } from "../../actions";
import styles from "./DeletePaymentButton.module.css";

export function DeletePaymentButton({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      const res = await deletePaymentAction(paymentId);
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  }

  if (!confirming) {
    return <Button onClick={() => setConfirming(true)}>Xóa</Button>;
  }
  return (
    <span className={styles.wrap}>
      <span className={styles.text}>Xóa khoản thu này?</span>
      <Button variant="primary" onClick={remove} disabled={pending}>
        {pending ? "Đang xóa..." : "Xóa"}
      </Button>
      <Button onClick={() => setConfirming(false)} disabled={pending}>
        Hủy
      </Button>
      {error ? <span className={styles.error} role="alert">{error}</span> : null}
    </span>
  );
}
