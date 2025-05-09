import axios from 'axios';
import { create } from 'zustand'

const useDatafeedStore = create<DatafeedStore>((set) => ({
    atisData: [] as ATIS[],
    lastUpdated: new Date(),
    actions: {
        updateAtis: async() => {
            const response = await axios.get<ATIS[]>('/api/atis')
            set({
                atisData: response.data,
                lastUpdated: new Date()
            })
        }
    }
}));

export const useAtisData = () => useDatafeedStore<ATIS[]>((state) => state.atisData)
export const useLastUpdated = () => useDatafeedStore<Date>((state) => state.lastUpdated)
export const useDatafeedActions = () => useDatafeedStore<DatafeedActions>((state) => state.actions)

interface DatafeedStore {
    atisData: ATIS[]
    lastUpdated: Date
    actions: DatafeedActions
}

interface DatafeedActions {
    updateAtis: () => Promise<void>
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