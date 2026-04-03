import { Suspense } from 'react'
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

async function CollectionContent({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirectTo=/collection')
  const { welcome } = await searchParams

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })

  const entries = dbUser ? await prisma.userCollection.findMany({
    where: { userId: dbUser.id },
    include: { figure: true },
    orderBy: { addedAt: 'desc' },
  }) : []

  const owned = entries.filter((e) => e.status === 'OWNED')
  const wishlist = entries.filter((e) => e.status === 'WISHLIST')

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
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground/50 mb-1">{displayName}</p>
          <h1 className="font-display text-5xl leading-none tracking-wide">Your Vault</h1>
          <p className="text-muted-foreground text-xs font-mono mt-1">{entries.length} figures tracked</p>
        </div>

        {welcome && (
          <div className="mb-6 rounded-xl border border-border bg-card px-5 py-4 flex items-center gap-3 shadow-md">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="font-bold text-sm">Account created!</p>
              <p className="text-muted-foreground text-sm">Welcome to ALFV. Start adding figures to your vault below.</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-4 mb-6">
          {[
            { label: 'Owned', value: owned.length, color: 'text-green-500' },
            { label: 'Wishlisted', value: wishlist.length, color: 'text-yellow-500' },
            { label: 'Market Value', value: marketValue > 0 ? formatPrice(marketValue) : '—', color: '' , style: { color: '#c9a040' } },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-border/50 rounded-lg p-4 text-center shadow-md w-36">
              <p className={`text-2xl font-mono font-bold ${stat.color}`} style={(stat as { style?: React.CSSProperties }).style}>{stat.value}</p>
              <p className="text-[10px] font-mono uppercase tracking-[0.12em] text-muted-foreground/50 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Market value chart */}
        {chartSales.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-5 mb-10 shadow-md">
            <h2 className="text-base font-bold mb-4">Collection Market Value Over Time</h2>
            <PriceChart sales={chartSales} label="Total Collection Market Value" />
          </div>
        )}

        {/* Empty state */}
        {entries.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-10 text-center shadow-md">
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
                <h2 className="font-display text-3xl tracking-wide mb-4">Owned <span className="text-muted-foreground/50 font-display text-xl">({owned.length})</span></h2>
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
                <h2 className="font-display text-3xl tracking-wide mb-4">Wishlist <span className="text-muted-foreground/50 font-display text-xl">({wishlist.length})</span></h2>
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

export default function CollectionPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-10 text-xs font-mono text-muted-foreground/40">Loading…</div>}>
      <CollectionContent searchParams={searchParams} />
    </Suspense>
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
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS]} text-white backdrop-blur-sm`}>
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

        {entry.quantity > 1 && (
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
  )
}
