import axios from "axios"
import { VATSIMData } from "@/types/vatsim.type"
import { ATIS } from "@/hooks/datafeed"
import { unstable_cache } from "next/cache"
import { NextResponse } from "next/server"

export const GET = async() => {
    // Get and parse VATSIM data feed
    const vatsimData = await axios.get<VATSIMData>('https://data.vatsim.net/v3/vatsim-data.json')
    
    // Get data from aviationweather.gov and push to atisDTO
    const atisDTOs: ATIS[] = []

    for (const atis of vatsimData.data.atis.filter((data) => data.callsign.charAt(0) == 'K')) {
        const airport = atis.callsign.slice(0, 4)
        const metar = await axios.get<string>(`https://aviationweather.gov/api/data/metar`, {params: {ids: airport}, responseType: 'text'})

        atisDTOs.push(
            {
                airport: airport,
                information: atis.atis_code,
                metar: metar.data,
                status: atis ? 'Online' : 'Offline',
                facility: 'ZMA',
                activeApproaches: ['XXL', 'XXR'],
                activeDepartures:  ['XXL', 'XXR'],
            }
        )
    
    }

    return await Response.json(atisDTOs)
}

export const revalidate = 60
export const fetchCache = 'force-cache'