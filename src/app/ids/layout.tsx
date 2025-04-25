import Navbar from "@/components/navbar/Navbar"

const IDSLayout: React.FC<Props> = ({children}: Props) => {
    return (
        <div className="bg-mid-gray w-screen h-screen overflow-hidden">
            <Navbar/>

            {children}
        </div>
    )
}

export default IDSLayout

type Props = {
    children: React.ReactNode
}