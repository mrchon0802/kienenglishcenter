import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { LEARNING_MATERIALS } from "@/mocks/student-learning";
import styles from "./materials.module.css";

export const metadata: Metadata = { title: "Học liệu | Học sinh" };

export default function StudentMaterialsPage() {
  return <>
    <PageHeader title="Thư viện học liệu" subtitle="Tài liệu ôn tập tiếng Anh được sắp xếp theo chủ đề và kỹ năng." />
    <div className={styles.grid}>{LEARNING_MATERIALS.map((item) => <Card key={item.id}>
      <article className={styles.material}>
        <div className={styles.meta}><span>{item.category}</span><span>{item.level}</span></div>
        <h2>{item.title}</h2>
        <p>{item.description}</p>
        <small>Thời gian học dự kiến: {item.estimatedMinutes} phút</small>
        <details className={styles.details}><summary>Mở nội dung học</summary><ul>{item.content.map((line) => <li key={line}>{line}</li>)}</ul></details>
      </article>
    </Card>)}</div>
    <p className={styles.note}>Học liệu hiện là nội dung mẫu được tích hợp trực tiếp trong ứng dụng. Chức năng tải PDF và đính kèm tài liệu sẽ được bổ sung khi có kho tệp.</p>
  </>;
}
