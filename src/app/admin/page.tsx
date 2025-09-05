import OptionSelector from '@/components/admin/options/OptionSelector'

export default function Page() {
    return (
        <>
            <div className="w-screen h-full flex flex-row">
                <OptionSelector/>

                <div className="h-full w-[calc(100%-500px)]">
                    
                    {/* !!! grid panel is here. MAKE SURE ALL CHILDS OF THIS ARE h-full w-full !!!*/}
                </div>

                
            </div>
        </>
        
    )
}