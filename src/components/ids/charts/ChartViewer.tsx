'use client'
import { getAvailableCharts } from '@/actions/charts'
import { useState } from 'react'
import ChartSelector from './ChartSelector'
import { ChartSet } from '@/types/chart.type'

export default function ChartViewer({icao, chartData}: Props) {
    const [pdfLink, setPdfLink] = useState<string | undefined>(undefined)

    return (
        <div className='w-full h-full bg-black flex flex-row'>
            <div className='h-full w-140 bg-mid-gray'>
                <ChartSelector icao={icao} chartData={chartData} callback={setPdfLink}/>      
            </div>

            <div className='w-full h-full'>
                <iframe src={pdfLink} width="90%" height='90%'>
                </iframe>
            </div>
        </div>
    )
} 

interface Props {
    icao: string | undefined
    chartData: ChartSet | undefined
}