'use client'
import { Button, Typography } from "@mui/material";
import {  useRef, useState } from "react";

export default function TimerButton({time}: Props) {
    const [localTime, setLocalTime] = useState<number>(time)
    const timeStamp = useRef<number>(undefined)
    const isTimerOn = useRef<boolean>(false)
    const interval = useRef<NodeJS.Timeout | undefined>(undefined)

    const onClick = () => {
        isTimerOn.current = !isTimerOn.current

        if (isTimerOn.current) {
            timeStamp.current = Date.now() + time * 1000

            interval.current = setInterval(() => {
                console.log('ran')
                if (timeStamp.current) {
                    setLocalTime((timeStamp.current - Date.now()) / 1000)

                    if ((timeStamp.current - Date.now()) / 1000 <= 0) {
                        isTimerOn.current = false
                        setLocalTime(0) 
                    }
                }
            }, 500);
        } else {
            if (interval.current) {
                clearInterval(interval.current)
            }

            setLocalTime(time)
        }
    }

    return (
        <Button variant='outlined' color='warning' onClick={onClick}>
            <Typography variant='h3' color='warning'>
                {Math.floor(localTime / 60)}:{Math.floor(localTime - Math.floor(60 * Math.floor(localTime / 60))).toString().padStart(2, "0")}
            </Typography>
        </Button>
    )
}

interface Props {
    time: number
}