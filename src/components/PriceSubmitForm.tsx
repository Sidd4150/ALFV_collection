'use client'

import { useState, useTransition } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { submitPrice } from '@/app/actions/prices'

const SOURCES = ['eBay', 'Mercari', 'StockX', 'Facebook Marketplace', 'Local', 'Other']
const CONDITIONS = ['Mint in Box', 'Open Box', 'Loose', 'Damaged']

export function PriceSubmitForm({ figureId, figureSlug }: { figureId: string; figureSlug: string }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      try {
        await submitPrice(figureId, figureSlug, formData)
        setSuccess(true)
        setOpen(false)
        setTimeout(() => setSuccess(false), 3000)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to submit')
      }
    })
  }

  return (
    <div>
      {success && (
        <p className="text-sm text-green-600 dark:text-green-400 mb-3">Sale submitted — thanks!</p>
      )}

      {!open ? (
        <Button
          variant="outline"
          size="sm"
          className="gap-2 w-full"
          onClick={() => setOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Report a Sale
        </Button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Price (USD) *</label>
              <Input name="price" type="number" step="0.01" min="0.01" placeholder="45.00" required />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Sale Date *</label>
              <Input name="saleDate" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Source *</label>
              <select
                name="source"
                required
                defaultValue=""
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="" disabled>Select source</option>
                {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Condition</label>
              <select
                name="condition"
                defaultValue=""
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Any</option>
                {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-2">
            <Button type="submit" disabled={isPending} size="sm" className="bg-orange-500 hover:bg-orange-600 text-white font-bold">
              {isPending ? 'Submitting…' : 'Submit'}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
