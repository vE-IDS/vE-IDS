'use client'

import { Button } from "@/components/ui/button"

export default function ChartButton({chartName}: Props) {
    return (
        <Button>
            {chartName}
        </Button>
    )
}

interface Props {
    chartName: string
}