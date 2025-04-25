import { ATIS } from "@/hooks/datafeed"

const Atis: React.FC<Props> = ({data}: Props) => {
    if (!data) {
        return (
            <tr>not implemented</tr>
        )
    }

    /*return (
        <div className={'flex flex-row px-5 py-6 z-10 ' + (i % 2 == 0 ? 'bg-light-gray' :'bg-mid-gray')}>
            <div>
                <h5 class="max-w-18 text-center">{{data.airport}}</h5>

                <div class="bg-green-700 relative w-15 h-15 flex justify-center items-center drop-shadow-md drop-shadow-black">
                    <h1 class="text-center text-3xl">{{data.information}}</h1>
                </div>
            </div>

            <div class="pl-5 w-100 relative z-0">
                <h6 class="max-h-5 w-full">{{data.metar | async}}</h6>

                <div class="flex flex-row gap-x-10 absolute bottom-0">
                    <div *ngIf="data.activeDepartures">
                        <p class="font-bold mb-.5">Departing</p>
                        <div class="flex flex-row gap-x-2">
                            <p class="approach-box bg-black py-.5" *ngFor="let dep of data.activeDepartures">{{dep}}</p>
                        </div>
                    </div>

                    <div *ngIf="data.activeApproaches">
                        <p class="font-bold mb-.5">Arriving</p>
                        <div class="flex flex-row gap-x-2">
                            <p class="approach-box py-.5" *ngFor="let arr of data.activeApproaches">{{arr}}</p>
                        </div>
                    </div>

                    
                </div>
                <div *ngIf="data.status" class="absolute right-5 bottom-0">
                    <h6 class="mb-1">Status</h6>
                    <p [className]="statusColor.toString()">{{data.status}}</p>
                </div>
            </div>
        </div>
    )*/
}

export default Atis

type Props = {
    data?: ATIS
}