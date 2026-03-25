'use client'

import { useState, useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteFigure } from '@/app/actions/figures'

export function DeleteFigureButton({ id, name }: { id: string; name: string }) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (confirming) {
    return (
      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
        <span className="text-xs text-muted-foreground hidden sm:inline">Delete?</span>
        <Button
          variant="destructive"
          size="sm"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await deleteFigure(id)
            })
          }
        >
          {isPending ? '…' : 'Yes'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setConfirming(false)}
          disabled={isPending}
        >
          No
        </Button>
      </div>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
      onClick={(e) => {
        e.stopPropagation()
        setConfirming(true)
      }}
      title={`Delete ${name}`}
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  )
}
