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

    chartData.map((data, i) => {
        const chart: Chart = {
            chartSeq: data.chart_seq,
            chartCode: data.chart_code,
            chartName: data.chart_name,
            pdfName: data.pdf_name,
            pdfPath: data.pdf_path
        }

        console.log(data)
        switch(data.chart_code) {
            case 'APD':
                if (chartSet.apd.indexOf(chart) == -1)
                    chartSet.apd.push(chart)
                break
            case 'DP':
                if (chartSet.dp.indexOf(chart) == -1)
                    chartSet.dp.push(chart)
                break
            case 'STAR':
                if (chartSet.star.indexOf(chart) == -1)
                    chartSet.star.push(chart)
                break
            case 'IAP':
                if (chartSet.iap.indexOf(chart) == -1)
                    chartSet.iap.push(chart)
                break
            case 'MIN':
                if (chartSet.min.indexOf(chart) == -1)
                    chartSet.min.push(chart)
                break
            case 'LAH':
                if (chartSet.lah.indexOf(chart) == -1)
                    chartSet.lah.push(chart)
                break
            default:
                break
        }
    })

    console.log(chartData.length)
    console.log(chartSet.apd.length + chartSet.min.length + chartSet.dp.length + chartSet.star.length + chartSet.iap.length + chartSet.lah.length)
    return chartSet
}