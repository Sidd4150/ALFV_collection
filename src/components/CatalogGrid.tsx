'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { FigureCard } from '@/components/FigureCard'
import { CatalogPagination } from '@/components/CatalogPagination'
import { batchAddToCollection } from '@/app/actions/collection'
import type { Figure } from '@/generated/prisma'

interface Props {
  figures: Figure[]
  page: number
  totalPages: number
  searchParams: Record<string, string>
}

export function CatalogGrid({ figures, page, totalPages, searchParams }: Props) {
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)
  const router = useRouter()

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function exitSelectMode() {
    setSelectMode(false)
    setSelected(new Set())
  }

  function handleAdd() {
    startTransition(async () => {
      await batchAddToCollection(Array.from(selected))
      setSelected(new Set())
      setSelectMode(false)
      setDone(true)
      setTimeout(() => setDone(false), 2500)
      router.refresh()
    })
  }

  return (
    <>
      {/* Top row: pagination centered, select toggle right */}
      <div className="relative flex items-center justify-end sm:justify-center mb-4 mt-1">
        <div className="hidden sm:block">
          <CatalogPagination page={page} totalPages={totalPages} searchParams={searchParams} className="mt-0" />
        </div>
        <div className="sm:absolute sm:right-0 flex items-center gap-2">
          <a
            href="/submit"
            className="inline-flex items-center gap-1.5 rounded-md border border-purple-900/40 bg-purple-900/10 px-3 py-1.5 text-xs font-semibold text-purple-900 transition-all hover:bg-purple-900/20 hover:border-purple-900/60 dark:text-purple-200 dark:border-purple-300/40 dark:bg-purple-400/15 dark:hover:bg-purple-400/25"
          >
            Submit a Figure →
          </a>
          {selectMode ? (
            <button
              onClick={exitSelectMode}
              className="text-sm font-semibold text-muted-foreground/60 hover:text-muted-foreground transition-colors px-4 py-2 border border-border rounded-md"
            >
              Cancel
            </button>
          ) : (
            <button
              onClick={() => setSelectMode(true)}
              className="text-sm font-semibold text-muted-foreground/50 hover:text-muted-foreground transition-colors px-4 py-2 border border-border rounded-md"
            >
              Select Multiple
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {figures.map((figure) => {
          const isSelected = selected.has(figure.id)
          return (
            <div key={figure.id} className="relative">
              <FigureCard figure={figure} />
              {selectMode && (
                <>
                  {/* Full-card click overlay — blocks navigation, triggers select */}
                  <div
                    onClick={() => toggle(figure.id)}
                    className={`absolute inset-0 rounded-lg z-10 cursor-pointer transition-all duration-200 ${
                      isSelected ? 'ring-2 ring-brand shadow-[0_0_0_2px_var(--brand)]' : ''
                    }`}
                  />
                  {/* Checkbox */}
                  <div
                    className={`absolute top-2 right-2 z-20 w-5 h-5 rounded-sm border-2 flex items-center justify-center pointer-events-none transition-all duration-150 ${
                      isSelected
                        ? 'bg-brand border-brand'
                        : 'bg-black/50 border-white/40'
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
        })}
      </div>

      {/* Sticky add bar */}
      {(selected.size > 0 || done) && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-card border border-border rounded-full px-5 py-3 shadow-2xl">
          {done ? (
            <span className="text-sm font-mono text-green-500 font-bold">Added to your vault!</span>
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
                onClick={handleAdd}
                disabled={isPending}
                className="text-sm font-bold px-4 py-1.5 rounded-full text-white transition-opacity disabled:opacity-50 bg-brand"
              >
                {isPending ? 'Adding…' : 'Add to Vault'}
              </button>
            </>
          )}
        </div>
      )}
    </>
  )
}
