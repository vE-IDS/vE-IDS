import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export const Route = createFileRoute('/ids/info/')({
  component: InfoIndex,
})

function InfoIndex() {
  const [value, setValue] = useState('')
  const navigate = useNavigate()

  const go = () => {
    const icao = value.trim().toUpperCase()
    if (/^[A-Z0-9]{3,4}$/.test(icao)) navigate({ to: '/ids/info/$icao', params: { icao } })
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3">
      <h2 className="text-lg font-semibold">Airport info</h2>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === 'Enter') go()
          }}
          placeholder="Airport ICAO"
          maxLength={4}
          className="w-40"
        />
        <Button onClick={go}>Go</Button>
      </div>
    </div>
  )
}
