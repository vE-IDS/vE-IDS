'use client'

import { formatDate } from "@/lib/date"
import { useState } from "react"

const Clock = () => {
    const [date, setDate] = useState<Date>(new Date())

    setInterval(() => {
        setDate(new Date())
    }, 1000)

    return (
        <div className="bg-light-gray p-2">
            <h4>{formatDate(date)}</h4>
        </div>
    )
}

export default Clock