import Navbar from "@/components/navbar/Navbar"
import { Box, Stack } from '@mui/material'

const IDSLayout: React.FC<Props> = ({children}: Props) => {
    return (
        <Stack direction={'column'}>
            <Box height={'60px'}>
                <Navbar isAdmin/>
            </Box>

            {children}
        </Stack>
    )
}

export default IDSLayout

type Props = {
    children: React.ReactNode
}