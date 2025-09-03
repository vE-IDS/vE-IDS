import { getAvailableCharts } from '@/actions/charts'
import ChartViewer from '@/components/ids/charts/ChartViewer'

export default async function ChartPage({params}: Props) {
    const { icao } = await params
    const chartData = await getAvailableCharts(icao)
    
    return <ChartViewer icao={icao} chartData={chartData}/>
}

interface Props {
    params: Promise<{
        icao?: string
    }>
}