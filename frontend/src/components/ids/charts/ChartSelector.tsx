import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import ChartGrid from './ChartGrid'
import type { Chart, ChartSet } from '@/types/chart.type'

const ICAO_RE = /^[A-Z0-9]{3,4}$/

/** Left pane: ICAO search + category sections (APD/DP/STAR/IAP). */
export default function ChartSelector({
  initial,
  chartData,
  onSearch,
  onSelect,
}: {
  initial: string
  chartData?: ChartSet
  onSearch: (icao: string) => void
  onSelect: (pdf: string) => void
}) {
  const [value, setValue] = useState(initial)

  const submit = () => {
    const v = value.trim().toUpperCase()
    if (ICAO_RE.test(v)) onSearch(v)
  }

  return (
    <div className="flex flex-col gap-4 p-2">
      <div>
        <h4 className="mb-2 font-semibold">Charts</h4>
        <div className="flex gap-2">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
            }}
            placeholder="Airport ICAO"
            maxLength={4}
            className="w-40"
          />
          <Button onClick={submit}>Search</Button>
        </div>
      </div>

      {chartData && (
        <div className="flex flex-col gap-4">
          {chartData.airportName && (
            <p className="text-xs text-muted-foreground">
              {chartData.icaoIdent} — {chartData.airportName}
            </p>
          )}
          <Section title="APD" charts={chartData.apd} color="bg-blue-900" onSelect={onSelect} />
          <Section title="DP" charts={chartData.dp} color="bg-blue-700" onSelect={onSelect} />
          <Section title="STAR" charts={chartData.star} color="bg-blue-500" onSelect={onSelect} />
          <Section title="IAP" charts={chartData.iap} color="bg-gray-600" onSelect={onSelect} />
        </div>
      )}
    </div>
  )
}

function Section({
  title,
  charts,
  color,
  onSelect,
}: {
  title: string
  charts: Chart[]
  color: string
  onSelect: (pdf: string) => void
}) {
  return (
    <div>
      <h5 className="mb-2 font-bold">{title}</h5>
      <ChartGrid charts={charts} color={color} onSelect={onSelect} />
    </div>
  )
}
