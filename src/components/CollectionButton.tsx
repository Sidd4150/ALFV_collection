'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { BookmarkPlus, Check, ChevronDown, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { upsertCollection, removeFromCollection } from '@/app/actions/collection'
import { CollectionStatus } from '@/generated/prisma'
import type { UserCollection } from '@/generated/prisma'

const STATUS_LABELS: Record<CollectionStatus, string> = {
  OWNED: 'Owned',
  WISHLIST: 'Wishlisted',
  FOR_SALE: 'For Sale',
}

const STATUS_COLORS: Record<CollectionStatus, string> = {
  OWNED: 'bg-green-500',
  WISHLIST: 'bg-orange-500',
  FOR_SALE: 'bg-blue-500',
}

export function CollectionButton({
  figureId,
  isLoggedIn,
  existing,
}: {
  figureId: string
  isLoggedIn: boolean
  existing: UserCollection | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<CollectionStatus | null>(null)
  const [purchasePrice, setPurchasePrice] = useState(existing?.purchasePrice?.toString() ?? '')
  const [condition, setCondition] = useState(existing?.condition ?? '')
  const [quantity, setQuantity] = useState(existing?.quantity ?? 1)

  if (!isLoggedIn) {
    return (
      <Button
        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold"
        onClick={() => router.push('/auth/login')}
      >
        <BookmarkPlus className="h-4 w-4 mr-2" />
        Sign in to Track
      </Button>
    )
  }

  function handleSave(status: CollectionStatus) {
    startTransition(async () => {
      await upsertCollection(
        figureId,
        status,
        purchasePrice ? parseFloat(purchasePrice) : undefined,
        condition || undefined,
        undefined,
        quantity
      )
      setOpen(false)
    })
  }

  function handleRemove() {
    startTransition(async () => {
      await removeFromCollection(figureId)
      setOpen(false)
    })
  }

  // Already in collection — show status badge + edit button
  if (existing && !open) {
    return (
      <div className="flex gap-2">
        <div className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-white font-bold text-sm ${STATUS_COLORS[existing.status]}`}>
          <Check className="h-4 w-4" />
          {STATUS_LABELS[existing.status]}
        </div>
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          <ChevronDown className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={handleRemove} disabled={isPending}>
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    )
  }

  // Add / edit form
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <p className="text-sm font-semibold">
        {existing ? 'Update collection status' : 'Add to collection'}
      </p>

      {/* Status buttons */}
      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(STATUS_LABELS) as CollectionStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => setSelectedStatus(s)}
            className={`py-2 rounded-lg text-xs font-bold border transition-colors ${
              (selectedStatus ?? existing?.status) === s
                ? `${STATUS_COLORS[s]} text-white border-transparent`
                : 'border-border text-muted-foreground hover:border-orange-500'
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Optional fields */}
      <div className="grid grid-cols-2 gap-2">
        <Input
          type="number"
          placeholder="Price paid ($)"
          value={purchasePrice}
          onChange={(e) => setPurchasePrice(e.target.value)}
          min={0}
          step={0.01}
        />
        <Input
          placeholder="Condition (MIB, opened…)"
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Quantity</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="w-7 h-7 rounded-md border border-border flex items-center justify-center text-sm hover:border-orange-500 transition-colors"
          >−</button>
          <span className="text-sm font-bold w-4 text-center">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            className="w-7 h-7 rounded-md border border-border flex items-center justify-center text-sm hover:border-orange-500 transition-colors"
          >+</button>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold"
          disabled={!selectedStatus && !existing || isPending}
          onClick={() => handleSave(selectedStatus ?? existing!.status)}
        >
          {isPending ? 'Saving…' : existing ? 'Update' : 'Add to Vault'}
        </Button>
        {(existing || open) && (
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
        )}
      </div>
    </div>
  )
}
