'use client'

import { usePathname } from "next/navigation"
import { Button } from '@mui/material'
import {  signOut } from 'next-auth/react'

export default function LogoutButton() {
    const pathName = usePathname()
    
    const handleSignOut = () => {
        signOut()
    }
    
    return (
        <Button
        variant='contained'
        onClick={() => handleSignOut()}
        >
            Log Out
        </Button>
    )
}