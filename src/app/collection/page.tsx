import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils'
import { PriceChart } from '@/components/PriceChart'

const STATUS_LABELS = {
  OWNED: 'Owned',
  WISHLIST: 'Wishlisted',
} as const

const STATUS_COLORS = {
  OWNED: 'bg-green-500 text-white',
  WISHLIST: 'bg-yellow-500 text-white',
} as const

export default async function CollectionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirectTo=/collection')

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })

  const entries = dbUser ? await prisma.userCollection.findMany({
    where: { userId: dbUser.id },
    include: { figure: true },
    orderBy: { addedAt: 'desc' },
  }) : []

  const owned = entries.filter((e) => e.status === 'OWNED')
  const wishlist = entries.filter((e) => e.status === 'WISHLIST')

  const totalValue = owned.reduce((sum, e) => sum + (e.figure.msrp ?? 0) * e.quantity, 0)
  const displayName = user.user_metadata?.username ?? user.email?.split('@')[0] ?? 'Collector'

  const ownedFigureIds = owned.map((e) => e.figureId)
  const priceSales = ownedFigureIds.length > 0
    ? await prisma.priceSale.findMany({
        where: { figureId: { in: ownedFigureIds } },
        orderBy: { saleDate: 'asc' },
        select: { figureId: true, price: true, saleDate: true },
      })
    : []

  const median = (arr: number[]) => {
    const s = [...arr].sort((a, b) => a - b)
    const m = Math.floor(s.length / 2)
    return s.length % 2 !== 0 ? s[m] : (s[m - 1] + s[m]) / 2
  }

  const salesByFigure = new Map<string, number[]>()
  for (const s of priceSales) {
    if (!salesByFigure.has(s.figureId)) salesByFigure.set(s.figureId, [])
    salesByFigure.get(s.figureId)!.push(s.price)
  }
  const marketValue = Array.from(salesByFigure.values()).reduce((sum, prices) => sum + median(prices), 0)

  const byMonth = new Map<string, Map<string, number[]>>()
  for (const s of priceSales) {
    const month = s.saleDate.toISOString().slice(0, 7)
    if (!byMonth.has(month)) byMonth.set(month, new Map())
    const figMap = byMonth.get(month)!
    if (!figMap.has(s.figureId)) figMap.set(s.figureId, [])
    figMap.get(s.figureId)!.push(s.price)
  }
  const chartSales = Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, figMap]) => ({
      price: Array.from(figMap.values()).reduce((sum, prices) => sum + median(prices), 0),
      saleDate: `${month}-01`,
    }))

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black mb-1">{displayName}&apos;s Vault</h1>
          <p className="text-muted-foreground">{entries.length} figures tracked</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Owned', value: owned.length, color: 'text-green-500' },
            { label: 'Wishlisted', value: wishlist.length, color: 'text-yellow-500' },
            { label: 'MSRP Value', value: formatPrice(totalValue), color: 'text-foreground' },
            { label: 'Market Value', value: marketValue > 0 ? formatPrice(marketValue) : '—', color: '' , style: { color: '#4a1258' } },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-border rounded-xl p-4 text-center">
              <p className={`text-2xl font-black ${stat.color}`} style={(stat as { style?: React.CSSProperties }).style}>{stat.value}</p>
              <p className="text-muted-foreground text-xs mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Market value chart */}
        {chartSales.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-5 mb-10">
            <h2 className="text-base font-bold mb-4">Collection Market Value Over Time</h2>
            <PriceChart sales={chartSales} label="Total Collection Market Value" />
          </div>
        )}

        {/* Empty state */}
        {entries.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-10 text-center">
            <p className="text-4xl mb-4">📦</p>
            <h2 className="text-xl font-bold mb-2">Your vault is empty</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Browse the catalog and add figures to start tracking.
            </p>
            <Button asChild className="text-white font-bold" style={{ backgroundColor: '#4a1258' }}>
              <Link href="/">Browse Catalog</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Owned */}
            {owned.length > 0 && (
              <section className="mb-10">
                <h2 className="text-xl font-black mb-4">Owned <span className="text-muted-foreground font-normal text-base">({owned.length})</span></h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                  {owned.map((entry) => (
                    <FigureCard key={entry.id} entry={entry} salesByFigure={salesByFigure} median={median} />
                  ))}
                </div>
              </section>
            )}

            {/* Wishlist */}
            {wishlist.length > 0 && (
              <section>
                <h2 className="text-xl font-black mb-4">Wishlist <span className="text-muted-foreground font-normal text-base">({wishlist.length})</span></h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                  {wishlist.map((entry) => (
                    <FigureCard key={entry.id} entry={entry} salesByFigure={salesByFigure} median={median} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function FigureCard({
  entry,
  salesByFigure,
  median,
}: {
  entry: {
    id: string
    status: string
    quantity: number
    purchasePrice: number | null
    condition: string | null
    figure: {
      slug: string
      name: string
      character: string
      series: string
      images: string[]
      msrp: number | null
      isWebExclusive: boolean
      isRerelease: boolean
      isThirdParty: boolean
    }
    figureId: string
  }
  salesByFigure: Map<string, number[]>
  median: (arr: number[]) => number
}) {
  const figureSales = salesByFigure.get(entry.figureId)
  const marketPrice = figureSales ? median(figureSales) : null
  const displayPrice = entry.purchasePrice ?? entry.figure.msrp

  return (
    <Link href={`/figures/${entry.figure.slug}`} className="group block">
      <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-[#4a1258] transition-colors">
        {/* Image */}
        <div className="relative aspect-square bg-muted overflow-hidden">
          {entry.figure.images[0] ? (
            <Image
              src={entry.figure.images[0]}
              alt={entry.figure.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs">No image</div>
          )}
          {/* Status badge overlay */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {entry.status in STATUS_LABELS && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS]}`}>
                {STATUS_LABELS[entry.status as keyof typeof STATUS_LABELS]}
              </span>
            )}
            {entry.figure.isThirdParty && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500 text-white">3rd Party</span>
            )}
            {entry.figure.isWebExclusive && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500 text-white">Web Excl.</span>
            )}
            {entry.figure.isRerelease && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500 text-white">Re-release</span>
            )}
          </div>
          {entry.quantity > 1 && (
            <div className="absolute top-2 right-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/70 text-white">×{entry.quantity}</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="text-xs text-muted-foreground truncate">{entry.figure.character}</p>
          <p className="text-sm font-bold leading-tight mt-0.5 line-clamp-2">{entry.figure.name}</p>
          <div className="mt-2 flex items-center justify-between gap-1">
            {marketPrice ? (
              <span className="text-sm font-black" style={{ color: '#4a1258' }}>{formatPrice(marketPrice)}</span>
            ) : displayPrice ? (
              <span className="text-sm font-bold">{formatPrice(displayPrice)}</span>
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            )}
            {entry.condition && (
              <span className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5 truncate">{entry.condition}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
