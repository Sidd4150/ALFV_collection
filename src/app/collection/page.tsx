import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'
import { PriceChart } from '@/components/PriceChart'
import { CollectionGrid } from '@/components/CollectionGrid'


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

  // Fetch market price snapshots for owned figures
  const snapshots = ownedFigureIds.length > 0
    ? await prisma.figureSnapshot.findMany({
        where: { figureId: { in: ownedFigureIds } },
        orderBy: { snapshotAt: 'asc' },
        select: { figureId: true, marketPrice: true, snapshotAt: true },
      })
    : []

  // Group snapshots by month, carry forward each figure's latest price
  const snapByMonth = new Map<string, Map<string, number>>()
  for (const s of snapshots) {
    const month = s.snapshotAt.toISOString().slice(0, 7)
    if (!snapByMonth.has(month)) snapByMonth.set(month, new Map())
    snapByMonth.get(month)!.set(s.figureId, s.marketPrice)
  }
  const sortedMonths = Array.from(snapByMonth.keys()).sort()
  const lastKnown = new Map<string, number>()
  const chartSales = sortedMonths.map((month) => {
    for (const [figureId, price] of snapByMonth.get(month)!) {
      lastKnown.set(figureId, price)
    }
    const total = Array.from(lastKnown.values()).reduce((sum, v) => sum + v, 0)
    return { price: Math.round(total * 100) / 100, saleDate: `${month}-01` }
  })

  // Market value = latest snapshot total (same as chart's last data point)
  const marketValue = chartSales.length > 0 ? chartSales[chartSales.length - 1].price : 0
  const priceByFigure: Record<string, number> = {}
  for (const [figureId, price] of lastKnown) {
    priceByFigure[figureId] = price
  }

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
            { label: 'Market Value', value: marketValue > 0 ? formatPrice(marketValue) : '—', color: 'text-gold' },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-border/50 rounded-lg p-4 text-center shadow-md w-36">
              <p className={`text-2xl font-mono font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-[10px] font-mono uppercase tracking-[0.12em] text-muted-foreground/50 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Market value chart */}
        {chartSales.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-5 mb-10 shadow-md">
            <PriceChart sales={chartSales} label="Collection Value" />
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
            <div className="flex gap-3 justify-center flex-wrap">
              <Button asChild className="text-white font-bold bg-brand hover:bg-brand/90">
                <Link href="/">Browse Catalog</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/submit">Submit a Figure</Link>
              </Button>
            </div>
          </div>
        ) : (
          <CollectionGrid owned={owned} wishlist={wishlist} priceByFigure={priceByFigure} />
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
