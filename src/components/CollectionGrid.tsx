'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

import { formatPrice } from '@/lib/utils'
import { batchRemoveFromCollection } from '@/app/actions/collection'

const STATUS_LABELS = {
  OWNED: 'Owned',
  WISHLIST: 'Wishlisted',
} as const

const STATUS_COLORS = {
  OWNED: 'bg-green-500 text-white',
  WISHLIST: 'bg-yellow-500 text-white',
} as const

export type CollectionEntry = {
  id: string
  figureId: string
  status: string
  quantity: number
  purchasePrice: number | null
  condition: string | null
  figure: {
    slug: string
    name: string
    character: string
    images: string[]
    msrp: number | null
    isWebExclusive: boolean
    isRerelease: boolean
    isThirdParty: boolean
  }
}

interface Props {
  owned: CollectionEntry[]
  wishlist: CollectionEntry[]
  priceByFigure: Record<string, number>
}

export function CollectionGrid({ owned, wishlist, priceByFigure }: Props) {
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)
  const router = useRouter()

  function toggle(figureId: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(figureId)) next.delete(figureId)
      else next.add(figureId)
      return next
    })
  }

  function exitSelectMode() {
    setSelectMode(false)
    setSelected(new Set())
  }

  function handleRemove() {
    startTransition(async () => {
      await batchRemoveFromCollection(Array.from(selected))
      setSelected(new Set())
      setSelectMode(false)
      setDone(true)
      setTimeout(() => setDone(false), 2500)
      router.refresh()
    })
  }

  return (
    <>
      {/* Owned */}
      {owned.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h2 className="font-display text-3xl tracking-wide">
                Owned <span className="text-muted-foreground/50 font-display text-xl">({owned.length})</span>
              </h2>
              <Link href="/submit" className="text-xs font-mono text-muted-foreground/50 hover:text-[#4a1258] transition-colors hidden sm:block">
                Don&apos;t see your figure? Submit it →
              </Link>
            </div>
            {selectMode ? (
              <button
                onClick={exitSelectMode}
                className="text-xs font-mono text-muted-foreground/60 hover:text-muted-foreground transition-colors px-3 py-1.5 border border-border rounded-md"
              >
                Cancel
              </button>
            ) : (
              <button
                onClick={() => setSelectMode(true)}
                className="text-xs font-mono text-muted-foreground/50 hover:text-muted-foreground transition-colors px-3 py-1.5 border border-border rounded-md"
              >
                Select Multiple
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {owned.map((entry) => (
              <CollectionCard
                key={entry.id}
                entry={entry}
                marketPrice={priceByFigure[entry.figureId] ?? null}
                selectMode={selectMode}
                isSelected={selected.has(entry.figureId)}
                onToggle={() => toggle(entry.figureId)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Wishlist */}
      {wishlist.length > 0 && (
        <section>
          {!owned.length && (
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-3xl tracking-wide">
                Wishlist <span className="text-muted-foreground/50 font-display text-xl">({wishlist.length})</span>
              </h2>
              {selectMode ? (
                <button
                  onClick={exitSelectMode}
                  className="text-xs font-mono text-muted-foreground/60 hover:text-muted-foreground transition-colors px-3 py-1.5 border border-border rounded-md"
                >
                  Cancel
                </button>
              ) : (
                <button
                  onClick={() => setSelectMode(true)}
                  className="text-xs font-mono text-muted-foreground/50 hover:text-muted-foreground transition-colors px-3 py-1.5 border border-border rounded-md"
                >
                  Select Multiple
                </button>
              )}
            </div>
          )}
          {owned.length > 0 && (
            <h2 className="font-display text-3xl tracking-wide mb-4">
              Wishlist <span className="text-muted-foreground/50 font-display text-xl">({wishlist.length})</span>
            </h2>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {wishlist.map((entry) => (
              <CollectionCard
                key={entry.id}
                entry={entry}
                marketPrice={priceByFigure[entry.figureId] ?? null}
                selectMode={selectMode}
                isSelected={selected.has(entry.figureId)}
                onToggle={() => toggle(entry.figureId)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Sticky remove bar */}
      {(selected.size > 0 || done) && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-card border border-border rounded-full px-5 py-3 shadow-2xl">
          {done ? (
            <span className="text-sm font-mono text-green-500 font-bold">Removed from vault!</span>
          ) : (
            <>
              <span className="text-sm font-mono text-muted-foreground tabular-nums">
                {selected.size} {selected.size === 1 ? 'figure' : 'figures'} selected
              </span>
              <button
                onClick={() => setSelected(new Set())}
                className="text-xs font-mono text-muted-foreground/60 hover:text-muted-foreground transition-colors"
              >
                Clear
              </button>
              <button
                onClick={handleRemove}
                disabled={isPending}
                className="text-sm font-bold px-4 py-1.5 rounded-full text-white transition-opacity disabled:opacity-50 bg-red-700"
              >
                {isPending ? 'Removing…' : 'Remove from Vault'}
              </button>
            </>
          )}
        </div>
      )}
    </>
  )
}

function CollectionCard({
  entry,
  marketPrice,
  selectMode,
  isSelected,
  onToggle,
}: {
  entry: CollectionEntry
  marketPrice: number | null
  selectMode: boolean
  isSelected: boolean
  onToggle: () => void
}) {
  const displayPrice = entry.purchasePrice ?? entry.figure.msrp

  return (
    <div className="relative">
      <Link href={`/figures/${entry.figure.slug}`} className="group block">
        <div className="relative rounded-lg overflow-hidden border border-border/50 shadow-lg hover:border-[#4a1258]/50 hover:shadow-[0_4px_24px_rgba(74,18,88,0.25)] transition-all duration-300 aspect-[3/4]">
          {entry.figure.images[0] ? (
            <Image
              src={entry.figure.images[0]}
              alt={entry.figure.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
            />
          ) : (
            <div className="absolute inset-0 bg-muted flex items-center justify-center">
              <span className="text-muted-foreground/40 text-[10px] font-mono tracking-widest uppercase">No Image</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/20 to-transparent" />

          {/* Top badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {entry.status in STATUS_LABELS && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS]} backdrop-blur-sm`}>
                {STATUS_LABELS[entry.status as keyof typeof STATUS_LABELS]}
              </span>
            )}
            {entry.figure.isThirdParty && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-600/85 text-white backdrop-blur-sm">3P</span>
            )}
            {entry.figure.isWebExclusive && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/85 text-white backdrop-blur-sm">WEB</span>
            )}
          </div>

          {entry.quantity > 1 && !selectMode && (
            <div className="absolute top-2 right-2">
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/70 text-white backdrop-blur-sm">×{entry.quantity}</span>
            </div>
          )}

          {/* Bottom info */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <p className="text-[10px] font-mono text-white/45 uppercase tracking-[0.12em] mb-0.5 truncate">{entry.figure.character}</p>
            <p className="text-sm font-semibold leading-snug text-white line-clamp-2 group-hover:text-[#c9a040] transition-colors duration-200">{entry.figure.name}</p>
            <div className="mt-1.5 flex items-center justify-between gap-1">
              {marketPrice ? (
                <span className="text-[11px] font-mono text-[#c9a040]/80">{formatPrice(marketPrice)}</span>
              ) : displayPrice ? (
                <span className="text-[11px] font-mono text-white/50">{formatPrice(displayPrice)}</span>
              ) : (
                <span className="text-[11px] font-mono text-white/30">—</span>
              )}
              {entry.condition && (
                <span className="text-[9px] font-mono text-white/40 border border-white/20 rounded px-1.5 py-0.5 truncate backdrop-blur-sm">{entry.condition}</span>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* Select mode overlay + checkbox */}
      {selectMode && (
        <>
          <div
            onClick={onToggle}
            className={`absolute inset-0 rounded-lg z-10 cursor-pointer transition-all duration-200 ${
              isSelected ? 'ring-2 ring-red-600 shadow-[0_0_0_2px_rgba(220,38,38,0.4)]' : ''
            }`}
          />
          <div
            className={`absolute top-2 right-2 z-20 w-5 h-5 rounded-sm border-2 flex items-center justify-center pointer-events-none transition-all duration-150 ${
              isSelected ? 'bg-red-600 border-red-600' : 'bg-black/50 border-white/40'
            }`}
          >
            {isSelected && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
              </svg>
            )}
          </div>
        </>
      )}
    </div>
  )
}
