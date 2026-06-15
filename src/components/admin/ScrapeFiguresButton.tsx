'use client'

import { useState, useTransition } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { scrapeFigures } from '@/app/actions/figures'

export function ScrapeFiguresButton() {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ imported: number; skipped: number; figures: number } | null>(null)
  const [error, setError] = useState('')

  function handleClick() {
    setResult(null)
    setError('')
    startTransition(async () => {
      try {
        const res = await scrapeFigures()
        setResult(res)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed')
      }
    })
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        disabled={isPending}
        onClick={handleClick}
      >
        <Download className={`h-3.5 w-3.5 ${isPending ? 'animate-pulse' : ''}`} />
        {isPending ? 'Scraping…' : 'Scrape Figures'}
      </Button>
      {result && (
        <span className="text-xs text-muted-foreground">
          +{result.imported} new · {result.skipped} skipped · {result.figures} figures
        </span>
      )}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}
