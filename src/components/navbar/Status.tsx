"use client"
import { formatDateToZ } from "@/lib/date"
import { Button, Popover, Box, Typography, Stack } from "@mui/material"
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
            <Button 
            onClick={(event: React.MouseEvent<HTMLButtonElement>) => setAnchorE1(event.currentTarget)}
            variant='contained'
            color='secondary'>
                Status
            </Button>
            <Popover
            open={open}
            onClose={() => setAnchorE1(null)}
            anchorEl={anchorE1}
            >     
                <Box
                padding={1}>
                    <Typography>Update Times</Typography>

                    <Stack 
                    direction='row' 
                    justifyContent='space-between' 
                    alignItems='center'>
                        <Typography variant='h6'>ATIS</Typography>
                        <Typography
                        variant='body1'
                        color={atisTimeSince > 60 ? 'palette.warning.primary' : 'palette.success.primary'}
                        >{formatDateToZ(lastUpdated)}</Typography>
                    </Stack>
                </Box>
            </Popover>
        </Box>
       
    )
}

export default Status