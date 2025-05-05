import { ATIS } from "@/hooks/datafeed"

const Atis: React.FC<Props> = ({data}: Props) => {
    if (!data) {
        return (
            <tr>Loading</tr>
        )
    }

    return (
        <div className={'flex flex-row px-5 py-6 z-10 even:bg-light-gray odd:bg-mid-gray'}>
            <div>
                <h5 className="max-w-18 text-center">{data.airport}</h5>

                <div className="bg-green-700 relative w-15 h-15 flex justify-center items-center drop-shadow-md drop-shadow-black">
                    <h1 className="text-center text-3xl">{data.information}</h1>
                </div>
            </div>

            <div className="pl-5 w-100 relative z-0">
                <h6 className="h-max w-9/10 mb-2">{data.metar}</h6>

                <div className="flex flex-row gap-x-10">
                    <div>
                        <p className="font-bold mb-.5">Departing</p>
                        <div className="flex flex-row gap-x-2">
                        {data.activeDepartures?.map((departure, i) => <p className="approach-box py-.5" key={i}>{departure}</p>)}
                        </div>
                    </div>

                    <div>
                        <p className="font-bold mb-.5">Arriving</p>
                        <div className="flex flex-row gap-x-2">
                            {data.activeApproaches?.map((arrival, i) => <p className="approach-box py-.5" key={i}>{arrival}</p>)}
                        </div>
                    </div>

                    
                </div>
                <div className="absolute right-5 bottom-0">
                    
                </div>
            </div>
        </div>
    )
}

export default Atis

type Props = {
    data?: ATIS
}