'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SlidersHorizontal, Search } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function CatalogFilters({
  characters,
  arcs,
  years,
}: {
  characters: string[]
  arcs: string[]
  years: number[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [search, setSearch] = useState(searchParams.get('search') ?? '')

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (!value || value === 'all') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    router.push(`/?${params.toString()}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (search.trim()) {
      params.set('search', search.trim())
    } else {
      params.delete('search')
    }
    router.push(`/?${params.toString()}`)
  }

  const filterContent = (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Sort By</p>
        <Select
          defaultValue={searchParams.get('sort') ?? 'date-desc'}
          onValueChange={(v) => updateFilter('sort', v === 'date-desc' ? null : v)}
        >
          <SelectTrigger className="text-sm w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date-asc">Release Date (Oldest)</SelectItem>
            <SelectItem value="date-desc">Release Date (Newest)</SelectItem>
            <SelectItem value="price-asc">Price (Low to High)</SelectItem>
            <SelectItem value="price-desc">Price (High to Low)</SelectItem>
          </SelectContent>
        </Select>
      </div>

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

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Type</p>
        <Select
          defaultValue={searchParams.get('thirdParty') ?? 'all'}
          onValueChange={(v) => updateFilter('thirdParty', v)}
        >
          <SelectTrigger className="text-sm w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="false">Official Only</SelectItem>
            <SelectItem value="true">3rd Party Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Release Year</p>
        <Select
          defaultValue={searchParams.get('year') ?? 'all'}
          onValueChange={(v) => updateFilter('year', v)}
        >
          <SelectTrigger className="text-sm w-full">
            <SelectValue placeholder="All Years" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="w-full text-muted-foreground hover:text-foreground"
        onClick={() => { setSearch(''); router.push('/') }}
      >
        Clear filters
      </Button>
    </div>
  )

  return (
    <>
      {/* Search bar — full width on all screens, above the grid */}
      <div className="w-full md:hidden mb-2">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search figures or characters…"
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="outline" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        {/* Mobile filter toggle */}
        <div className="mt-3">
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
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:block w-48 shrink-0 space-y-4">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="pl-9 text-sm"
            />
          </div>
        </form>
        {filterContent}
      </div>
    </>
  )
}
