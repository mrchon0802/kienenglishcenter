import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Bài tập & kiểm tra | Quản trị" };

export default function Page() {
  return (
    <>
      <PageHeader title="Bài tập & kiểm tra" />
      <Card>
        <EmptyState
          title="Trang này đang được xây dựng"
          description="Chức năng sẽ có trong các giai đoạn tiếp theo."
        />
      </Card>
    </>
  );
}
