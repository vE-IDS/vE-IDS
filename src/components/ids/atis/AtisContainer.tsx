'use client'
import  { useAtisMap, useDatafeedActions } from "@/hooks/datafeed";
import { Suspense, useEffect } from "react";
import { Filter } from "lucide-react";
import { DialogHeader } from "@/components/ui/dialog";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import FacilityToggle from "./FacilityToggle";
import { FACILITIES } from "@/lib/facilities";
import { Button } from "@/components/ui/button";
import AtisSkeleton from "./AtisSkeleton";

const AtisContainer: React.FC = () => {
    const atisMap = useAtisMap()
    const {updateAtis, parseAtis, selectAllFacilities, removeAllFacilities} = useDatafeedActions()

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

    return (
        <div className="bg-dark-gray w-120 top-0 z-0 h-full overflow-y-scroll no-scrollbar" >
            <div className="w-full bg-dark-gray border-b-2 mb-2 flex flex-rol justify-center gap-x-5">
                <h4 className="text-center sticky">ATIS Viewer</h4>
                <Suspense fallback={<AtisSkeleton/>}>
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

                            <Button className='bg-accent' onClick={onSelectAll}>Select All</Button>
                            <Button className='bg-accent' onClick={onRemoveAll}>Select None</Button>
                        </DialogContent>
                    </Dialog>
                </Suspense>
            </div>
            
            {atisMap}
        </div>
    )
}

export default AtisContainer

