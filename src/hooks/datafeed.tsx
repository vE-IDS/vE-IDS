import { create } from 'zustand'
import { shallow } from 'zustand/shallow';
import axios from "axios"
import { VATSIMData } from "@/types/vatsim"

const useDatafeedStore = create<DatafeedStore>((set) => ({
    atisData: [] as ATIS[],
}));

interface DatafeedStore {
    atisData: ATIS[]
}

export default useDatafeedStore

export type ATIS = {
    airport: string
    information?: string
    metar: string
    status?: string
    facility: string
    activeApproaches?: string[]
    activeDepartures?: string[]
  }