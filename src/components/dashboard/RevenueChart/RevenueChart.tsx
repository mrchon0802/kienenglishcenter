import { Card } from "@/components/ui/Card";
import { formatNumber } from "@/lib/format";
import type { RevenuePoint } from "@/types/dashboard";
import { BarChart } from "../BarChart";

export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  const points = data.map((d) => ({ label: d.month, value: d.valueInMillions }));
  const summary = points
    .map((p) => `${p.label}: ${formatNumber(p.value)} triệu`)
    .join("; ");

  return (
    <Card title="Doanh thu 6 tháng gần nhất (triệu đồng)">
      <BarChart
        points={points}
        highlightLast
        ariaLabel={`Doanh thu theo tháng. ${summary}`}
      />
    </Card>
  );
}
