'use client'
import useDatafeedStore, { ATIS, updateDatafeed } from "@/hooks/datafeed";
import { ReactNode, useEffect, useState } from "react";
import AtisDivider from "./AtisDivider";
import Atis from "./Atis";
import AtisSkeleton from "./AtisSkeleton";

const AtisContainer: React.FC = () => {
    const datafeedStore = useDatafeedStore()

    useEffect(() => {
            updateDatafeed()
    }, [])

    useEffect(() => {
        setInterval(async() => {
            updateDatafeed()
        }, 120000)
    }, [])
    
    const AtisMap = () => {
        const list: ReactNode[] = []

        datafeedStore.atisData.map((atis, i) => {
            if (i == 0 || atis.facility != datafeedStore.atisData[i-1].facility) {
                list.push(<AtisDivider facility={atis.facility} key={i + 1000}/>)
            }

            list.push(<Atis data={atis} key={i}/>)
        })

        return list
    }

    if (datafeedStore.atisData.length == 0) {
        return (
            <div className="bg-dark-gray w-120 top-0 z-0 h-full overflow-y-scroll no-scrollbar" >
                <AtisSkeleton/>
                <AtisSkeleton/>
                <AtisSkeleton/>
                <AtisSkeleton/>
                <AtisSkeleton/>
                <AtisSkeleton/>
                <AtisSkeleton/>
            </div>
        )
    }
    return (
        <div className="bg-dark-gray w-120 top-0 z-0 h-full overflow-y-scroll no-scrollbar" >
            <AtisMap/>
        </div>
    )
}

export default AtisContainer