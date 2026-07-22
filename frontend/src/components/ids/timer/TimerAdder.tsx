import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

/**
 * Parse a duration entered as `m:ss` (e.g. `2:30`) or plain seconds (e.g. `90`).
 * Returns total seconds, or null if unparseable / non-positive.
 */
export function parseDuration(input: string): number | null {
  const trimmed = input.trim()
  const mmss = trimmed.match(/^(\d+):([0-5]?\d)$/)
  if (mmss) {
    const total = parseInt(mmss[1], 10) * 60 + parseInt(mmss[2], 10)
    return total > 0 ? total : null
  }
  if (/^\d+$/.test(trimmed)) {
    const total = parseInt(trimmed, 10)
    return total > 0 ? total : null
  }
  return null
}

export default function TimerAdder({ onAdd }: { onAdd: (seconds: number) => void }) {
  const [value, setValue] = useState('')

  const submit = () => {
    const seconds = parseDuration(value)
    if (seconds === null) return
    onAdd(seconds)
    setValue('')
  }

  return (
    <div className="flex gap-1">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit()
        }}
        placeholder="m:ss or sec"
        className="h-8 text-xs"
      />
      <Button size="sm" variant="secondary" onClick={submit} aria-label="Add timer">
        <Plus size={14} />
      </Button>
    </div>
  )
}
