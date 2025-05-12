import axios from "axios"

export const getAirportData = async(icao?: string): Promise<Airport | undefined> => {
    if (!icao) {
        return undefined
    }
    
    icao = icao.toUpperCase()

    const response = await fetch(`https://api.aviationapi.com/v1/airports?apt=${icao}`, 
        {
            next: {
                revalidate: 86400
            }
        }
    )

    if (response.status >= 400) {
        console.error('Error status ' + response.status)
        return undefined
    }
    
    const data = await response.json()

    if (!data || !data[icao] || !data[icao][0]) {
        return undefined
    }

    return data[icao][0]
}