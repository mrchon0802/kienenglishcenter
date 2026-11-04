"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { FilePicker } from "@/components/import/FilePicker";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { downloadCsv, readSpreadsheet } from "@/lib/import-parse";
import { STUDENT_TEMPLATE_HEADER, STUDENT_TEMPLATE_ROWS, rowsToStudents, type ImportedStudent } from "@/lib/student-import";
import { importStudentsAction, type ImportResult } from "../../actions";
import styles from "./StudentImport.module.css";

const PREVIEW_LIMIT = 100;

interface StudentImportProps {
  classNames: string[];
  existing: { fullName: string; parentPhone: string }[];
}

export function StudentImport({ classNames, existing }: StudentImportProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [fileName, setFileName] = useState("");
  const [items, setItems] = useState<ImportedStudent[]>([]);
  const [fileError, setFileError] = useState("");
  const [onlyErrors, setOnlyErrors] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [serverError, setServerError] = useState("");

  const valid = useMemo(() => items.filter((i) => i.errors.length === 0), [items]);
  const invalidCount = items.length - valid.length;
  const shown = (onlyErrors ? items.filter((i) => i.errors.length > 0) : items).slice(0, PREVIEW_LIMIT);

  async function handleFile(file: File) {
    setResult(null);
    setServerError("");
    setFileError("");
    setItems([]);
    setFileName(file.name);
    try {
      const rows = await readSpreadsheet(file);
      const parsed = rowsToStudents(rows, classNames, existing);
      if (parsed.fileError) setFileError(parsed.fileError);
      else if (parsed.items.length === 0) setFileError("Không tìm thấy dòng dữ liệu nào trong file.");
      else if (parsed.items.length > 500) setFileError("File có hơn 500 dòng. Hãy chia nhỏ rồi nhập từng lần.");
      else setItems(parsed.items);
    } catch (error) {
      setFileError(error instanceof Error ? error.message : "Không đọc được file.");
    }
  }

  function submit() {
    setServerError("");
    startTransition(async () => {
      const res = await importStudentsAction(valid.map((i) => ({ rowNumber: i.rowNumber, input: i.input })));
      if (res.ok) {
        setResult({ created: res.created, skipped: res.skipped });
        setItems([]);
        setFileName("");
        router.refresh();
      } else setServerError(res.error);
    });
  }

  return (
    <div className={styles.wrap}>
      <Card title="1. Chuẩn bị file">
        <div className={styles.stack}>
          <p className={styles.text}>
            Dùng file mẫu (có thể mở bằng Excel rồi lưu thành <strong>.xlsx</strong>). Mỗi dòng là một học sinh. Cột bắt buộc:
            <strong> Họ và tên, Lớp, Tên phụ huynh, SĐT phụ huynh</strong>. Cột <strong>Ngày sinh</strong> và <strong>Ngày nhập học</strong> không
            bắt buộc (dạng dd/mm/yyyy). Lớp phải là lớp đã có trong hệ thống ({classNames.join(", ")}).
          </p>
          <div>
            <Button onClick={() => downloadCsv("mau-nhap-hoc-sinh.csv", [STUDENT_TEMPLATE_HEADER, ...STUDENT_TEMPLATE_ROWS])}>
              Tải file mẫu
            </Button>
          </div>
        </div>
      </Card>

      <Card title="2. Chọn file và kiểm tra">
        <div className={styles.stack}>
          <FilePicker label="File Excel (.xlsx) hoặc CSV" hint="Số điện thoại bị Excel làm mất số 0 sẽ được tự sửa lại." onFile={handleFile} disabled={pending} />
          {fileError ? (
            <p className={styles.error} role="alert">
              {fileError}
            </p>
          ) : null}

          {items.length > 0 ? (
            <>
              <p className={styles.summary} role="status">
                {fileName}: <strong>{valid.length}</strong> dòng hợp lệ
                {invalidCount > 0 ? <>, <strong className={styles.bad}>{invalidCount}</strong> dòng lỗi (sẽ bị bỏ qua)</> : null}.
              </p>
              {invalidCount > 0 ? (
                <label className={styles.check}>
                  <input type="checkbox" checked={onlyErrors} onChange={(e) => setOnlyErrors(e.target.checked)} />
                  Chỉ hiện dòng lỗi
                </label>
              ) : null}
              <Table>
                <thead>
                  <tr>
                    <th scope="col">Dòng</th>
                    <th scope="col">Họ và tên</th>
                    <th scope="col">Lớp</th>
                    <th scope="col">Phụ huynh</th>
                    <th scope="col">SĐT</th>
                    <th scope="col">Kết quả</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((item) => (
                    <tr key={item.rowNumber}>
                      <td>{item.rowNumber}</td>
                      <td>{item.input.fullName || "-"}</td>
                      <td>{item.input.className || "-"}</td>
                      <td>{item.input.parentName || "-"}</td>
                      <td>{item.input.parentPhone || "-"}</td>
                      <td className={styles.resultCell}>
                        {item.errors.length === 0 ? <Badge>Hợp lệ</Badge> : <span className={styles.bad}>{item.errors.join(" ")}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {items.length > PREVIEW_LIMIT && !onlyErrors ? (
                <p className={styles.hint}>Chỉ hiện {PREVIEW_LIMIT} dòng đầu, các dòng còn lại vẫn được kiểm tra và nhập.</p>
              ) : null}
              <div className={styles.actions}>
                <Button variant="primary" onClick={submit} disabled={pending || valid.length === 0}>
                  {pending ? "Đang nhập..." : `Nhập ${valid.length} học sinh`}
                </Button>
              </div>
            </>
          ) : null}
          {serverError ? (
            <p className={styles.error} role="alert">
              {serverError}
            </p>
          ) : null}
        </div>
      </Card>

      {result ? (
        <Card title="Kết quả nhập">
          <div className={styles.stack}>
            <p className={styles.summary} role="status">
              Đã nhập <strong>{result.created}</strong> học sinh mới.
              {result.skipped.length > 0 ? ` Bỏ qua ${result.skipped.length} dòng.` : ""}
            </p>
            {result.skipped.length > 0 ? (
              <ul className={styles.list}>
                {result.skipped.map((s) => (
                  <li key={s.row}>
                    Dòng {s.row}: {s.reason}
                  </li>
                ))}
              </ul>
            ) : null}
            <div>
              <Button href="/admin/students" variant="primary">
                Xem danh sách học sinh
              </Button>
            </div>
            <p className={styles.hint}>
              Học sinh mới chưa có hóa đơn học phí: vào <Link href="/admin/tuition">Học phí</Link> để tạo hóa đơn tháng.
            </p>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
