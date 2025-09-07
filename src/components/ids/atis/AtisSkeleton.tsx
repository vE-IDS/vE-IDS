import { Skeleton } from '@mui/material'

const AtisSkeleton: React.FC = () => {
    return (
        <div className={'flex flex-row px-5 py-6 z-10 even:bg-light-gray odd:bg-mid-gray'}>
            <div>
                <Skeleton className="max-w-18 text-center"/>

                <Skeleton className="bg-green-700 relative w-15 h-15 flex justify-center items-center drop-shadow-md drop-shadow-black"/>
            </div>

            <div className="pl-5 w-100 relative z-0">
                <Skeleton className="h-1/2 w-9/10 mb-2"/>
                <Skeleton className="h-1/2 w-9/10 mb-2"/>
            </div>
        </div>
    )
}

export default AtisSkeleton