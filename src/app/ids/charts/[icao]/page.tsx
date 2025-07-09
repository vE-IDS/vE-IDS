import { getAvailableCharts } from '@/actions/charts'
import ChartButton from '@/components/ids/charts/ChartButton'
import ChartSelector from '@/components/ids/charts/ChartSelector'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@radix-ui/react-tabs'

export default async function ChartViewer({params}: Props) {
    const { icao } = await params
    const chartData = await getAvailableCharts(icao)

    if (!chartData) {
        return <h2>Error</h2>
    }
    return (
        <ChartSelector chartData={chartData}/>
    )
}

interface Props {
    params: Promise<{
        icao: string
    }>
}