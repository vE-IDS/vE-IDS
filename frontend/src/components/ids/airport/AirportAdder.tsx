import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

/**
 * ICAO entry control for the Airports panel: validates a 3–4 letter identifier,
 * uppercases it, and calls `onAdd`.
 */
export default function AirportAdder({ onAdd }: { onAdd: (icao: string) => void }) {
  const [value, setValue] = useState('')

  const submit = () => {
    const icao = value.trim().toUpperCase()
    if (!/^[A-Z]{3,4}$/.test(icao)) return
    onAdd(icao)
    setValue('')
  }

  return (
    <div className="panel-no-drag flex gap-1">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value.toUpperCase())}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit()
        }}
        placeholder="Add ICAO…"
        maxLength={4}
        className="h-8 text-xs uppercase"
      />
      <Button size="sm" variant="secondary" onClick={submit} aria-label="Add airport">
        <Plus size={14} />
      </Button>
    </div>
  )
}
