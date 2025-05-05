import axios from 'axios';
import { create } from 'zustand'

const useDatafeedStore = create<DatafeedStore>((set) => ({
    atisData: [] as ATIS[],
}));

export const updateDatafeed = async() => {
    const response = await axios.get('/api/atis')
    useDatafeedStore.setState((state) => state.atisData = response.data)
}

export default useDatafeedStore

interface DatafeedStore {
    atisData: ATIS[]
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