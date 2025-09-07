'use client'
import  { useAtisMap, useDatafeedActions } from "@/hooks/datafeed";
import { Suspense, useEffect, useState } from "react";
import FacilityToggle from "./FacilityToggle";
import { FACILITIES } from "@/lib/facilities";
import AtisSkeleton from "./AtisSkeleton";
import { Box, Button, Dialog, DialogContent, DialogTitle, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import FilterAltIcon from '@mui/icons-material/FilterAlt';

const AtisContainer: React.FC = () => {
    const atisMap = useAtisMap()
    const {updateAtis, parseAtis, selectAllFacilities, removeAllFacilities} = useDatafeedActions()
    const [dialogOpen, setDialogOpen] = useState<boolean>(false)

    useEffect(() => {
        updateAtis().then(() => {
            parseAtis()
        })
        
        const interval = setInterval(async() => {
            await updateAtis()
            parseAtis()
        }, 120000)

        return clearInterval(interval)
    }, [])

    const onSelectAll = (() => {
        selectAllFacilities()
        parseAtis()
    })

    const onRemoveAll = (() => {
        removeAllFacilities()
        parseAtis()
    })

    const handleClose = () => {
        setDialogOpen(false)
    }

    return (
        <Box bgcolor={'palette.primary.dark'} borderRight={1} width={480} overflow={'scroll'} className='no-scrollbar'>
            <div className="w-full bg-dark-gray border-b-2 mb-2 flex flex-rol justify-center gap-x-5">
                <Suspense fallback={<AtisSkeleton/>}>
                    <Stack direction='row' alignItems={'center'}>
                        <Typography variant='h5'>ATIS Viewer</Typography>
                    
                        <Tooltip title='Set Facility Filter'>
                            <IconButton
                            onClick={() => setDialogOpen(true)}>
                                <FilterAltIcon/>
                            </IconButton>
                        </Tooltip> 
                    </Stack>
            
                    <Dialog
                    onClose={handleClose}
                    open={dialogOpen}
                    >
                        <DialogTitle>Select Facilities to Display</DialogTitle>
                        <IconButton
                            
                            aria-label="close"
                            onClick={handleClose}
                            sx={(theme) => ({
                                position: 'absolute',
                                right: 8,
                                top: 8,
                                color: theme.palette.primary.light,
                            })}
                        >
                            <FilterAltIcon/>
                        </IconButton>

                        <DialogContent>
                            <div className='flex flex-col'>
                                {FACILITIES.map((data) => <FacilityToggle facility={data}/>)}
                            </div>

                            <Button className='bg-accent' onClick={onSelectAll}>Select All</Button>
                            <Button className='bg-accent' onClick={onRemoveAll}>Select None</Button>
                        </DialogContent>
                    </Dialog>
                </Suspense>
            </div>
            
            {atisMap}
        </Box>
    )
}

export default AtisContainer

