'use client'

import { usePathname } from "next/navigation"
import { Button } from "../ui/button"
import {  signOut } from 'next-auth/react'

export default function LogoutButton() {
    
    const pathName = usePathname()
    
    const handleSignOut = () => {
        signOut()
    }
    return (
        <Button
        className='home-button text-lg rounded-none font-light transition hover:bg-accent'
        onClick={() => handleSignOut()}
        >
            Log Out
        </Button>
    )
}