import axios from "axios"
import { VATSIMData } from "@/types/vatsim.type"
import { getAirportData } from "@/actions/airport"
import { ATIS } from "@/types/atis.type"

export async function GET() {
    // Get and parse VATSIM data feed
    const vatsimData = await axios.get<VATSIMData>('https://data.vatsim.net/v3/vatsim-data.json')
    
    // Get data from aviationweather.gov and push to atisDTO
    const atisDTOs: ATIS[] = []

    for (const atis of vatsimData.data.atis.filter((data) => data.callsign.charAt(0) == 'K')) {
        const airport = atis.callsign.slice(0, 4)
        const airportData = await getAirportData(airport)

        const metar = await axios.get<string>(`https://aviationweather.gov/api/data/metar`, {params: {ids: airport}, responseType: 'text'})
        let rawAtis = ''
        atis.text_atis?.map((e) => {rawAtis += ' ' + e})

        atisDTOs.push(
            {
                airport: airport,
                airportName: airportData?.facility_name || '',
                information: atis.atis_code,
                metar: metar.data,
                status: atis ? 'Online' : 'Offline',
                facility: airportData?.responsible_artcc || '',
                rawAtis: rawAtis
            }
        )
    
    }

    return await Response.json(atisDTOs)
}

export const revalidate = 60
export const fetchCache = 'force-cache'