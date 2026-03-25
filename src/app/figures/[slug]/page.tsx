import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { formatPrice, formatPriceJpy } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'
import { getCollectionEntry } from '@/app/actions/collection'
import { CollectionButton } from '@/components/CollectionButton'
import { BackButton } from '@/components/BackButton'
import { FigureImageGallery } from '@/components/FigureImageGallery'

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

  const existing = user ? await getCollectionEntry(figure.id) : null

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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">MSRP (USD)</p>
                  <p className="text-xl font-bold">{figure.msrp ? formatPrice(figure.msrp) : '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">MSRP (JPY)</p>
                  <p className="text-xl font-bold">{figure.msrpJpy ? formatPriceJpy(figure.msrpJpy) : '—'}</p>
                </div>
              </div>
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
