import { Button, IconButton } from '@mui/material'
import Link from "next/link"

export default function NavbarLink({children, href}: Props) {
    return (
        <Link href={href}>
            <Button 
            color='primary'
            variant='contained'>
                {children}
            </Button>
        </Link>
    )
}

interface Props {
    children: React.ReactNode
    href: string
}