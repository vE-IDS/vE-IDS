"use client"
import { DropdownMenuLabel } from "@radix-ui/react-dropdown-menu"
import { Button } from "../ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "../ui/dropdown-menu"
import useDatafeedStore from "@/hooks/datafeed"

const Status: React.FC = () => {
    const datafeed = useDatafeedStore()
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="secondary">Datafeed</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuLabel>
                    <h2>ATIS</h2>
                    <h2>{datafeed.lastUpdated?.toString()}</h2>
                </DropdownMenuLabel>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default Status