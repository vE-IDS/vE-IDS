const getAirportData = (icao?: string) => {
    return {
        test: true,
        meow: 'meow'
    }
}

export default async function Page({params}: Props) {
    const {icao} = await params
    const airportData = await getAirportData(icao)

    return (
        <div>
            <h2>mock airport info</h2>
            <p>{airportData.test}</p>
            <p>{airportData.meow}</p>
        </div>
    )
}

interface Props {
    params: {
        icao: string
    }
}