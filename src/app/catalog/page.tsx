import { prisma } from '@/lib/prisma'
import { FigureCard } from '@/components/FigureCard'
import { CatalogFilters } from '@/components/CatalogFilters'
import type { Figure } from '@/generated/prisma'

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ character?: string; arc?: string; exclusive?: string; year?: string; sort?: string; search?: string; thirdParty?: string }>
}) {
  const params = await searchParams
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

  const orderBy =
    params.sort === 'price-asc' ? { msrp: 'asc' as const } :
    params.sort === 'price-desc' ? { msrp: 'desc' as const } :
    params.sort === 'date-asc' ? { releaseDate: 'asc' as const } :
    { releaseDate: 'desc' as const }

  const figures = await prisma.figure.findMany({ where, orderBy })

  const characters = await prisma.figure.findMany({
    select: { character: true },
    distinct: ['character'],
    orderBy: { character: 'asc' },
  })

  const arcs = await prisma.figure.findMany({
    select: { arc: true },
    distinct: ['arc'],
    orderBy: { arc: 'asc' },
  })

  const datesWithYear = await prisma.figure.findMany({
    select: { releaseDate: true },
    where: { releaseDate: { not: null } },
  })
  const years = [...new Set(datesWithYear.map((f: { releaseDate: Date | null }) => new Date(f.releaseDate!).getFullYear()))].sort() as number[]

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black mb-1">SHF Dragon Ball Catalog</h1>
          <p className="text-muted-foreground">{figures.length} figures</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <CatalogFilters
            characters={characters.map((c: { character: string }) => c.character)}
            arcs={arcs.map((a: { arc: string | null }) => a.arc).filter((arc): arc is string => arc !== null)}
            years={years}
          />
          <div className="flex-1">
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {figures.map((figure: Figure) => (
                <FigureCard key={figure.id} figure={figure} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
