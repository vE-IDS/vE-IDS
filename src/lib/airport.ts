import axios from "axios"

export const getAirportData = async(icao?: string): Promise<Airport | undefined> => {
    console.log('ran ' + icao)
    if (!icao) {
        return undefined
    }
    
    icao = icao.toUpperCase()

    const response = await axios.get<Airport[]>('https://api.aviationapi.com/v1/airports', 
        {
            params: {apt: icao}
        }
    )

    if (response.status >= 400) {
        console.error('Error status ' + response.status)
        return undefined
    }
    
    const data = response.data

    // @ts-expect-error this schema is organized stupidly lol
    const pop = response.data[icao]
    if (!pop || !pop[0]) {
        return undefined
    }

    return pop[0]
}