'use client'

import { useState, useTransition, useRef, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { submitFigure } from '@/app/actions/submissions'
import { Plus, X } from 'lucide-react'
import { BackButton } from '@/components/BackButton'

const SERIES = ['Dragon Ball Z', 'Dragon Ball Super', 'Dragon Ball GT', 'Dragon Ball Daima']

export default function SubmitPage() {
  const [isPending, startTransition] = useTransition()
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [accessories, setAccessories] = useState<string[]>([])
  const [accessoryInput, setAccessoryInput] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  const addAccessory = useCallback(() => {
    const val = accessoryInput.trim()
    if (val && !accessories.includes(val)) setAccessories((prev) => [...prev, val])
    setAccessoryInput('')
  }, [accessoryInput, accessories])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await submitFigure(formData)
        setSubmitted(true)
        formRef.current?.reset()
        setAccessories([])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      }
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <BackButton />
        <div className="mb-8">
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground/50 mb-1">Community</p>
          <h1 className="font-display text-5xl leading-none tracking-wide">Submit a Figure</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Missing something from the catalog? Fill in what you know — we&apos;ll review it and add it.
          </p>
        </div>

        {submitted ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center shadow-md">
            <p className="text-3xl mb-3">🎉</p>
            <h2 className="font-bold text-lg mb-1">Submission received!</h2>
            <p className="text-muted-foreground text-sm mb-5">Thanks for helping build the catalog. We&apos;ll review it shortly.</p>
            <Button variant="outline" onClick={() => setSubmitted(false)}>Submit another</Button>
          </div>
        ) : (
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-5 bg-card border border-border rounded-xl p-6 shadow-md">

            <p className="text-[11px] text-muted-foreground/60 font-mono">Fields marked with <span className="text-red-500">*</span> are required — everything else is optional but helpful.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Name <span className="text-red-500">*</span></label>
                <Input name="name" placeholder="Super Saiyan Son Goku" required />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Character <span className="text-red-500">*</span></label>
                <Input name="character" placeholder="Son Goku" required />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Series <span className="text-red-500">*</span></label>
                <select
                  name="series"
                  required
                  defaultValue=""
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="" disabled>Select series</option>
                  {SERIES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Arc</label>
                <Input name="arc" placeholder="Cell Saga" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Release Date</label>
                <Input name="releaseDate" type="month" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">MSRP (USD)</label>
                <Input name="msrp" type="number" step="0.01" placeholder="69.99" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">MSRP (JPY)</label>
                <Input name="msrpJpy" type="number" placeholder="9900" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Version</label>
                <Input name="version" placeholder="Original Color Edition" />
              </div>
            </div>

            <div className="flex gap-6 flex-wrap">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" name="isWebExclusive" value="true" className="rounded" />
                Web Exclusive
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" name="isRerelease" value="true" className="rounded" />
                Re-release
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" name="isThirdParty" value="true" className="rounded" />
                3rd Party
              </label>
            </div>

            {/* Accessories */}
            {accessories.map((acc, i) => (
              <input key={i} type="hidden" name="accessories" value={acc} />
            ))}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Accessories</label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={accessoryInput}
                  onChange={(e) => setAccessoryInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAccessory() } }}
                  placeholder="e.g. Interchangeable hands"
                />
                <Button type="button" variant="outline" onClick={addAccessory}><Plus className="h-4 w-4" /></Button>
              </div>
              {accessories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {accessories.map((acc, i) => (
                    <span key={i} className="flex items-center gap-1 bg-muted text-sm px-2 py-1 rounded-md">
                      {acc}
                      <button type="button" onClick={() => setAccessories((prev) => prev.filter((_, j) => j !== i))}>
                        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Notes for reviewer</label>
              <textarea
                name="notes"
                rows={3}
                placeholder="Any extra info — product page link, image URLs, release source, etc."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button
              type="submit"
              disabled={isPending}
              className="w-full font-bold text-white"
              style={{ backgroundColor: '#4a1258' }}
            >
              {isPending ? 'Submitting…' : 'Submit Figure'}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
