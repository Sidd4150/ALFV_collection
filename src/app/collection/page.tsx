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
  const priceByFigure: Record<string, number> = {}
  for (const [figureId, prices] of salesByFigure) {
    priceByFigure[figureId] = median(prices)
  }

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
            <div className="flex gap-3 justify-center flex-wrap">
              <Button asChild className="text-white font-bold" style={{ backgroundColor: '#4a1258' }}>
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
