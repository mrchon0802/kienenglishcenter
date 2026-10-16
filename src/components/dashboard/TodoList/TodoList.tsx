import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { TodoItem } from "@/types/dashboard";
import styles from "./TodoList.module.css";

export function TodoList({ items }: { items: TodoItem[] }) {
  return (
    <Card title="Cần xử lý hôm nay">
      {items.length === 0 ? (
        <p className={styles.empty}>Hôm nay không có việc nào cần xử lý.</p>
      ) : (
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.id} className={styles.row}>
              <span className={styles.text}>
                <Badge tone="amber">{item.count}</Badge> {item.text}
              </span>
              <Link href={item.href}>{item.actionLabel}</Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
