'use client'

import { useState, useTransition } from 'react'
import { deleteAccount } from '@/app/actions/user'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function DeleteAccountButton() {
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      await deleteAccount()
    })
  }

  if (!open) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:border-destructive/80 font-mono text-xs uppercase tracking-wider"
        onClick={() => setOpen(true)}
      >
        Delete Account
      </Button>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Type <span className="font-mono font-bold text-foreground">DELETE</span> to confirm. This is permanent and cannot be undone.
      </p>
      <Input
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="DELETE"
        className="font-mono max-w-xs border-border/50 focus:border-destructive/50"
        autoComplete="off"
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={confirm !== 'DELETE' || isPending}
          onClick={handleDelete}
          className="bg-destructive hover:bg-destructive/90 text-white font-mono text-xs uppercase tracking-wider"
        >
          {isPending ? 'Deleting…' : 'Permanently Delete'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setOpen(false); setConfirm('') }}
          className="font-mono text-xs"
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}
