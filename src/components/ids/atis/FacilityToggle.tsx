import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

export default function FacilityToggle({facility}: Props) {
    return (
        <div className='w-40'>
            <div className='flex flex-row justify-evenly items-center gap-x-2'>
                <h4>{facility}</h4>

                <Switch className='data-[state=checked]:bg-accent'/>

                
            </div>
            
            <Separator/>
        </div>
            
    )
}

interface Props {
    facility: string
}