import { FACILITIES } from '@/lib/facilities';
import { ATIS } from '@/types/atis.type';
import axios from 'axios';
import { create } from 'zustand'
import AtisDivider from '@/components/ids/atis/AtisDivider';
import Atis from '@/components/ids/atis/Atis';
import { ReactNode } from 'react';

const useDatafeedStore = create<DatafeedStore>((set) => ({
    atisData: [] as ATIS[],
    atisMap: [] as ReactNode[],
    lastUpdated: new Date(),
    includedFacilities: [...FACILITIES],
    actions: {
        updateAtis: async() => {
            const response = await axios.get<ATIS[]>('/api/atis')
            set({
                atisData: response.data,
                lastUpdated: new Date()
            })
        },

        toggleFacility: (facility: string) => {
            set((state) => {
                const index = state.includedFacilities.indexOf(facility)
                if (index == -1) {
                    state.includedFacilities.push(facility)
                } else {
                    state.includedFacilities = state.includedFacilities.filter((fac) => fac != facility)
                }

                return state
            })
        },

        selectAllFacilities: () => {
            set((state) => {
                state.includedFacilities = [...FACILITIES]
                return state
            })
        },

        removeAllFacilities: () => {
            set((state) => {
                state.includedFacilities = []
                return state
            })
        },

        parseAtis: () => {
            set((state) => {
                const newList = []
                state.atisData.map((atis, i) => {
                    if (state.includedFacilities.includes(atis.facility)) {
                        if (i == 0 || atis.facility != state.atisData[i-1].facility) {
                            newList.push(<AtisDivider label={atis.facility.toUpperCase() + ' Facilities'} key={i + 1000}/>)
                        }

                        newList.push(<Atis data={atis} i={i} key={i}/>)
                    }
                })

                if (newList.length == 0) {
                    newList.push(<h2 className='w-full text-center'>No ATISs Available</h2>)
                }

                return {
                    atisMap: newList
                }
            })
        }
    }
}));

export const useAtisData = () => useDatafeedStore<ATIS[]>((state) => state.atisData)
export const useAtisMap = () => useDatafeedStore<ReactNode[]>((state) => state.atisMap)
export const useLastUpdated = () => useDatafeedStore<Date>((state) => state.lastUpdated)
export const useIncludedFacilities = () => useDatafeedStore<string[]>((state) => state.includedFacilities)
export const useDatafeedActions = () => useDatafeedStore<DatafeedActions>((state) => state.actions)

interface DatafeedStore {
    atisData: ATIS[]
    atisMap: ReactNode[]
    lastUpdated: Date
    actions: DatafeedActions
    includedFacilities: string[]
}

interface DatafeedActions {
    updateAtis: () => Promise<void>
    toggleFacility: (facility: string) => void
    parseAtis: () => void
    selectAllFacilities: () => void
    removeAllFacilities: () => void
}