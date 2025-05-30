import { getAirportData } from "@/actions/airport"

export default async function ({ params }: Props) {
    const { icao } = await params
    const airportData = await getAirportData(icao)
    

    console.log(airportData)
    if (!airportData) {
        return <h2>no data</h2>
    }

    return (
        <div className='p-2'>
            <div className='p-2 bg-light-gray w-max'>
                <h2>{airportData.icao_ident} - {airportData.facility_name}</h2>
                <p>{airportData.city}, {airportData.county} COUNTY, {airportData.state_full}</p>
            </div>

            <div>
                <h2>General Info</h2>
                
            </div>
        </div>
    )
}

interface Props {
    params: Promise<{
        icao: string
    }>
}

export const revalidate = 86400 // 1 day