import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from '@/components/ui/select';
import { FACILITIES } from '@/lib/facilities';

export default function OptionSelector() {
    const facilities: React.ReactNode[] = []

    {FACILITIES.map((f) => {
        facilities.push(<SelectItem key={f} value={f}/>)
    })}

    return (
        <div className='w-100 h-full bg-dark-gray'>
            <Select>
                <SelectTrigger className='bg-light-gray w-50 flex flex-row px-5'>
                    <SelectValue placeholder='Select a Facility'/>
                </SelectTrigger>
                <SelectContent className='bg-light-gray'>
                    {facilities}
                </SelectContent>
            </Select>
        </div>
    )
}