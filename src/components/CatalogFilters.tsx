'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SlidersHorizontal } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

export function CatalogFilters({
  characters,
  arcs,
}: {
  characters: string[]
  arcs: string[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mobileOpen, setMobileOpen] = useState(false)

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (!value || value === 'all') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    router.push(`/catalog?${params.toString()}`)
  }

  const filterContent = (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Character</p>
        <Select
          defaultValue={searchParams.get('character') ?? 'all'}
          onValueChange={(v) => updateFilter('character', v)}
        >
          <SelectTrigger className="text-sm w-full">
            <SelectValue placeholder="All Characters" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Characters</SelectItem>
            {characters.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Story Arc</p>
        <Select
          defaultValue={searchParams.get('arc') ?? 'all'}
          onValueChange={(v) => updateFilter('arc', v)}
        >
          <SelectTrigger className="text-sm w-full">
            <SelectValue placeholder="All Arcs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Arcs</SelectItem>
            {arcs.map((a) => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="w-full text-muted-foreground hover:text-foreground"
        onClick={() => router.push('/catalog')}
      >
        Clear filters
      </Button>
    </div>
  )

  return (
    <>
      {/* Mobile filter toggle */}
      <div className="md:hidden mb-4">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setMobileOpen((o) => !o)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </Button>
        {mobileOpen && (
          <div className="mt-3 p-4 bg-card border border-border rounded-xl">
            {filterContent}
          </div>
        )}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:block w-48 shrink-0">
        {filterContent}
      </div>
    </>
  )
}
