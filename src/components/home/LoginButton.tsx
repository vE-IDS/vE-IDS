'use client'

import { usePathname } from "next/navigation"
import { Button } from '@mui/material'
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
        variant='contained'
        onClick={() => handleSignIn()}
        >
            Sign in with VATSIM
        </Button>
    )
}