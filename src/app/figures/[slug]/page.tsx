import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { formatPrice, formatPriceJpy } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'
import { getCollectionEntry } from '@/app/actions/collection'
import { CollectionButton } from '@/components/CollectionButton'
import { FigureImageGallery } from '@/components/FigureImageGallery'
import { PriceChart } from '@/components/PriceChart'
import { ChevronRight } from 'lucide-react'
import { BackButton } from '@/components/BackButton'

async function FigureDetailContent({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const figure = await prisma.figure.findUnique({ where: { slug } })

  if (!figure) notFound()

  const [existing, priceSales] = await Promise.all([
    user ? getCollectionEntry(figure.id) : Promise.resolve(null),
    prisma.priceSale.findMany({
      where: { figureId: figure.id },
      orderBy: { saleDate: 'asc' },
      select: { price: true, saleDate: true, sourceUrl: true },
    }),
  ])

  const prices = priceSales.map((s) => s.price)
  const medianPrice = prices.length > 0
    ? (() => { const sorted = [...prices].sort((a, b) => a - b); const mid = Math.floor(sorted.length / 2); return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2 })()
    : null

  const recentSales = [...priceSales].reverse().filter((s) => s.sourceUrl).slice(0, 5)

  const details: { label: string; value: string | null }[] = [
    { label: 'Character', value: figure.character },
    { label: 'Series', value: figure.series },
    { label: 'Arc', value: figure.arc ?? null },
    { label: 'Version', value: figure.version ?? null },
    { label: 'Release Date', value: figure.releaseDate ? new Date(figure.releaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : null },
    { label: 'MSRP (USD)', value: figure.msrp ? formatPrice(figure.msrp) : null },
    { label: 'MSRP (JPY)', value: figure.msrpJpy ? formatPriceJpy(figure.msrpJpy) : null },
    { label: 'JAN Code', value: figure.janCode ?? null },
  ].filter((d) => d.value !== null)

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6">

        <BackButton />

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-6 flex-wrap">
          <Link href="/" className="hover:text-foreground transition-colors">Catalog</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href={`/?series=${encodeURIComponent(figure.series)}`} className="hover:text-foreground transition-colors">{figure.series}</Link>
          {figure.arc && (
            <>
              <ChevronRight className="h-3 w-3" />
              <span>{figure.arc}</span>
            </>
          )}
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium truncate max-w-xs">{figure.name}</span>
        </nav>

        {/* Main grid: image | details + price card */}
        <div className="grid lg:grid-cols-[420px_1fr] gap-10 mb-10">

          {/* Left: image */}
          <div>
            <FigureImageGallery images={figure.images} name={figure.name} />
          </div>

          {/* Right: info */}
          <div className="flex flex-col gap-6">

            {/* Badges + title */}
            <div>
              <div className="flex gap-2 mb-3 flex-wrap">
                <Badge style={{ backgroundColor: '#4a1258' }} className="text-white">{figure.series}</Badge>
                {figure.arc && <Badge variant="outline">{figure.arc}</Badge>}
                {figure.isWebExclusive && <Badge variant="outline" className="border-yellow-500 text-yellow-600 dark:text-yellow-400">Web Exclusive</Badge>}
                {figure.isRerelease && <Badge variant="outline" className="border-blue-500 text-blue-600 dark:text-blue-400">Re-release</Badge>}
                {figure.isThirdParty && <Badge variant="outline" className="border-purple-500 text-purple-600 dark:text-purple-400">3rd Party</Badge>}
              </div>
              <h1 className="font-display text-4xl leading-tight tracking-wide mb-1">{figure.name}</h1>
              <p className="text-muted-foreground text-sm font-mono">{figure.character} — {figure.series}</p>
            </div>

            {/* Figure Details table */}
            <div>
              <h2 className="text-base font-bold mb-3">Figure Details</h2>
              {figure.description && (
                <p className="text-sm text-muted-foreground mb-4">{figure.description}</p>
              )}
              <dl className="space-y-2">
                {details.map((d) => (
                  <div key={d.label} className="flex gap-2 text-sm">
                    <dt className="font-semibold w-32 shrink-0">{d.label}:</dt>
                    <dd className="text-muted-foreground">{d.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Accessories */}
            {figure.accessories.length > 0 && (
              <div>
                <h2 className="text-base font-bold mb-2">Accessories</h2>
                <ul className="space-y-1">
                  {figure.accessories.map((acc: string) => (
                    <li key={acc} className="text-sm flex gap-2 text-muted-foreground">
                      <span style={{ color: '#4a1258' }}>•</span> {acc}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Price card */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-md">
              <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground/50 mb-2">Market Price</p>
              {medianPrice ? (
                <p className="text-4xl font-mono font-bold mb-1 text-[#c9a040]">{formatPrice(medianPrice)}</p>
              ) : (
                <p className="text-2xl font-bold text-muted-foreground mb-1">No data yet</p>
              )}
              {figure.msrp && (
                <p className="text-sm text-muted-foreground mb-4">MSRP: {formatPrice(figure.msrp)}</p>
              )}
              <CollectionButton figureId={figure.id} isLoggedIn={!!user} existing={existing} />
              {medianPrice && (
                <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border">
                  Estimate based on recent eBay sold listings. Do your own research before buying or selling.
                </p>
              )}
            </div>

          </div>
        </div>

        {/* Bottom row: price history + recent sales */}
        {(priceSales.length > 0 || recentSales.length > 0) && (
          <div className="grid md:grid-cols-2 gap-6">

            {/* Market Price History */}
            {priceSales.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-5 shadow-md">
                <h2 className="text-base font-bold mb-4">Market Price History</h2>
                <PriceChart sales={priceSales.map((s) => ({ price: s.price, saleDate: s.saleDate.toISOString() }))} />
              </div>
            )}

            {/* Recent eBay Sales */}
            {recentSales.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-5 shadow-md">
                <h2 className="text-base font-bold mb-4">Recent eBay Sales</h2>
                <ul className="space-y-3">
                  {recentSales.map((s, i) => (
                    <li key={i} className="flex items-center justify-between text-sm border-b border-border pb-3 last:border-0 last:pb-0">
                      <a
                        href={s.sourceUrl!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline truncate mr-4"
                        style={{ color: '#4a1258' }}
                      >
                        {new Date(s.saleDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </a>
                      <span className="font-bold shrink-0">{formatPrice(s.price)}</span>
                    </li>
                  ))}
                </ul>
                {medianPrice && (
                  <div className="mt-4 pt-4 border-t border-border flex justify-between text-sm">
                    <span className="text-muted-foreground">Median Sale Price</span>
                    <span className="font-bold">{formatPrice(medianPrice)}</span>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  )
}

export default function FigureDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-10 text-xs font-mono text-muted-foreground/40">Loading…</div>}>
      <FigureDetailContent params={params} />
    </Suspense>
  )
}
