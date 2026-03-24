import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { formatPrice, formatPriceJpy } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'
import { getCollectionEntry } from '@/app/actions/collection'
import { CollectionButton } from '@/components/CollectionButton'

export default async function FigureDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const figure = await prisma.figure.findUnique({
    where: { slug },
    include: {
      priceSales: {
        orderBy: { saleDate: 'desc' },
        take: 10,
      },
    },
  })

  if (!figure) notFound()

  const existing = user ? await getCollectionEntry(figure.id) : null

  const prices = figure.priceSales.map((s: { price: number }) => s.price)
  const avgPrice = prices.length ? prices.reduce((a: number, b: number) => a + b, 0) / prices.length : null
  const minPrice = prices.length ? Math.min(...prices) : null
  const maxPrice = prices.length ? Math.max(...prices) : null

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid md:grid-cols-2 gap-10">
          {/* Image */}
          <div className="bg-muted border border-border rounded-2xl aspect-square relative overflow-hidden">
            {figure.images[0] ? (
              <Image
                src={figure.images[0]}
                alt={figure.name}
                fill
                className="object-cover rounded-2xl"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-muted-foreground text-sm">No image yet</p>
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <div className="flex gap-2 mb-3 flex-wrap">
              <Badge className="bg-orange-500 text-white">{figure.series}</Badge>
              {figure.arc && <Badge variant="outline">{figure.arc}</Badge>}
              {figure.isWebExclusive && <Badge variant="outline" className="border-yellow-500 text-yellow-600 dark:text-yellow-400">Web Exclusive</Badge>}
              {figure.isRerelease && <Badge variant="outline" className="border-blue-500 text-blue-600 dark:text-blue-400">Re-release</Badge>}
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
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-muted-foreground">MSRP (USD)</p>
                  <p className="text-xl font-bold">{figure.msrp ? formatPrice(figure.msrp) : '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">MSRP (JPY)</p>
                  <p className="text-xl font-bold">{figure.msrpJpy ? formatPriceJpy(figure.msrpJpy) : '—'}</p>
                </div>
              </div>
              {avgPrice !== null && (
                <div className="grid grid-cols-3 gap-3 border-t border-border pt-4">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Low</p>
                    <p className="font-bold text-green-600 dark:text-green-400">{formatPrice(minPrice!)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Avg</p>
                    <p className="font-bold text-orange-500">{formatPrice(avgPrice)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">High</p>
                    <p className="font-bold text-red-600 dark:text-red-400">{formatPrice(maxPrice!)}</p>
                  </div>
                </div>
              )}
              {avgPrice === null && (
                <p className="text-muted-foreground text-sm border-t border-border pt-4">No market sales reported yet.</p>
              )}
            </div>

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
