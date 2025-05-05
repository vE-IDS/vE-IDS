import Clock from "./Clock"
import useDatafeedStore from "@/hooks/datafeed"
import Status from "./Status"

const Navbar: React.FC = () => {
    return (
        <div className='navbar z-10'>
            <div className="flex flex-row items-center gap-x-5 ml-4">
                <Status/>

                <Clock/>

                <h2>vE-IDS - ARTCC</h2>
            </div>

            <div className="absolute top-0 right-0 h-full flex flex-row items-center mr-4">
                <h3>Welcome, USER</h3>
            </div>
        </div>
    )
}

export default Navbar