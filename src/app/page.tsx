import Image from "next/image";
import BackgroundImage from '../../public/background.jpg'
import { getServerSession } from "next-auth";
import { authOptions } from "@/next-auth/authOptions";
import LoginButton from '@/components/home/LoginButton';
import LogoutButton from '@/components/home/LogoutButton';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import Link from 'next/link';

export default async function Home() {
    const session = await getServerSession(authOptions)
    
    return (
        <Box position='absolute' top={0} width='100%' height='100%' overflow='hidden'>
            <Image className='absolute top-0 left-0 -z-10 object-center overflow-hidden blur-xs' src={BackgroundImage} alt="site background"/>

            <Box bgcolor='primary.dark' position='absolute' right={0} height='100%' alignContent={'center'} padding={2}>
                <Paper variant='elevation'>
                    <Stack padding={2} spacing={2}>
                        <Stack>
                            <Typography variant='h4' align='center'>vE-IDS</Typography>
                            <Typography variant='body1' align='center'>Virtual Enterprise Information Display System</Typography>
                        </Stack>

                        <Stack spacing={1}>
                            {!session?.user && <LoginButton/>}
                            {session?.user && <Button variant='contained' component={Link} href={'/ids'}>IDS Access</Button>}
                            {session?.user && <LogoutButton/>}
                        </Stack>
                    </Stack>
                </Paper>

                <h3 className='absolute w-full py-2 bg-dark-gray right-0 bottom-0 text-center'>Version <b>{process.env.VERSION}</b></h3>
            </Box>
        </Box>
    );
}
