import AtisContainer from "@/components/ids/atis/AtisContainer";
import DashboardFooter from "@/components/ids/dashboard/DashboardFooter";
import PanelContainer from "@/components/panels/PanelContainer";

const IdsIndex = () => {
  return (
    <>
      <div className="w-screen h-[calc(100%-140px)] flex flex-row">
          <AtisContainer/>

          <div className="h-full w-[calc(100%-500px)]">
              <PanelContainer/>
              {/* !!! grid panel is here. MAKE SURE ALL CHILDS OF THIS ARE h-full w-full !!!*/}
          </div>

          
      </div>

      <div className="z-10">
          <DashboardFooter/>
      </div>
    </>
    
  )
}

export default IdsIndex
