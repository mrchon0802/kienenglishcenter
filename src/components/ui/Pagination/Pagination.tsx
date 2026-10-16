import { Button } from "@/components/ui/Button";
import styles from "./Pagination.module.css";

interface PaginationProps {
  page: number; // bắt đầu từ 1
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav className={styles.nav} aria-label="Phân trang">
      <Button disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        Trước
      </Button>
      <span className={styles.status} aria-current="page">
        Trang {page} / {totalPages}
      </span>
      <Button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
        Sau
      </Button>
    </nav>
  );
}
