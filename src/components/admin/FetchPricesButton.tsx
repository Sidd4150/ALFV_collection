'use client'

import { useState, useTransition } from 'react'
import { TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { fetchEbayPrices } from '@/app/actions/prices'

export function FetchPricesButton({ figureId }: { figureId: string }) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null)
  const [error, setError] = useState('')

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    setResult(null)
    setError('')
    startTransition(async () => {
      try {
        const res = await fetchEbayPrices(figureId)
        setResult(res)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed')
      }
    })
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <Button
        variant="outline"
        size="sm"
        className="gap-1"
        disabled={isPending}
        onClick={handleClick}
      >
        <TrendingUp className="h-3.5 w-3.5" />
        {isPending ? 'Fetching…' : 'Prices'}
      </Button>
      {result && (
        <span className="text-xs text-muted-foreground">
          +{result.imported} new
        </span>
      )}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}
