import Navbar from "@/components/navbar/Navbar"
import { Toaster } from 'sonner'

export default function AdminLayout({children}: Props) {
    return (
        <div className="bg-mid-gray w-screen h-screen overflow-hidden flex flex-col">
            <Navbar isAdmin/>

            {children}

        </div>
    )
}

type Props = {
    children: React.ReactNode
}