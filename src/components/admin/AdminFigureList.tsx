'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { ImageUploadRow } from '@/components/admin/ImageUploadRow'
import { EditFigureForm } from '@/components/admin/EditFigureForm'
import { DeleteFigureButton } from '@/components/admin/DeleteFigureButton'
import { FetchPricesButton } from '@/components/admin/FetchPricesButton'
import { ClearPricesButton } from '@/components/admin/ClearPricesButton'

type Figure = {
  id: string
  name: string
  character: string
  slug: string
  images: string[]
  series: string
  arc: string | null
  releaseDate: string | null
  msrp: number | null
  isWebExclusive: boolean
  isRerelease: boolean
  isThirdParty: boolean
}

export function AdminFigureList({ figures }: { figures: Figure[] }) {
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? figures.filter(
        (f) =>
          f.name.toLowerCase().includes(query.toLowerCase()) ||
          f.character.toLowerCase().includes(query.toLowerCase())
      )
    : figures

  // Group by character
  const groups = filtered.reduce<Record<string, Figure[]>>((acc, f) => {
    if (!acc[f.character]) acc[f.character] = []
    acc[f.character].push(f)
    return acc
  }, {})

  return (
    <div>
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search figures…"
          className="w-full h-9 pl-9 pr-4 rounded-md border border-input bg-background text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground text-xs font-mono"
          >
            clear
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-xs font-mono text-muted-foreground/40 text-center py-10 uppercase tracking-widest">No figures found</p>
      ) : query ? (
        // Flat list when searching
        <div className="space-y-2">
          {filtered.map((figure) => (
            <FigureRow key={figure.id} figure={figure} />
          ))}
        </div>
      ) : (
        // Grouped by character
        <div className="space-y-6">
          {Object.entries(groups).map(([character, figs]) => (
            <div key={character}>
              <div className="flex items-center gap-3 mb-2">
                <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground/40">{character}</p>
                <div className="flex-1 h-px bg-border/30" />
                <span className="text-[10px] font-mono text-muted-foreground/30">{figs.length}</span>
              </div>
              <div className="space-y-2">
                {figs.map((figure) => (
                  <FigureRow key={figure.id} figure={figure} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FigureRow({ figure }: { figure: Figure }) {
  return (
    <div className="bg-card border border-border/50 rounded-lg overflow-hidden shadow-sm hover:border-border/80 transition-colors">
      <ImageUploadRow
        figure={figure}
        editSlot={
          <>
            <EditFigureForm figure={figure} />
            <DeleteFigureButton id={figure.id} name={figure.name} />
          </>
        }
        priceSlot={
          <div className="flex items-center gap-2 flex-wrap">
            <FetchPricesButton figureId={figure.id} />
            <ClearPricesButton figureId={figure.id} />
          </div>
        }
      />
    </div>
  )
}
