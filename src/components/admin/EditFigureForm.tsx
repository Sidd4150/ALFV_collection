'use client'

import { useState, useTransition, useRef } from 'react'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateFigure } from '@/app/actions/figures'

const SERIES = ['Dragon Ball Z', 'Dragon Ball Super', 'Dragon Ball GT', 'Dragon Ball Daima']

type FigureData = {
  id: string
  name: string
  character: string
  series: string
  arc: string | null
  releaseDate: string | null
  msrp: number | null
  isWebExclusive: boolean
  isRerelease: boolean
  isThirdParty: boolean
}

function toMonthValue(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function EditFigureForm({ figure }: { figure: FigureData }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      try {
        await updateFigure(figure.id, formData)
        setOpen(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update figure')
      }
    })
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="shrink-0 gap-1"
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o) }}
      >
        <Pencil className="h-3.5 w-3.5" />
        Edit
      </Button>

      {open && (
        <div className="border-t border-border p-4 bg-muted/30" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Name *</label>
                <Input name="name" defaultValue={figure.name} required />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Character *</label>
                <Input name="character" defaultValue={figure.character} required />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Series *</label>
                <select
                  name="series"
                  required
                  defaultValue={figure.series}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {SERIES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Arc</label>
                <Input name="arc" defaultValue={figure.arc ?? ''} />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Release Date</label>
                <Input name="releaseDate" type="month" defaultValue={toMonthValue(figure.releaseDate)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">MSRP (USD)</label>
                <Input name="msrp" type="number" step="0.01" defaultValue={figure.msrp ?? ''} />
              </div>
            </div>

            <div className="flex gap-6 flex-wrap">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" name="isWebExclusive" value="true" defaultChecked={figure.isWebExclusive} className="rounded" />
                Web Exclusive
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" name="isRerelease" value="true" defaultChecked={figure.isRerelease} className="rounded" />
                Re-release
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" name="isThirdParty" value="true" defaultChecked={figure.isThirdParty} className="rounded" />
                3rd Party
              </label>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-3">
              <Button type="submit" disabled={isPending} className="bg-orange-500 hover:bg-orange-600 text-white font-bold">
                {isPending ? 'Saving…' : 'Save'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
