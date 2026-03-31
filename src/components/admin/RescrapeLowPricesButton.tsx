'use client'

import { useState, useTransition } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { clearAndRescrapeLowPrices } from '@/app/actions/prices'

export function RescrapeLowPricesButton() {
  const [isPending, startTransition] = useTransition()
  const [confirm, setConfirm] = useState(false)
  const [results, setResults] = useState<{ name: string; imported: number }[] | null>(null)

  function handleClick() {
    if (!confirm) { setConfirm(true); return }
    setConfirm(false)
    setResults(null)
    startTransition(async () => {
      const { processed } = await clearAndRescrapeLowPrices(29)
      setResults(processed)
    })
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <Button
        variant="outline"
        size="sm"
        className={`gap-1.5 ${confirm ? 'border-red-500 text-red-500 hover:bg-red-50' : ''}`}
        disabled={isPending}
        onClick={handleClick}
        onBlur={() => setConfirm(false)}
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isPending ? 'animate-spin' : ''}`} />
        {isPending ? 'Running…' : confirm ? 'Confirm clear & rescrape?' : 'Clear & Rescrape (<$29)'}
      </Button>
      {results && (
        <span className="text-xs text-muted-foreground">
          {results.length === 0
            ? 'No figures under $29'
            : `Done: ${results.map((r) => `${r.name} (+${r.imported})`).join(', ')}`}
        </span>
      )}
    </div>
  )
}
