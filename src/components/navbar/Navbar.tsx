import { getServerSession } from "next-auth"
import Clock from "./Clock"
import Status from "./Status"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { Home, Map } from "lucide-react"
import NavbarLink from "./NavbarLink"

export default async function Navbar() {
    const session = await getServerSession(authOptions)

    return (
        <div className='navbar z-10'>
            <div className="flex flex-row items-center gap-x-5 ml-4">
                <Status/>

                <Clock/>

                <h2>vE-IDS - ZJX ARTCC</h2>
            </div>

            <div className='absolute flex flex-row justify-right items-center gap-x-3 h-full right-0 top-0'>
                <NavbarLink href='/ids'>
                    <Home/>
                </NavbarLink>

                <NavbarLink href='/ids/charts'>
                    <Map/>
                </NavbarLink>
                
                <div className="h-full justify-center flex flex-col items-end mr-4">
                    <h3>{session?.user.firstName} {session?.user.lastName}</h3>
                    <h6>{session?.user.cid}</h6>
                </div>
            </div>
        </div>
    )
}