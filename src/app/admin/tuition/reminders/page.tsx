import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatVND } from "@/lib/format";
import { monthLabel, toISODate } from "@/lib/month";
import { getInvoiceViews } from "@/mocks/tuition";
import { getAdminTuitionNotifications, getPaymentAgreements, syncTuitionReminderNotifications } from "@/mocks/tuition-notifications";
import { getTuitionReminderSettings } from "@/mocks/tuition-reminder-settings";
import { DebtManagementTable } from "./_components/DebtManagementTable";
import { createPaymentAgreementAction, saveTuitionReminderSettingsAction, sendTuitionRemindersAction } from "./actions";

export const metadata: Metadata = { title: "Nhắc học phí | Quản trị" };

async function ReminderContent() {
  await connection();
  const today = toISODate(new Date());
  await syncTuitionReminderNotifications(today);
  const [invoices, notices, settings, agreements] = await Promise.all([
    getInvoiceViews(today), getAdminTuitionNotifications(), getTuitionReminderSettings(), getPaymentAgreements(),
  ]);
  const outstanding = invoices.filter((item) => item.remaining > 0);
  const inputStyle = { padding: "9px 11px", border: "1px solid var(--color-border)", borderRadius: 8, width: "100%", background: "var(--color-surface)" };
  const labelStyle = { display: "grid", gap: 6, fontSize: 13, fontWeight: 600 as const };
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div><h2 style={{ margin: 0 }}>Nhắc đóng học phí</h2><p style={{ color: "var(--color-muted)", marginBottom: 0 }}>Cấu hình lịch nhắc, theo dõi công nợ và ghi nhận lịch hẹn thanh toán.</p></div>
          <form action={sendTuitionRemindersAction}><Button type="submit" variant="primary">Gửi nhắc học phí ngay</Button></form>
        </div>
        <p style={{ marginBottom: 0, fontSize: 13, color: "var(--color-muted)" }}>Thông báo tự động được kiểm tra khi có người truy cập các trang liên quan. Bản mock chưa có Cron Job chạy nền.</p>
      </Card>

      <Card title="Cấu hình lịch nhắc học phí">
        <form action={saveTuitionReminderSettingsAction} style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14 }}>
            <label style={labelStyle}>Ngày nhắc lần đầu<input style={inputStyle} type="number" name="firstReminderDay" min="1" max="28" defaultValue={settings.firstReminderDay} required /></label>
            <label style={labelStyle}>Ngày hạn đóng học phí<input style={inputStyle} type="number" name="dueDay" min="1" max="28" defaultValue={settings.dueDay} required /></label>
            <label style={labelStyle}>Ngày nhắc lần hai<input style={inputStyle} type="number" name="secondReminderDay" min="1" max="28" defaultValue={settings.secondReminderDay} required /></label>
            <label style={labelStyle}>Ngày nhắc các tháng tiếp theo<input style={inputStyle} type="number" name="followUpDay" min="1" max="28" defaultValue={settings.followUpDay} required /></label>
            <label style={labelStyle}>Cảnh báo nợ kéo dài (ngày)<input style={inputStyle} type="number" name="overdueWarningDays" min="1" max="365" defaultValue={settings.overdueWarningDays} required /></label>
            <label style={labelStyle}>Cảnh báo nợ nghiêm trọng (ngày)<input style={inputStyle} type="number" name="criticalDebtDays" min="2" max="730" defaultValue={settings.criticalDebtDays} required /></label>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}><input type="checkbox" name="notifyTeachers" defaultChecked={settings.notifyTeachers} />Thông báo cho giáo viên phụ trách</label>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}><input type="checkbox" name="pauseDuringAgreement" defaultChecked={settings.pauseDuringAgreement} />Tạm dừng nhắc tự động khi có lịch hẹn thanh toán</label>
          </div>
          <p style={{ margin: 0, color: "var(--color-muted)", fontSize: 13 }}>Ngày áp dụng cho hóa đơn mới. Hóa đơn đã tạo giữ nguyên hạn thanh toán cũ. Ngày cấu hình giới hạn từ 1 đến 28 để phù hợp mọi tháng.</p>
          <div><Button type="submit" variant="primary">Lưu cấu hình</Button></div>
        </form>
      </Card>

      <Card title="Ghi nhận lịch hẹn thanh toán">
        <form action={createPaymentAgreementAction} style={{ display: "grid", gap: 14 }}>
          <label style={labelStyle}>Hóa đơn còn nợ
            <select name="invoiceId" required style={inputStyle} defaultValue="">
              <option value="" disabled>Chọn hóa đơn</option>
              {outstanding.map((item) => <option key={item.id} value={item.id}>{item.studentName} · {monthLabel(item.month)} · Còn nợ {formatVND(item.remaining)}</option>)}
            </select>
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14 }}>
            <label style={labelStyle}>Ngày hẹn thanh toán<input style={inputStyle} type="date" name="promisedDate" min={today} required /></label>
            <label style={labelStyle}>Số tiền dự kiến (VNĐ)<input style={inputStyle} type="number" name="expectedAmount" min="1" step="1000" required /></label>
          </div>
          <label style={labelStyle}>Ghi chú trao đổi (không bắt buộc)<input style={inputStyle} type="text" name="note" maxLength={300} placeholder="Ví dụ: Phụ huynh hẹn chuyển khoản vào ngày đã chọn" /></label>
          <div><Button type="submit" variant="primary" disabled={!outstanding.length}>Lưu lịch hẹn</Button></div>
          <p style={{ margin: 0, color: "var(--color-muted)", fontSize: 13 }}>Khi bật tạm dừng, hệ thống không gửi nhắc tự động cho hóa đơn này trước ngày hẹn. Nếu đến ngày hẹn vẫn còn nợ, hệ thống tiếp tục nhắc.</p>
        </form>
      </Card>

      <Card>
        <DebtManagementTable
          invoices={outstanding}
          today={today}
          warningDays={settings.overdueWarningDays}
          criticalDays={settings.criticalDebtDays}
        />
      </Card>

      <Card title={`Lịch hẹn thanh toán (${agreements.length})`}>
        {agreements.length ? <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th align="left">Hóa đơn</th><th align="left">Ngày hẹn</th><th align="right">Số tiền dự kiến</th><th align="left">Ghi chú</th><th align="left">Trạng thái</th></tr></thead><tbody>{agreements.map((item) => { const invoice = invoices.find((v) => v.id === item.invoiceId); return <tr key={item.id}><td>{invoice ? `${invoice.studentName} · ${monthLabel(invoice.month)}` : item.invoiceId}</td><td>{item.promisedDate}</td><td align="right">{formatVND(item.expectedAmount)}</td><td>{item.note || "—"}</td><td>{!invoice || invoice.remaining <= 0 ? "Đã thanh toán" : today < item.promisedDate ? "Đang chờ" : "Đến ngày hẹn"}</td></tr>; })}</tbody></table></div> : <p>Chưa có lịch hẹn thanh toán.</p>}
      </Card>

      <Card title="Lịch sử thông báo gần đây">
        {notices.length ? <div style={{ display: "grid", gap: 12 }}>{notices.slice(0, 40).map((item) => <article key={item.id} style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: 10 }}><strong>{item.title}</strong><p style={{ margin: "4px 0", color: "var(--color-muted)" }}>{item.message}</p><small>{new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.createdAt))}</small></article>)}</div> : <p>Chưa có thông báo học phí.</p>}
      </Card>
    </div>
  );
}
export default function TuitionRemindersPage() {
  return <><PageHeader title="Thông báo học phí" subtitle="Cấu hình lịch nhắc, theo dõi công nợ và lịch hẹn thanh toán." /><Suspense fallback={<p>Đang tải thông báo học phí...</p>}><ReminderContent /></Suspense></>;
}
