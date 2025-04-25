import Image from "next/image";
import Link from "next/link";
import BackgroundImage from '../../../public/background.jpg'
import DashboardFooter from "@/components/ids/DashboardFooter";
import AtisContainer from "@/components/ids/atis/AtisContainer";

const Home = () => {
  return (
    <div className="w-screen h-screen">
        <AtisContainer/>
        <div className="h-[calc(100%-140px)] flex flex-row">
            


            <div className="grid-container grid-flow-col grid grid-cols-4 gap-x-1 gap-y-1 overflow-y-scroll z-20">
                
            </div>
        </div>

        <div className="z-10">
            <DashboardFooter/>
        </div>
    </div>
  );
}

export default Home
