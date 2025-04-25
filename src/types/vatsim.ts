export type VATSIMData = {
    general: FeedGeneralData
    pilots: FeedPilot[]
    controllers: FeedController[]
    atis: FeedATIS[]
    servers: FeedServers[]
    prefiles: FeedPrefiles[]
    facilities: FeedFacilities[]
    ratings: FeedRating[]
    pilot_ratings: FeedRating[]
    military_ratings: FeedRating[]
}

export type FeedGeneralData = {
    version: number
    update_timestamp: Date
    connected_clients: number
    unique_users: number
}

export type FeedPilot = {
    cid: number
    name: string
    callsign: string
    server: string
    pilot_rating: string
    military_rating: string
    latitude: number
    longitude: number
    altitude: number
    groundspeed: number
    transponder: string
    heading: number
    qnh_i_hg: number
    qnh_mb: number
    flight_plan: FlightPlan
    logon_time: string
    last_updated: string
}

export type FlightPlan = {
    flight_rules: FlightRules
    aircraft: string
    aircraft_faa: string
    aircraft_short: string
    departure: string
    arrival: string
    alternate: string
    deptime: string
    enroute_time: string
    fuel_time: string
    remarks: string
    route: string
    revision_id: number
    assigned_transponder: string
}

export type FeedController = {
    cid: number
    name: string
    callsign: string
    frequency: string
    facility: number
    rating: number
    server: string
    visual_range: number
    text_atis: string[]
    last_updated: Date
    logon_time: Date
}

export type FeedATIS = {
    cid: number
    name: string
    callsign: string
    frequency: string
    facility: number
    rating: number
    server: string
    visual_range: number
    atis_code: string
    text_atis: string[]
    last_updated: Date
    logon_time: Date
}

export type FeedServers = {
    ident: string
    hostname_or_ip: string
    location: string
    name: string
    client_connections_allowed: boolean
    is_sweatbox: boolean
}

export type FeedPrefiles = {
    cid: number
    name: string
    callsign: string
    flight_plan: FlightPlan
    last_updated: Date
}

export type FeedFacilities = {
    id: number
    short: string
    long_name: string
}

export type FeedRating = {
    id: number
    short_name: string
    long_name: string
}

export enum FlightRules {"V", "I"}