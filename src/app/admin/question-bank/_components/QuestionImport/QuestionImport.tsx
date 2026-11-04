"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { FilePicker } from "@/components/import/FilePicker";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { downloadCsv, readSpreadsheet } from "@/lib/import-parse";
import { QUESTION_TEMPLATE_HEADER, QUESTION_TEMPLATE_ROWS, rowsToQuestions, type ImportedQuestion } from "@/lib/question-import";
import { typeLabel } from "@/lib/question-types";
import { importQuestionsAction, type QuestionImportResult } from "../../actions";
import styles from "./QuestionImport.module.css";

const PREVIEW_LIMIT = 100;

export function QuestionImport() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [fileName, setFileName] = useState("");
  const [items, setItems] = useState<ImportedQuestion[]>([]);
  const [fileError, setFileError] = useState("");
  const [onlyErrors, setOnlyErrors] = useState(false);
  const [result, setResult] = useState<QuestionImportResult | null>(null);
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
      const parsed = rowsToQuestions(await readSpreadsheet(file));
      if (parsed.fileError) setFileError(parsed.fileError);
      else if (parsed.items.length === 0) setFileError("Không tìm thấy câu hỏi nào trong file.");
      else if (parsed.items.length > 500) setFileError("File có hơn 500 câu. Hãy chia nhỏ rồi nhập từng lần.");
      else setItems(parsed.items);
    } catch (error) {
      setFileError(error instanceof Error ? error.message : "Không đọc được file.");
    }
  }

  function submit() {
    setServerError("");
    startTransition(async () => {
      const res = await importQuestionsAction(valid.map((i) => ({ rowNumber: i.rowNumber, question: i.question })));
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
            Tải file mẫu: mỗi dạng câu hỏi có một dòng ví dụ. Mỗi dòng là một câu hỏi. Cột bắt buộc: <strong>Dạng, Nội dung, Lớp, Unit</strong> và{" "}
            <strong>Đáp án đúng</strong> (trừ câu tự luận).
          </p>
          <ul className={styles.rules}>
            <li><strong>Trắc nghiệm / Nhiều đáp án:</strong> điền các cột Đáp án 1 đến 6; “Đáp án đúng” là số thứ tự (hoặc chữ A-F), ví dụ <code>2</code> hoặc <code>1,3</code>.</li>
            <li><strong>Đúng/Sai:</strong> “Đáp án đúng” là <code>Đúng</code> hoặc <code>Sai</code>.</li>
            <li><strong>Điền chỗ trống:</strong> “Nội dung” có <code>___</code>; “Đáp án đúng” ghi các cách viết đúng, cách nhau bằng <code>|</code>, ví dụ <code>seven | 7</code>.</li>
            <li><strong>Nối cặp:</strong> “Đáp án đúng” ghi các cặp dạng <code>dog=con chó; cat=con mèo</code>.</li>
            <li><strong>Sắp xếp:</strong> “Đáp án đúng” là câu hoàn chỉnh. <strong>Tự luận:</strong> “Đáp án đúng” là đáp án mẫu (không bắt buộc).</li>
            <li>Kỹ năng: Từ vựng, Ngữ pháp, Đọc, Nghe, Viết. Độ khó: Dễ, Trung bình, Khó. Điểm mặc định là 1.</li>
          </ul>
          <div>
            <Button onClick={() => downloadCsv("mau-nhap-cau-hoi.csv", [QUESTION_TEMPLATE_HEADER, ...QUESTION_TEMPLATE_ROWS])}>Tải file mẫu</Button>
          </div>
        </div>
      </Card>

      <Card title="2. Chọn file và kiểm tra">
        <div className={styles.stack}>
          <FilePicker label="File Excel (.xlsx) hoặc CSV" onFile={handleFile} disabled={pending} />
          {fileError ? (
            <p className={styles.error} role="alert">
              {fileError}
            </p>
          ) : null}

          {items.length > 0 ? (
            <>
              <p className={styles.summary} role="status">
                {fileName}: <strong>{valid.length}</strong> câu hợp lệ
                {invalidCount > 0 ? <>, <strong className={styles.bad}>{invalidCount}</strong> câu lỗi (sẽ bị bỏ qua)</> : null}.
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
                    <th scope="col">Nội dung</th>
                    <th scope="col">Dạng</th>
                    <th scope="col">Lớp / Unit</th>
                    <th scope="col">Kết quả</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((item) => (
                    <tr key={item.rowNumber}>
                      <td>{item.rowNumber}</td>
                      <td>
                        <span className={styles.truncate} title={item.question.prompt}>
                          {item.question.prompt || "-"}
                        </span>
                      </td>
                      <td>{typeLabel(item.question.type)}</td>
                      <td>
                        Lớp {item.question.grade} · Unit {item.question.unit}
                      </td>
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
                  {pending ? "Đang nhập..." : `Nhập ${valid.length} câu hỏi`}
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
              Đã nhập <strong>{result.created}</strong> câu hỏi vào ngân hàng.
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
              <Button href="/admin/question-bank" variant="primary">
                Xem ngân hàng câu hỏi
              </Button>
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
