'use client'
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useDatafeedActions, useIncludedFacilities } from "@/hooks/datafeed"
import { useEffect, useState } from "react"

export default function FacilityToggle({facility}: Props) {
    const includedFacilities = useIncludedFacilities()
    const {toggleFacility, parseAtis} = useDatafeedActions()
    const [isChecked, setIsChecked] = useState<boolean>(includedFacilities.includes(facility))

    useEffect(() => {
        setIsChecked(includedFacilities.includes(facility))
    }, [includedFacilities])

    const toggle = () => {
        setIsChecked(e => !e)
        toggleFacility(facility)
        parseAtis()
    }
    return (
        <div className='w-40'>
            <div className='flex flex-row justify-evenly items-center gap-x-2'>
                <h4>{facility}</h4>

                <Switch 
                checked={isChecked} 
                onClick={() => toggle()}
                className='data-[state=checked]:bg-accent'/>
            </div>
            
            <Separator/>
        </div>
            
    )
}

interface Props {
    facility: string
}