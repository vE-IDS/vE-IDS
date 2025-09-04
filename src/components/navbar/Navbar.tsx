import { getServerSession } from "next-auth"
import Clock from "./Clock"
import Status from "./Status"
import { Home, Map } from "lucide-react"
import NavbarLink from "./NavbarLink"
import { authOptions } from '@/next-auth/authOptions'
import Link from 'next/link'

export default async function Navbar() {
    const session = await getServerSession(authOptions)

    return (
        <div className='navbar z-10'>
            <div className="flex flex-row items-center gap-x-5 ml-4">
                <Status/>

                <Clock/>

                <Link href='/ids' className='flex flex-col'>
                    <h3>vE-IDS</h3>

                    <h6>ZJX ARTCC</h6>
                </Link>
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