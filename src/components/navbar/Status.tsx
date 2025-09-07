"use client"
import { formatDateToZ } from "@/lib/date"
import { Button, Popover, Box } from "@mui/material"
import { useLastUpdated } from "@/hooks/datafeed"
import { useEffect, useState } from "react"

const Status: React.FC = () => {
    const lastUpdated = useLastUpdated()
    const [atisTimeSince, setAtisTimeSince] = useState(0)
    const [anchorE1, setAnchorE1] = useState<HTMLButtonElement | null>(null)
    const open = Boolean(anchorE1);

    useEffect(() => {
        setInterval(() => {
            setAtisTimeSince(lastUpdated.getTime() - Date.now())
        }, 1000)
    })

    return (
        <Box>
            <Button onClick={(event: React.MouseEvent<HTMLButtonElement>) => setAnchorE1(event.currentTarget)}>Status</Button>
            <Popover
            open={open}
            onClose={() => setAnchorE1(null)}
            anchorEl={anchorE1}
            >     
                <h5>Update Times</h5>

                <div className='w-full h-full flex justify-between items-center'>
                    <h5>ATIS</h5>
                    <h6
                    className={atisTimeSince > 60 ? 'text-amber-300' : 'text-green-300'}
                    >{formatDateToZ(lastUpdated)}</h6>
                </div>
            </Popover>
        </Box>
       
    )
}

export default Status