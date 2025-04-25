'use client'
import { ATIS } from "@/hooks/datafeed";
import axios from "axios";
import { ReactNode, useEffect, useState } from "react";
import AtisDivider from "./AtisDivider";
import Atis from "./Atis";

const AtisContainer: React.FC = () => {
    const [atisData, setAtisData] = useState<ATIS[]>([])

    useEffect(() => {
            axios.get('/api/atis').then((res) => {
                setAtisData(res.data)
            })
    }, [])

    useEffect(() => {
        setInterval(async() => {
            const response = await axios.get('/api/atis')
            setAtisData(response.data)
            console.log(atisData)
        }, 120000)
    }, [])
    
    const AtisMap = () => {
        const list: ReactNode[] = []

        atisData.map((atis, i) => {
            if (i == 0 || atis.facility != atisData[i-1].facility) {
                list.push(<AtisDivider facility={atis.facility}/>)
            }

            list.push(<Atis data={atis}/>)
        })

        return list
    }

    return (
        <div className="bg-dark-gray w-max top-0 z-0 h-full overflow-y-scroll no-scrollbar" >
            <table className="">
                <tbody>
                        <AtisMap/>
                </tbody>
            </table>
        </div>
    )
}

export default AtisContainer