"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { Table } from "@/components/ui/Table";
import { formatVND } from "@/lib/format";
import { formatDate } from "@/lib/format-date";
import { monthLabel } from "@/lib/month";
import { STATUS_LABEL, STATUS_OPTIONS } from "@/lib/tuition";
import { normalizeText } from "@/lib/text";
import type { InvoiceView } from "@/types/tuition";
import { generateInvoicesAction } from "../../actions";
import styles from "./InvoicesView.module.css";

const PAGE_SIZE = 10;

interface InvoicesViewProps {
  invoices: InvoiceView[];
  months: string[]; // mới nhất trước
  currentMonth: string;
}

export function InvoicesView({ invoices, months, currentMonth }: InvoicesViewProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [month, setMonth] = useState(currentMonth);
  const [search, setSearch] = useState("");
  const [className, setClassName] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");

  const monthInvoices = useMemo(() => invoices.filter((v) => v.month === month), [invoices, month]);
  const classOptions = useMemo(
    () => [...new Set(monthInvoices.map((v) => v.className))].sort().map((c) => ({ value: c, label: `Lớp ${c}` })),
    [monthInvoices],
  );

  const totals = useMemo(() => {
    const invoiced = monthInvoices.reduce((s, v) => s + v.amount, 0);
    const paid = monthInvoices.reduce((s, v) => s + v.paid, 0);
    const unpaidCount = monthInvoices.filter((v) => v.remaining > 0).length;
    return { invoiced, paid, remaining: invoiced - paid, unpaidCount };
  }, [monthInvoices]);

  const filtered = useMemo(() => {
    const keyword = normalizeText(search);
    return monthInvoices.filter(
      (v) =>
        (!className || v.className === className) &&
        (!status || v.status === status) &&
        (!keyword || normalizeText(v.studentName).includes(keyword)),
    );
  }, [monthInvoices, search, className, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  const filter = (setter: (v: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  function generate() {
    setMessage("");
    startTransition(async () => {
      const res = await generateInvoicesAction(month);
      if (res.ok) {
        setMessage(
          res.created > 0
            ? `Đã tạo ${res.created} hóa đơn mới cho ${monthLabel(month)}${res.skipped ? ` (${res.skipped} hóa đơn đã có sẵn)` : ""}.`
            : `${monthLabel(month)} đã có đủ hóa đơn cho mọi học sinh đang học.`,
        );
        router.refresh();
      } else {
        setMessage(res.error);
      }
    });
  }

  return (
    <>
      <div className={styles.stats}>
        <StatCard label="Phải thu" value={formatVND(totals.invoiced)} hint={`${monthInvoices.length} hóa đơn`} />
        <StatCard label="Đã thu" value={formatVND(totals.paid)} hint="Của các hóa đơn tháng này" />
        <StatCard label="Còn nợ" value={formatVND(totals.remaining)} hint={`${totals.unpaidCount} hóa đơn chưa đóng đủ`} tone={totals.remaining > 0 ? "warning" : "default"} />
      </div>

      <Card>
        <div className={styles.toolbar}>
          <Select
            label="Tháng"
            value={month}
            options={months.map((m) => ({ value: m, label: monthLabel(m) }))}
            onChange={(e) => {
              setMonth(e.target.value);
              setClassName("");
              setPage(1);
              setMessage("");
            }}
          />
          <Input label="Tìm học sinh" type="search" value={search} onChange={(e) => filter(setSearch)(e.target.value)} />
          <Select label="Lớp" placeholder="Tất cả" options={classOptions} value={className} onChange={(e) => filter(setClassName)(e.target.value)} />
          <Select label="Trạng thái" placeholder="Tất cả" options={STATUS_OPTIONS} value={status} onChange={(e) => filter(setStatus)(e.target.value)} />
        </div>

        <div className={styles.generate}>
          <Button onClick={generate} disabled={pending}>
            {pending ? "Đang tạo..." : `Tạo hóa đơn ${monthLabel(month)}`}
          </Button>
          <span className={styles.hint}>
            Mỗi học sinh đang học có 1 hóa đơn mỗi tháng, hạn đóng ngày 10. Học sinh đã có hóa đơn sẽ được bỏ qua.
          </span>
        </div>
        {message ? (
          <p className={styles.message} role="status">
            {message}
          </p>
        ) : null}

        {visible.length === 0 ? (
          <EmptyState
            title={monthInvoices.length === 0 ? `${monthLabel(month)} chưa có hóa đơn` : "Không có hóa đơn phù hợp"}
            description={monthInvoices.length === 0 ? "Bấm “Tạo hóa đơn” để tạo cho cả trung tâm." : "Thử đổi bộ lọc."}
          />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <th scope="col">Học sinh</th>
                  <th scope="col">Lớp</th>
                  <th scope="col">Học phí</th>
                  <th scope="col">Đã đóng</th>
                  <th scope="col">Còn lại</th>
                  <th scope="col">Hạn đóng</th>
                  <th scope="col">Trạng thái</th>
                  <th scope="col">
                    <span className="sr-only">Thao tác</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <Link href={`/admin/tuition/invoices/${v.id}`}>{v.studentName}</Link>
                    </td>
                    <td>{v.className}</td>
                    <td>{formatVND(v.amount)}</td>
                    <td>{formatVND(v.paid)}</td>
                    <td>{v.remaining > 0 ? <strong>{formatVND(v.remaining)}</strong> : "-"}</td>
                    <td>{formatDate(v.dueDate)}</td>
                    <td>
                      <Badge tone={v.status === "paid" ? "teal" : "amber"}>{STATUS_LABEL[v.status]}</Badge>
                    </td>
                    <td>
                      <Button href={`/admin/tuition/invoices/${v.id}`} variant={v.remaining > 0 ? "primary" : "secondary"}>
                        {v.remaining > 0 ? "Thu tiền" : "Xem"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <div className={styles.footer}>
              <p className={styles.hint} role="status">
                Hiển thị {start + 1} - {start + visible.length} / {filtered.length} hóa đơn
              </p>
              <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </>
        )}
      </Card>
    </>
  );
}
