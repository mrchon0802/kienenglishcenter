import { Card } from "@/components/ui/Card";
import styles from "./StatCard.module.css";

interface StatCardProps {
  label: string;
  value: string;
  hint: string;
  tone?: "default" | "warning";
}

export function StatCard({ label, value, hint, tone = "default" }: StatCardProps) {
  return (
    <Card as="div">
      <p className={styles.label}>{label}</p>
      <p className={`${styles.value} ${tone === "warning" ? styles.warning : ""}`}>
        {value}
      </p>
      <p className={styles.hint}>{hint}</p>
    </Card>
  );
}
