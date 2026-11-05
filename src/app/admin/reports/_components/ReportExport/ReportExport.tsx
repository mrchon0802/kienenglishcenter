"use client";

import { Button } from "@/components/ui/Button";

interface ExportRow {
  studentCode: string;
  studentName: string;
  className: string;
  testAverage: string;
  attendanceRate: number;
  overdueAmount: number;
  riskReasons: string;
}

function csvCell(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

export function ReportExport({ rows }: { rows: ExportRow[] }) {
  function exportCsv() {
    const header = ["Mã học sinh", "Họ tên", "Lớp", "Điểm TB kiểm tra", "Chuyên cần (%)", "Công nợ quá hạn (VND)", "Cảnh báo"];
    const body = rows.map((row) => [
      row.studentCode, row.studentName, row.className, row.testAverage,
      row.attendanceRate, row.overdueAmount, row.riskReasons,
    ]);
    const csv = [header, ...body].map((line) => line.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `kien-english-academic-report-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="reportExportActions">
      <Button onClick={exportCsv}>Xuất Excel (CSV)</Button>
      <Button onClick={() => window.print()}>In / Lưu PDF</Button>
    </div>
  );
}
