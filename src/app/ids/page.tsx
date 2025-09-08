import AtisContainer from "@/components/ids/atis/AtisContainer";
import DashboardFooter from "@/components/ids/dashboard/DashboardFooter";
import PanelContainer from "@/components/panels/PanelContainer";
import { Stack } from '@mui/material';

const IdsIndex = () => {
  return (
    <>
      <Stack 
      width={'100vw'}
      height={'calc(100%-140px)'}
      overflow={'hidden'}
      direction={'row'}>
          <AtisContainer/>

          <div className="h-full w-[calc(100%-500px)]">
              <PanelContainer/>
              {/* !!! grid panel is here. MAKE SURE ALL CHILDS OF THIS ARE h-full w-full !!!*/}
          </div>

          
      </Stack>

      <div className="z-10">
          <DashboardFooter/>
      </div>
    </>
    
  )
}

export default IdsIndex
