import { Chart, ChartData, ChartSet } from "@/types/chart.type";

export async function getAvailableCharts(icao?: string) {
    if (!icao) {
        return undefined
    }
    
    const data: Response = await fetch(`https://api.aviationapi.com/v1/charts?apt=${icao}`, {next: { revalidate: 86400 }})
    const chartData: ChartData[] | null = (await data.json())[icao]

    if (!chartData || chartData.length == 0) {
        return undefined
    }

    const chartSet: ChartSet = {
        state: chartData[0].state,
        fullState: chartData[0].state_full,
        city: chartData[0].city,
        airportName: chartData[0].airport_name,
        military: chartData[0].military == 'Y',
        faaIdent: chartData[0].faa_ident,
        icaoIdent: chartData[0].icao_ident,
        apd: [],
        min: [],
        dp: [],
        star: [],
        iap: [],
        lah: []
    }

    chartData.map((data) => {
        const chart: Chart = {
            chartSeq: data.chart_seq,
            chartCode: data.chart_code,
            chartName: data.chart_name,
            pdfName: data.pdf_name,
            pdfPath: data.pdf_path
        }

        switch(data.chart_code) {
            case 'APD':
                chartSet.apd.push(chart)
                break
            case 'DP':
                chartSet.dp.push(chart)
                break
            case 'STAR':
                chartSet.star.push(chart)
                break
            case 'IAP':
                chartSet.iap.push(chart)
                break
            case 'MIN':
                chartSet.min.push(chart)
                break
            case 'LAH':
                chartSet.lah.push(chart)
                break
            default:
                break
        }
    })

    return chartSet
}