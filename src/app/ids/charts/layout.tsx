'use client'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { z } from 'zod'

export default function Charts ({children}: Props) {
    const airport = z.string()
    .toLowerCase()
    .length(4, 'Must be four characters.')
    
    const [errorMessage, setErrorMessage] = useState<string>('')

    const updateAirport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const data = airport.safeParse(e.target.value)
        if (data.success) {
            setErrorMessage('')
        } else {
            console.log(data.error.message)
            setErrorMessage(data.error.issues[0].message)
        }
    }

    return (
        <div className='w-full h-full bg-black'>
            <div className='h-full w-100 bg-mid-gray'>
                
            </div>
        </div>
    )
}

interface Props {
    children: React.ReactNode
}