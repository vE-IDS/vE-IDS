'use client'
import AtisContainer from "@/components/ids/atis/AtisContainer"
import DashboardFooter from "@/components/ids/DashboardFooter"
import Navbar from "@/components/navbar/Navbar"

const IDSLayout: React.FC<Props> = ({children}: Props) => {
    return (
        <div className="bg-mid-gray w-screen h-screen overflow-hidden flex flex-col">
            <Navbar/>

            <div className="w-screen h-[calc(100%-140px)] flex flex-row">
                <AtisContainer/>

                <div className="h-full w-[calc(100%-500px)]">
                    {children}
                    {/* !!! grid panel is here. MAKE SURE ALL CHILDS OF THIS ARE h-full w-full !!!*/}
                </div>

                
            </div>

            <div className="z-10">
                <DashboardFooter/>
            </div>
        </div>
    )
}

export default IDSLayout

type Props = {
    children: React.ReactNode
}