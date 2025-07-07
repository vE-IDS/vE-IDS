import { JSX } from "react"

const Panel: React.FC<Props> = ({title, children, colspan, rowspan}: Props) => {
    return (
        <div className={`w-full m-1 border-1 border-gray bg-black h-full col-span-${colspan ? colspan : 1} row-span-${rowspan ? rowspan : 1}`}>
            <h3 className='bg-gray text-center py-1 font-semibold'>{title?.toUpperCase()}</h3>

            <div className='p-1'>
                {children}
            </div>
        </div>
    )
}

interface Props {
    title?: string
    children?: React.ReactNode
    colspan?: number
    rowspan?: number
}

export default Panel