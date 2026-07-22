import ChartButton from './ChartButton'
import type { Chart } from '@/types/chart.type'

export default function ChartGrid({
  charts,
  color,
  onSelect,
}: {
  charts: Chart[]
  color: string
  onSelect: (pdf: string) => void
}) {
  if (charts.length === 0) return <p className="text-xs text-muted-foreground">None</p>
  return (
    <div className="grid grid-cols-3 gap-2">
      {charts.map((c, i) => (
        <ChartButton key={c.pdfName + i} chart={c} color={color} onSelect={onSelect} />
      ))}
    </div>
  )
}
