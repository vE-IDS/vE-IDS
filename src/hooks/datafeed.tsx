import axios from 'axios';
import { create } from 'zustand'

const useDatafeedStore = create<DatafeedStore>((set) => ({
    atisData: [] as ATIS[],
    lastUpdated: undefined
}));

export const updateDatafeed = async() => {
    const response = await axios.get('/api/atis')
    useDatafeedStore.setState((state) => state.atisData = response.data)
}

export const setAtis = async(data: ATIS[]) => {
    useDatafeedStore.setState((state) => {
        state.atisData = data
        state.lastUpdated = new Date()
        return state
    })
}

export default useDatafeedStore

interface DatafeedStore {
    atisData: ATIS[]
    lastUpdated?: Date
}

export interface ATIS {
    airport: string
    information?: string
    metar: string
    status?: string
    facility: string
    activeApproaches?: string[]
    activeDepartures?: string[]
}