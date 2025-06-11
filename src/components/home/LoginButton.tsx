'use client'

import { usePathname } from "next/navigation"
import { Button } from "../ui/button"
import { signIn } from 'next-auth/react'

export default function LoginButton() {
    
    const pathName = usePathname()
    
    const handleSignIn = () => {
        signIn('vatsim', {
            callbackUrl: pathName
        })
    }
    return (
        <Button
        className='home-button text-lg rounded-none font-light transition hover:bg-accent'
        onClick={() => handleSignIn()}
        >
            Sign in with VATSIM
        </Button>
    )
}