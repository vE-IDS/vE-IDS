import type { PanelComponentProps } from '@/components/panels/registry'

/**
 * "Notes" panel: a free-text scratchpad persisted in the panel's own `settings`
 * (and therefore in the saved dashboard) via onSettingsChange.
 */
export default function NotesPanel({ settings, onSettingsChange }: PanelComponentProps) {
  const text = typeof settings?.text === 'string' ? settings.text : ''

  return (
    <textarea
      className="no-scrollbar h-full w-full resize-none bg-transparent text-xs text-white outline-none"
      placeholder="Scratchpad…"
      value={text}
      onChange={(e) => onSettingsChange({ text: e.target.value })}
    />
  )
}
