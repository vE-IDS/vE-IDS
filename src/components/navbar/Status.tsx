"use client"
import { formatDateToZ } from "@/lib/date"
import { Button } from "../ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel } from "../ui/dropdown-menu"
import { useLastUpdated } from "@/hooks/datafeed"
import { useEffect, useState } from "react"

const Status: React.FC = () => {
    const lastUpdated = useLastUpdated()
    const [atisTimeSince, setAtisTimeSince] = useState(0)

    useEffect(() => {
        setInterval(() => {
            setAtisTimeSince(lastUpdated.getTime() - Date.now())
        }, 1000)
    })

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="secondary">Status</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuLabel>
                    <h5>Update Times</h5>
                </DropdownMenuLabel>
                <DropdownMenuItem className="border-b-1">
                    <div className='w-full h-full flex justify-between items-center'>
                        <h5>ATIS</h5>
                        <h6
                        className={atisTimeSince > 60 ? 'text-amber-300' : 'text-green-300'}
                        >{formatDateToZ(lastUpdated)}</h6>
                    </div>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default Status