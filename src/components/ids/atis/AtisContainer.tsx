'use client'
import  { ATIS, useAtisData, useDatafeedActions } from "@/hooks/datafeed";
import { ReactNode, useEffect, useState } from "react";
import AtisDivider from "./AtisDivider";
import Atis from "./Atis";
import AtisSkeleton from "./AtisSkeleton";

const AtisContainer: React.FC = () => {
    const atisData = useAtisData()
    const {updateAtis} = useDatafeedActions()

    useEffect(() => {
            updateAtis()
    }, [])

    useEffect(() => {
        setInterval(async() => {
            updateAtis()
        }, 120000)
    }, [])
    
    const AtisMap = () => {
        const list: ReactNode[] = []

        atisData.map((atis, i) => {
            if (i == 0 || atis.facility != atisData[i-1].facility) {
                list.push(<AtisDivider facility={atis.facility} key={i + 1000}/>)
            }

            list.push(<Atis data={atis} i={i} key={i}/>)
        })

        return list
    }

    if (atisData.length == 0) {
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