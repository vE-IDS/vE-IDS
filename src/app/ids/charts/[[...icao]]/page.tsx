import { getAvailableCharts } from '@/actions/charts'
import ChartSelector from '@/components/ids/charts/ChartSelector'

export default async function ChartViewer({params}: Props) {
    const { icao } = await params
    const chartData = await getAvailableCharts(icao)
    
    return (
        <div className='w-full h-full bg-black flex flex-row'>
            <div className='h-full w-120 bg-mid-gray'>
                <ChartSelector icao={icao} chartData={chartData}/>      
            </div>

            <div className='w-[calc(100% - 120em)] h-full'>
                <embed src="https://charts.aviationapi.com/AIRAC_190103/SE2TO.PDF" type="application/pdf" width="100%">
                </embed>
            </div>
        </div>
    )
}

interface Props {
    params: Promise<{
        icao?: string
    }>
}