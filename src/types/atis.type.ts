export type ATIS = {
    airport: string
    airportName: string
    information?: string
    metar: string
    status?: string
    facility: string
    activeApproaches?: string[]
    activeDepartures?: string[]
    rawAtis: string
}