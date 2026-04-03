import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import { FigureCard } from '@/components/FigureCard'
import { CatalogFilters } from '@/components/CatalogFilters'
import { CatalogPagination } from '@/components/CatalogPagination'
import type { Figure } from '@/generated/prisma'

const PAGE_SIZE = 50

type Params = { character?: string; arc?: string; exclusive?: string; year?: string; sort?: string; search?: string; thirdParty?: string; page?: string }

async function CatalogContent({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1') || 1)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}
  if (params.character) where.character = params.character
  if (params.arc) where.arc = params.arc
  if (params.exclusive === 'true') where.isWebExclusive = true
  if (params.thirdParty === 'true') where.isThirdParty = true
  if (params.thirdParty === 'false') where.isThirdParty = false
  if (params.year) {
    const y = parseInt(params.year)
    where.releaseDate = {
      gte: new Date(`${y}-01-01`),
      lt: new Date(`${y + 1}-01-01`),
    }
  }
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { character: { contains: params.search, mode: 'insensitive' } },
    ]
  }

  const isMarketSort = params.sort === 'market-asc' || params.sort === 'market-desc'

  const orderBy =
    params.sort === 'price-asc' ? { msrp: 'asc' as const } :
    params.sort === 'price-desc' ? { msrp: 'desc' as const } :
    params.sort === 'date-asc' ? { releaseDate: 'asc' as const } :
    { releaseDate: 'desc' as const }

  const median = (arr: number[]) => {
    if (!arr.length) return null
    const s = [...arr].sort((a, b) => a - b)
    const m = Math.floor(s.length / 2)
    return s.length % 2 !== 0 ? s[m] : (s[m - 1] + s[m]) / 2
  }

  const [characters, arcs, datesWithYear] = await Promise.all([
    prisma.figure.findMany({ select: { character: true }, distinct: ['character'], orderBy: { character: 'asc' } }),
    prisma.figure.findMany({ select: { arc: true }, distinct: ['arc'], orderBy: { arc: 'asc' } }),
    prisma.figure.findMany({ select: { releaseDate: true }, where: { releaseDate: { not: null } } }),
  ])
  const years = [...new Set(datesWithYear.map((f: { releaseDate: Date | null }) => new Date(f.releaseDate!).getFullYear()))].sort() as number[]

  let figures: Figure[]
  let total: number

  if (isMarketSort) {
    // Fetch all for in-memory median sort, then paginate
    const all = await prisma.figure.findMany({
      where,
      include: { priceSales: { select: { price: true } } },
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sorted = [...all].sort((a: any, b: any) => {
      const aPrice = median(a.priceSales?.map((s: { price: number }) => s.price) ?? []) ?? -1
      const bPrice = median(b.priceSales?.map((s: { price: number }) => s.price) ?? []) ?? -1
      return params.sort === 'market-asc' ? aPrice - bPrice : bPrice - aPrice
    })
    total = sorted.length
    figures = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) as Figure[]
  } else {
    ;[figures, total] = await Promise.all([
      prisma.figure.findMany({
        where,
        orderBy,
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.figure.count({ where }),
    ])
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  // Build searchParams record for pagination links (omit 'page')
  const linkParams: Record<string, string> = {}
  for (const [k, v] of Object.entries(params)) {
    if (k !== 'page' && v != null) linkParams[k] = v
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-1">SHF Dragon Ball Catalog</h1>
        <p className="text-muted-foreground">{total} {total === 1 ? 'figure' : 'figures'}</p>
      </div>
      <div className="flex flex-col md:flex-row gap-8">
        <CatalogFilters
          characters={characters.map((c: { character: string }) => c.character)}
          arcs={arcs.map((a: { arc: string | null }) => a.arc).filter((arc): arc is string => arc !== null)}
          years={years}
        />
        <div className="flex-1">
          {figures.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-4xl mb-4">🔍</p>
              <h2 className="text-lg font-bold mb-1">Nothing to see yet</h2>
              <p className="text-muted-foreground text-sm">No figures match your current filters.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {figures.map((figure: Figure) => (
                  <FigureCard key={figure.id} figure={figure} />
                ))}
              </div>
              <CatalogPagination page={page} totalPages={totalPages} searchParams={linkParams} />
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Params>
}) {
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <Suspense fallback={<div className="text-muted-foreground text-sm">Loading...</div>}>
          <CatalogContent searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  )
}
