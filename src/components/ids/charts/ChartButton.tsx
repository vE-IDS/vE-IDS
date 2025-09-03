'use client'

import { Button } from "@/components/ui/button"
import { Chart } from '@/types/chart.type'

export default function ChartButton({chart, color, callback}: Props) {
    return (
        <Button 
        onClick={() => callback(chart.pdfPath)}
        className={`col-span-1 row-span-1 p-2 text-[8px] text- ${color}`}>
            {chart.chartName}
        </Button>
    )
}

interface Props {
    chart: Chart
    color: string
    callback: (pdfLink: string) => void
}