'use client'
import useDatafeedStore, { ATIS, updateDatafeed } from "@/hooks/datafeed";
import axios from "axios";
import { ReactNode, useEffect, useState } from "react";
import AtisDivider from "./AtisDivider";
import Atis from "./Atis";

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

    return (
        <div className="bg-dark-gray w-max top-0 z-0 h-full overflow-y-scroll no-scrollbar" >
            <div className="">
                <AtisMap/>
            </div>
        </div>
    )
}

export default AtisContainer