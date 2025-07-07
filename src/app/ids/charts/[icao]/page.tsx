import { getAvailableCharts } from '@/actions/charts'
import ChartButton from '@/components/ids/charts/ChartButton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@radix-ui/react-tabs'

export default async function ChartViewer({params}: Props) {
    const { icao } = await params
    const chartData = await getAvailableCharts(icao)

    if (!chartData) {
        return <h2>Error</h2>
    }
    return (
        <div className='p-2'>
            <h2>Chart Viewer</h2>
            
            <Tabs defaultValue='apd' className='w-full'>
                <TabsList className='flex gap-x-5' color='primary'>
                    {chartData.apd.length > 0 && <TabsTrigger className='chart-select border-amber-500' value='apd'>APD</TabsTrigger>}
                    {chartData.min.length > 0 && <TabsTrigger className='chart-select border-purple-500' value='min'>MIN</TabsTrigger>}
                    {chartData.dp.length > 0 && <TabsTrigger className='chart-select border-blue-500' value='dp'>DP</TabsTrigger>}
                    {chartData.star.length > 0 && <TabsTrigger className='chart-select border-pink-500' value='star'>STAR</TabsTrigger>}
                    {chartData.iap.length > 0 && <TabsTrigger className='chart-select border-red-500' value='iap'>IAP</TabsTrigger>}
                    {chartData.lah.length > 0 && <TabsTrigger className='chart-select border-red-500' value='lah'>LAH</TabsTrigger>}
                </TabsList>
                <TabsContent value='apd' className='flex m-2 gap-x-2'>
                    {chartData.apd.map((data, i) => <ChartButton key={data.pdfName+ i} chartName={data.chartName}/>)}
                </TabsContent>
                <TabsContent value='min' className='flex m-2 gap-x-2'>
                    {chartData.min.map((data, i) => <ChartButton key={data.pdfName+ i} chartName={data.chartName}/>)}
                </TabsContent>
                <TabsContent value='dp' className='flex m-2 gap-x-2'>
                    {chartData.dp.map((data, i) => <ChartButton key={data.pdfName+ i} chartName={data.chartName}/>)}
                </TabsContent>
                <TabsContent value='star' className='flex m-2 gap-x-2'>
                    {chartData.star.map((data, i) => <ChartButton key={data.pdfName+ i} chartName={data.chartName}/>)}
                </TabsContent>
                <TabsContent value='iap' className='flex m-2 gap-x-2'>
                    {chartData.iap.map((data, i) => <ChartButton key={data.pdfName+ i} chartName={data.chartName}/>)}
                </TabsContent>
                <TabsContent value='lah' className='flex m-2 gap-x-2'>
                    {chartData.lah.map((data, i) => <ChartButton key={data.pdfName + i} chartName={data.chartName}/>)}
                </TabsContent>
                
            </Tabs>
        </div>
    )
}

interface Props {
    params: Promise<{
        icao: string
    }>
}