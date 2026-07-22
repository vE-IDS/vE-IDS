import { Button } from '@/components/ui/button'
import type { Chart } from '@/types/chart.type'

export default function ChartButton({
  chart,
  color,
  onSelect,
}: {
  chart: Chart
  color: string
  onSelect: (pdf: string) => void
}) {
  return (
    <Button
      onClick={() => onSelect(chart.pdfPath)}
      className={`h-auto min-h-10 justify-start whitespace-normal p-2 text-left text-[11px] leading-snug font-medium text-white ${color}`}
    >
      {chart.chartName}
    </Button>
  )
}
