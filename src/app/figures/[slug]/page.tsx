import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { formatPrice, formatPriceJpy } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'
import { getCollectionEntry } from '@/app/actions/collection'
import { CollectionButton } from '@/components/CollectionButton'
import { BackButton } from '@/components/BackButton'
import { FigureImageGallery } from '@/components/FigureImageGallery'
import { PriceChart } from '@/components/PriceChart'

export default async function FigureDetailPage({
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

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <BackButton />
        <div className="grid md:grid-cols-2 gap-10">
          {/* Image */}
          <FigureImageGallery images={figure.images} name={figure.name} />

          {/* Details */}
          <div>
            <div className="flex gap-2 mb-3 flex-wrap">
              <Badge className="bg-orange-500 text-white">{figure.series}</Badge>
              {figure.arc && <Badge variant="outline">{figure.arc}</Badge>}
              {figure.isWebExclusive && <Badge variant="outline" className="border-yellow-500 text-yellow-600 dark:text-yellow-400">Web Exclusive</Badge>}
              {figure.isRerelease && <Badge variant="outline" className="border-blue-500 text-blue-600 dark:text-blue-400">Re-release</Badge>}
              {figure.isThirdParty && <Badge variant="outline" className="border-purple-500 text-purple-600 dark:text-purple-400">3rd Party</Badge>}
            </div>

            <h1 className="text-3xl font-black mb-2">{figure.name}</h1>
            <p className="text-muted-foreground mb-6">{figure.description}</p>

            {/* Collection button */}
            <div className="mb-6">
              <CollectionButton
                figureId={figure.id}
                isLoggedIn={!!user}
                existing={existing}
              />
            </div>

            {/* Pricing */}
            <div className="bg-card border border-border rounded-xl p-5 mb-6">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Pricing</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">MSRP (USD)</p>
                  <p className="text-xl font-bold">{figure.msrp ? formatPrice(figure.msrp) : '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">MSRP (JPY)</p>
                  <p className="text-xl font-bold">{figure.msrpJpy ? formatPriceJpy(figure.msrpJpy) : '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Market Price</p>
                  <p className="text-xl font-bold text-orange-500">{medianPrice ? formatPrice(medianPrice) : '—'}</p>
                </div>
              </div>
              {medianPrice && (
                <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                  ⚠️ Market price is an estimate based on recent eBay sold listings. Always do your own research before buying or selling.
                </p>
              )}
            </div>

            {/* Price chart */}
            {priceSales.length > 0 && (
              <div className="mb-6">
                <PriceChart sales={priceSales.map((s) => ({ price: s.price, saleDate: s.saleDate.toISOString() }))} />
              </div>
            )}

            {/* Recent eBay sales */}
            {priceSales.filter((s) => s.sourceUrl).length > 0 && (
              <div className="bg-card border border-border rounded-xl p-5 mb-6">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recent eBay Sales</h2>
                <ul className="space-y-2">
                  {[...priceSales].reverse().filter((s) => s.sourceUrl).slice(0, 3).map((s, i) => (
                    <li key={i} className="flex items-center justify-between text-sm">
                      <a href={s.sourceUrl!} target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline truncate mr-4">
                        {new Date(s.saleDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </a>
                      <span className="font-bold shrink-0">{formatPrice(s.price)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Accessories */}
            {figure.accessories.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Accessories</h2>
                <ul className="space-y-1">
                  {figure.accessories.map((acc: string) => (
                    <li key={acc} className="text-sm flex gap-2">
                      <span className="text-orange-500">•</span> {acc}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
