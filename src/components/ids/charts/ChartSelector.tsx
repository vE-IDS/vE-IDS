'use client'
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChartButton from "./ChartButton";
import { ChartSet } from "@/types/chart.type";
import { getAvailableCharts } from "@/actions/charts";
import { Input } from "@/components/ui/input";
import { Button } from '@/components/ui/button';
import { ChangeEvent, KeyboardEvent, useRef, useState } from 'react';
import z, { boolean } from 'zod';
import { redirect } from 'next/navigation';
import { toast, useSonner } from 'sonner';
import ChartGrid from './ChartGrid';

export default function ChartSelector({icao, chartData, callback}: Props) {
    const airport = z.string().max(4).refine((data) => {
        const s = data.toUpperCase()

        if (s.length == 4) {
            return /^[A-Z]{4}$/.test(s)
        } else {
            return /^[A-Z0-9]{3,4}$/.test(s)
        }
    }, {message: 'Invalid airport code'})

    const [errorMessage, setErrorMessage] = useState<string>('')
    const [airportCode, setAirportCode] = useState<string>(icao || '')

    const updateAirportInput = (e: ChangeEvent<HTMLInputElement>) => {
        const validation = airport.safeParse(e.target.value)
        setAirportCode(e.target.value.toUpperCase())

        if (!validation.success) {
            setErrorMessage(validation.error.issues[0].message)
        } else {
            setErrorMessage('')
        }
    }

    const handleSearch = () => {
        if (airport.safeParse(airportCode).success) {
            redirect(`/ids/charts/${airportCode}`)
        } else {
            toast('Please input a valid airport code in order to search')
        }
    }

    const handleKeyDown = (key: KeyboardEvent<HTMLInputElement>) => {
        if (key.key === 'Enter') {
            handleSearch
        }
    }

    return (
        <div className='p-2 flex flex-col gap-y-5'>
            <div>
                <h4>Charts</h4>

                <div className='flex flex-row flex-wrap gap-x-2 gap-y-2'>
                    <div className='w-40'>
                        <Input 
                        placeholder='Airport ICAO' 
                        type='text'
                        className='border-0 bg-light-gray w-40 placeholder-white rounded-none drop-shadow-md drop-shadow-black'
                        onChange={updateAirportInput}
                        onKeyDown={handleKeyDown}
                        maxLength={4}
                        value={airportCode}
                        />
                        <h5 className='mt-2'>{errorMessage}</h5>
                    </div>
                    <Input 
                    placeholder='Filter' 
                    type='text'
                    className='border-0 bg-light-gray w-40 placeholder-white rounded-none drop-shadow-md drop-shadow-black'
                    />
                    <Button onClick={handleSearch} className='bg-accent'>Search</Button>
                </div>
            </div>

            {chartData &&
            <div className='flex flex-col gap-y-5 overflow-scroll'>
                <div>
                    <h5 className='mb-2 font-bold'>APD</h5>
                    <ChartGrid charts={chartData.apd} callback={callback} color='bg-blue-900'/>
                </div>

                <div>
                    <h5 className='mb-2 font-bold'>DP</h5>
                    <ChartGrid charts={chartData.dp} callback={callback} color='bg-blue-700'/>
                </div>

                <div>
                    <h5 className='mb-2 font-bold'>STAR</h5>
                    <ChartGrid charts={chartData.star} callback={callback} color='bg-blue-500'/>
                </div>

                <div>
                    <h5 className='mb-2 font-bold'>IAP</h5>
                    <ChartGrid charts={chartData.iap} callback={callback} color='bg-gray-500'/>
                </div>

                <div>
                    <h5 className='mb-2 font-bold'>LAH</h5>
                    <ChartGrid charts={chartData.lah} callback={callback} color='bg-gray-300'/>
                </div>
            </div>
            }
        </div>
    )
}

interface Props {
    icao?: string
    chartData?: ChartSet
    callback: (pdfLink: string) => void
}

/*
<Tabs defaultValue='apd' className='w-full'>
    <TabsList className='flex gap-x-5' color='primary'>
        {chartData.apd.length > 0 && <TabsTrigger className='chart-select border-amber-500' value='apd'>APD</TabsTrigger>}
        {chartData.min.length > 0 && <TabsTrigger className='chart-select border-purple-500' value='min'>MIN</TabsTrigger>}
        {chartData.dp.length > 0 && <TabsTrigger className='chart-select border-blue-500' value='dp'>DP</TabsTrigger>}
        {chartData.star.length > 0 && <TabsTrigger className='chart-select border-pink-500' value='star'>STAR</TabsTrigger>}
        {chartData.iap.length > 0 && <TabsTrigger className='chart-select border-red-500' value='iap'>IAP</TabsTrigger>}
        {chartData.lah.length > 0 && <TabsTrigger className='chart-select border-red-500' value='lah'>LAH</TabsTrigger>}
    </TabsList>
    <TabsContent value='apd' className='flex flex-wrap m-2 gap-2 overflow-y-scroll'>
        {chartData.apd.map((data, i) => <ChartButton key={data.pdfName+ i} chartName={data.chartName}/>)}
    </TabsContent>
    <TabsContent value='min' className='flex flex-wrap m-2 gap-2 overflow-y-scroll'>
        {chartData.min.map((data, i) => <ChartButton key={data.pdfName+ i} chartName={data.chartName}/>)}
    </TabsContent>
    <TabsContent value='dp' className='flex flex-wrap m-2 gap-2 overflow-y-scroll'>
        {chartData.dp.map((data, i) => <ChartButton key={data.pdfName+ i} chartName={data.chartName}/>)}
    </TabsContent>
    <TabsContent value='star' className='flex flex-wrap m-2 gap-2 overflow-y-scroll'>
        {chartData.star.map((data, i) => <ChartButton key={data.pdfName+ i} chartName={data.chartName}/>)}
    </TabsContent>
    <TabsContent value='iap' className='flex flex-wrap m-2 gap-2 overflow-y-scroll'>
        {chartData.iap.map((data, i) => <ChartButton key={data.pdfName+ i} chartName={data.chartName}/>)}
    </TabsContent>
    <TabsContent value='lah' className='flex flex-wrap m-2 gap-2 overflow-y-scroll'>
        {chartData.lah.map((data, i) => <ChartButton key={data.pdfName + i} chartName={data.chartName}/>)}
    </TabsContent>       
</Tabs>
*/