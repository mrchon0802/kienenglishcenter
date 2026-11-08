import Link from "next/link";
import { Card } from "@/components/ui/Card";
import styles from "./StatCard.module.css";

interface StatCardProps {
  icon?: string;
  label: string;
  value: string;
  hint: string;
  tone?: "default" | "success" | "warning";
  href?: string;
}

export function StatCard({
  icon,
  label,
  value,
  hint,
  tone = "default",
  href,
}: StatCardProps) {
  const content = (
    <Card as="div">
      <div className={styles.top}>
        <p className={styles.label}>{label}</p>
        {icon ? (
          <span className={`${styles.icon} ${styles[tone]}`} aria-hidden="true">
            {icon}
          </span>
        ) : null}
      </div>
      <p className={`${styles.value} ${styles[tone]}`}>{value}</p>
      <p className={styles.hint}>{hint}</p>
    </Card>
  );

  // Chỉ render thành liên kết khi component được truyền href.
  // Các StatCard ở trang báo cáo/chi tiết vẫn hoạt động như thẻ hiển thị bình thường.
  if (href) {
    return (
      <Link href={href} className={styles.link}>
        {content}
      </Link>
    );
  }

  return content;
}
