import { getServerSession } from "next-auth"
import Clock from "./Clock"
import Status from "./Status"
import HomeIcon from '@mui/icons-material/Home';
import MapIcon from '@mui/icons-material/Map';
import ShieldIcon from '@mui/icons-material/Shield';
import NavbarLink from "./NavbarLink"
import { authOptions } from '@/next-auth/authOptions'
import Link from 'next/link'
import { AppBar, Box, Stack } from '@mui/material';

export default async function Navbar({isAdmin}: Props) {
    const session = await getServerSession(authOptions)

    return (
        <Box>
            <AppBar sx={{height: '60px'}}>
                <Stack 
                height={'100%'}
                direction={'row'}
                alignItems='center'
                marginLeft={2}
                spacing={2}>
                    <Status/>

                    <Clock/>

                    <Link href='/ids' className='flex flex-col'>
                        <h3>vE-IDS</h3>

                        <h6>ZJX ARTCC</h6>
                    </Link>
                </Stack>

                <div className='absolute flex flex-row justify-right items-center gap-x-3 h-full right-0 top-0'>
                    <NavbarLink href='/ids'>
                        <HomeIcon/>
                    </NavbarLink>

                    <NavbarLink href='/ids/charts'>
                        <MapIcon/>
                    </NavbarLink>
                    
                    <NavbarLink href='/admin'>
                        <ShieldIcon/>
                    </NavbarLink>

                    <div className="h-full justify-center flex flex-col items-end mr-4">
                        <h3>{session?.user.firstName} {session?.user.lastName}</h3>
                        <h6>{session?.user.cid}</h6>
                    </div>
                </div>
            </AppBar>
        </Box>
            
    )
}

interface Props {
    isAdmin: boolean
}