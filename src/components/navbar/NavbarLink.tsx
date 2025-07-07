import Link from "next/link"

export default function NavbarLink({children, href}: Props) {
    return (
        <Link className='bg-light-gray p-2 hover:bg-accent transition active:bg-accent' href={href}>
            {children}
        </Link>
    )
}

interface Props {
    children: React.ReactNode
    href: string
}