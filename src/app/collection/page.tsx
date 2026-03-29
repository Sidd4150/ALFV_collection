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
  OWNED: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-400',
  WISHLIST: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-400',
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

  // Fetch all price sales for owned figures
  const ownedFigureIds = owned.map((e) => e.figureId)
  const priceSales = ownedFigureIds.length > 0
    ? await prisma.priceSale.findMany({
        where: { figureId: { in: ownedFigureIds } },
        orderBy: { saleDate: 'asc' },
        select: { figureId: true, price: true, saleDate: true },
      })
    : []

  // Median helper
  const median = (arr: number[]) => {
    const s = [...arr].sort((a, b) => a - b)
    const m = Math.floor(s.length / 2)
    return s.length % 2 !== 0 ? s[m] : (s[m - 1] + s[m]) / 2
  }

  // Market value: sum of per-figure medians
  const salesByFigure = new Map<string, number[]>()
  for (const s of priceSales) {
    if (!salesByFigure.has(s.figureId)) salesByFigure.set(s.figureId, [])
    salesByFigure.get(s.figureId)!.push(s.price)
  }
  const marketValue = Array.from(salesByFigure.values()).reduce((sum, prices) => sum + median(prices), 0)

  // Build chart data: per month, sum of median prices across all owned figures with data that month
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
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black mb-1">{displayName}&apos;s Vault</h1>
          <p className="text-muted-foreground">{entries.length} figures tracked</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Owned', value: owned.length, color: 'text-green-500' },
            { label: 'Wishlisted', value: wishlist.length, color: 'text-orange-500' },
            { label: 'MSRP Value', value: formatPrice(totalValue), color: 'text-foreground' },
            { label: 'Market Value', value: marketValue > 0 ? formatPrice(marketValue) : '—', color: 'text-orange-500' },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-border rounded-xl p-4 text-center">
              <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
              <p className="text-muted-foreground text-xs mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Market value chart */}
        {chartSales.length > 0 && (
          <div className="mb-10">
            <PriceChart sales={chartSales} label="Total Collection Market Value" />
          </div>
        )}

        {entries.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-10 text-center">
            <p className="text-4xl mb-4">📦</p>
            <h2 className="text-xl font-bold mb-2">Your vault is empty</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Browse the catalog and add figures to start tracking.
            </p>
            <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white font-bold">
              <Link href="/">Browse Catalog</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <Link key={entry.id} href={`/figures/${entry.figure.slug}`}>
                <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-5 hover:border-orange-500 transition-colors">
                  {/* Image */}
                  <div className="w-24 h-24 rounded-xl bg-muted shrink-0 relative overflow-hidden">
                    {entry.figure.images[0] ? (
                      <Image
                        src={entry.figure.images[0]}
                        alt={entry.figure.name}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center text-muted-foreground text-[10px]">No img</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground">{entry.figure.character}</p>
                    <p className="font-bold text-base leading-tight truncate mt-0.5">{entry.figure.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {entry.quantity > 1 && (
                        <span className="text-xs font-bold bg-orange-500 text-white rounded px-1.5 py-0.5">×{entry.quantity}</span>
                      )}
                      {entry.condition && (
                        <p className="text-sm text-muted-foreground">{entry.condition}</p>
                      )}
                    </div>
                  </div>

                  {/* Price paid */}
                  <div className="text-right shrink-0 hidden sm:block">
                    {entry.purchasePrice && (
                      <>
                        <p className="text-xs text-muted-foreground">Paid</p>
                        <p className="text-base font-bold">{formatPrice(entry.purchasePrice)}</p>
                      </>
                    )}
                    {!entry.purchasePrice && entry.figure.msrp && (
                      <>
                        <p className="text-xs text-muted-foreground">MSRP</p>
                        <p className="text-base font-bold">{formatPrice(entry.figure.msrp)}</p>
                      </>
                    )}
                  </div>

                  {/* Status badge */}
                  {entry.status in STATUS_LABELS && (
                    <Badge className={`shrink-0 border-0 text-sm px-3 py-1 ${STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS]}`}>
                      {STATUS_LABELS[entry.status as keyof typeof STATUS_LABELS]}
                    </Badge>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
