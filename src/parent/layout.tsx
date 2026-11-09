import styles from "./layout.module.css";

/** Parent Portal is temporarily disabled while its workflows are being revised.
 * Keep the route tree and feature implementation in place for later reactivation.
 */
export default function ParentLayout() {
  return (
    <main className={styles.disabledShell}>
      <section className={styles.disabledCard} aria-labelledby="parent-disabled-title">
        <span className={styles.disabledEyebrow}>KIEN ENGLISH CENTER</span>
        <div className={styles.disabledIcon} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 3 3.8 7.2v5.6c0 4.1 3.5 7.2 8.2 8.2 4.7-1 8.2-4.1 8.2-8.2V7.2L12 3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
            <path d="M12 8v4.5m0 3h.01" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </div>
        <h1 id="parent-disabled-title">Parent Portal đang tạm ngưng</h1>
        <p>
          Cổng thông tin phụ huynh hiện đang được hoàn thiện và tạm thời chưa thể truy cập.
          Các chức năng và dữ liệu hiện tại vẫn được giữ lại để tiếp tục phát triển sau này.
        </p>
        <span className={styles.disabledStatus}>Tạm thời không khả dụng</span>
      </section>
    </main>
  );
}
