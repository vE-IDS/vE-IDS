'use client'
import  { useAtisData, useDatafeedActions } from "@/hooks/datafeed";
import { ReactNode, useEffect, useState } from "react";
import AtisDivider from "./AtisDivider";
import Atis from "./Atis";
import AtisSkeleton from "./AtisSkeleton";
import { FileWarning, Filter, InfoIcon, Link, UsbIcon } from "lucide-react";
import { DialogHeader } from "@/components/ui/dialog";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import router from "next/router";
import FacilityToggle from "./FacilityToggle";
import { FACILITIES } from "@/lib/facilities";
import { Button } from "@/components/ui/button";

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
                list.push(<AtisDivider label={atis.facility.toUpperCase() + ' Facilities'} key={i + 1000}/>)
            }

            list.push(<Atis data={atis} i={i} key={i}/>)
        })

        atisData.sort((a, b) => a.facility > b.facility ? 1 : -1)
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
            <div className="w-full bg-dark-gray border-b-2 mb-2 flex flex-rol justify-center gap-x-5">
                <h4 className="text-center sticky">ATIS Viewer</h4>
                <Dialog>
                    <DialogTrigger>
                        <Filter/>
                    </DialogTrigger>

                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Select Facilities</DialogTitle>
                            <DialogDescription>Select which facilities you would like to see on the ATIS page.</DialogDescription>
                        </DialogHeader>

                        <div className='flex flex-col'>
                            {FACILITIES.map((data) => <FacilityToggle facility={data}/>)}
                        </div>

                        <Button className='bg-accent'>Select All</Button>
                        <Button className='bg-accent'>Select None</Button>
                    </DialogContent>
                </Dialog>
        
            </div>
            <AtisMap/>
        </div>
    )
}

export default AtisContainer

