import { Dialog, DialogContent, DialogHeader, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuTrigger } from "@/components/ui/context-menu"
import { ATIS } from "@/types/atis.type"
import { FileWarning, InfoIcon, UsbIcon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { getFlightCategoryColor, parseAtis } from "@/lib/atisParser"

export default function Atis({data, i}: Props) {
    const router = useRouter()
    const atisParse = parseAtis(data?.rawAtis)
    console.log(atisParse)

    if (!data) {
        return (
            <tr>Loading</tr>
        )
    }

    return (
        <Dialog>
            <ContextMenu>
                <ContextMenuTrigger className=''>
                    <div className={'flex flex-row px-5 py-6 z-10 ' + (i % 2 == 0 ? 'bg-light-gray' : 'odd:bg-mid-gray')}>
                        <div className='flex flex-col justify-center items-center'>
                            <h5 className="max-w-18 text-center">{data.airport}</h5>

                            <div className={`${getFlightCategoryColor(atisParse.flightCategory)} relative w-18 h-18 flex justify-center items-center drop-shadow-md drop-shadow-black`}>
                                <h1 className="text-center text-3xl">{data.information}</h1>
                            </div>
                            {atisParse.atisType == 'DEPARTURE' || atisParse.atisType == 'ARRIVAL' ?
                            <p>{atisParse.atisType.toUpperCase()}</p>
                            : ''}
                        </div>

                        <div className="pl-5 w-100 relative z-0">
                            <h6 className="h-max w-9/10 mb-2">{data.metar}</h6>

                            <div className="flex flex-row gap-x-10">
                                { atisParse?.runways.departureRunways && atisParse.runways.departureRunways.length != 0 ? 
                                    <div>
                                        <p className="font-bold mb-.5">Departing</p>
                                        <div className="flex flex-row gap-x-2">
                                        {atisParse.runways.departureRunways.map((departure, i) => <p className="approach-box py-.5" key={i}>{departure}</p>)}
                                        </div>
                                    </div> : ''
                                }
                                
                                { atisParse?.runways.landingRunways && atisParse.runways.landingRunways.length != 0 ? 
                                    <div>
                                        <p className="font-bold mb-.5">Arriving</p>
                                        <div className="flex flex-row gap-x-2">
                                            {atisParse.runways.landingRunways.map((arrival, i) => <p className="approach-box py-.5" key={i}>{arrival}</p>)}
                                        </div>
                                    </div> : ''
                                }                 
                            </div>

                            <Link href={`/ids/info/${data.airport}`} className="absolute w-max h-max right-5 top-0">
                                <InfoIcon className='w-5 h-5'/>
                            </Link>
                        </div>
                    </div>
                </ContextMenuTrigger>
                <ContextMenuContent className='p-2 flex flex-col gap-y-1'>
                    <ContextMenuLabel className='w-full border-b-2 pb-2'>
                        <h4>{data.airport}</h4>
                        <h6>{data.airportName}</h6>
                    </ContextMenuLabel>
                    <ContextMenuItem>
                        <DialogTrigger className='flex flex-row gap-x-2'>
                            <UsbIcon/> Show raw ATIS
                        </DialogTrigger>
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => router.push(`/ids/info/${data.airport}`)}>
                        <InfoIcon/> Show airport info
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => router.push(`/ids`)}>
                        <FileWarning/> Show NOTAMS
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>

            <DialogContent>
                <DialogHeader>
                <DialogTitle>RAW ATIS - {data.airport}</DialogTitle>
                <DialogDescription>
                    {data.rawAtis}
                </DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>
        
    )
}

type Props = {
    data: ATIS
    i: number
}