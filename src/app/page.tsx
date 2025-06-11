import Image from "next/image";
import Link from "next/link";
import BackgroundImage from '../../public/background.jpg'
import LoginButton from "@/components/home/LoginButton";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";

import LogoutButton from "@/components/home/LogoutButton";

export default async function Home() {
    const session = await getServerSession(authOptions)
    
    return (
        <div className='absolute top-0 w-screen h-screen overflow-hidden'>
            <Image className='absolute top-0 left-0 -z-10 object-center overflow-hidden blur-xs' src={BackgroundImage} alt="site background"/>

            
            <div className="home-container">
                <div className="bg-dark-gray flex flex-col h-max justify-center p-5 gap-y-5">
                    <div>
                        <h2 className="font-bold w-full text-center">vE-IDS</h2>
                        <h4>Virtual Enterprise Information Display System</h4>
                    </div>

                    <div className="flex flex-col gap-y-2">
                        {!session?.user && <LoginButton/>}
                        {session?.user && <Link className={`home-button`} href={'/ids'}>IDS Access</Link>}
                        {session?.user && <LogoutButton/>}
                    </div>
                </div>  

                <h3 className='absolute w-full py-2 bg-dark-gray right-0 bottom-0 text-center'>Version <b>{process.env.VERSION}</b></h3>
            </div>
        </div>
    );
}
