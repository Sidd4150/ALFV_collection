'use client'

import { useState, useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { clearEbayPrices } from '@/app/actions/prices'

export function ClearPricesButton({ figureId }: { figureId: string }) {
  const [isPending, startTransition] = useTransition()
  const [deleted, setDeleted] = useState<number | null>(null)
  const [confirm, setConfirm] = useState(false)

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm) { setConfirm(true); return }
    setDeleted(null)
    startTransition(async () => {
      const res = await clearEbayPrices(figureId)
      setDeleted(res.deleted)
      setConfirm(false)
    })
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <Button
        variant="outline"
        size="sm"
        className={`gap-1 ${confirm ? 'border-red-500 text-red-500 hover:bg-red-50' : ''}`}
        disabled={isPending}
        onClick={handleClick}
        onBlur={() => setConfirm(false)}
      >
        <Trash2 className="h-3.5 w-3.5" />
        {isPending ? 'Clearing…' : confirm ? 'Confirm?' : 'Clear Prices'}
      </Button>
      {deleted !== null && (
        <span className="text-xs text-muted-foreground">{deleted} removed</span>
      )}
    </div>
  )
}
