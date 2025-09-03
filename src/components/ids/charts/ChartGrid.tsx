import { Chart } from '@/types/chart.type';
import ChartButton from './ChartButton';

export default function ChartGrid({charts, color, callback}: Props) {
    return (
        <div className='grid grid-cols-3 gap-2 w-full h-max'>
            {charts.map((v, i) => <ChartButton key={i} chart={v} color={color} callback={callback}/>)}
        </div>
    )
}

interface Props {
    charts: Chart[]
    color: string
    callback: (pdfLink: string) => void
}