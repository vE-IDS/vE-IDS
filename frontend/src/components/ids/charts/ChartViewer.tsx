import { useState } from 'react'

import ChartSelector from './ChartSelector'
import type { ChartSet } from '@/types/chart.type'

/** Charts page body: left selector + right PDF pane. */
export default function ChartViewer({
  icao,
  chartData,
  onSearch,
}: {
  icao: string
  chartData?: ChartSet
  onSearch: (icao: string) => void
}) {
  const [pdf, setPdf] = useState<string | undefined>(undefined)

  return (
    <div className="flex h-full w-full flex-row bg-black">
      <div className="h-full w-96 shrink-0 overflow-auto border-r border-gray bg-mid-gray">
        <ChartSelector initial={icao} chartData={chartData} onSearch={onSearch} onSelect={setPdf} />
      </div>
      <div className="h-full w-full">
        {pdf ? (
          <iframe src={pdf} className="h-full w-full" title="chart" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            {chartData ? 'Select a chart' : 'Search for an airport'}
          </div>
        )}
      </div>
    </div>
  )
}
