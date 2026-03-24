import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils'
import { CollectionStatus } from '@/generated/prisma'

const STATUS_LABELS: Record<CollectionStatus, string> = {
  OWNED: 'Owned',
  WISHLIST: 'Wishlisted',
  FOR_SALE: 'For Sale',
}

const STATUS_COLORS: Record<CollectionStatus, string> = {
  OWNED: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-400',
  WISHLIST: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-400',
  FOR_SALE: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-400',
}

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
  const forSale = entries.filter((e) => e.status === 'FOR_SALE')

  const totalValue = owned.reduce((sum, e) => sum + (e.figure.msrp ?? 0), 0)
  const displayName = user.user_metadata?.username ?? user.email?.split('@')[0] ?? 'Collector'

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black mb-1">{displayName}&apos;s Vault</h1>
          <p className="text-muted-foreground">{entries.length} figures tracked</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Owned', value: owned.length, color: 'text-green-500' },
            { label: 'Wishlisted', value: wishlist.length, color: 'text-orange-500' },
            { label: 'For Sale', value: forSale.length, color: 'text-blue-500' },
            { label: 'Est. Value', value: formatPrice(totalValue), color: 'text-foreground' },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-border rounded-xl p-4 text-center">
              <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
              <p className="text-muted-foreground text-xs mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {entries.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-10 text-center">
            <p className="text-4xl mb-4">📦</p>
            <h2 className="text-xl font-bold mb-2">Your vault is empty</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Browse the catalog and add figures to start tracking.
            </p>
            <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white font-bold">
              <Link href="/catalog">Browse Catalog</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <Link key={entry.id} href={`/figures/${entry.figure.slug}`}>
                <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:border-orange-500 transition-colors">
                  {/* Image placeholder */}
                  <div className="w-14 h-14 rounded-lg bg-muted shrink-0 flex items-center justify-center">
                    <span className="text-muted-foreground text-[10px]">No img</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">{entry.figure.character}</p>
                    <p className="font-bold text-sm leading-tight truncate">{entry.figure.name}</p>
                    {entry.condition && (
                      <p className="text-xs text-muted-foreground mt-0.5">{entry.condition}</p>
                    )}
                  </div>

                  {/* Price paid */}
                  <div className="text-right shrink-0 hidden sm:block">
                    {entry.purchasePrice && (
                      <>
                        <p className="text-xs text-muted-foreground">Paid</p>
                        <p className="text-sm font-bold">{formatPrice(entry.purchasePrice)}</p>
                      </>
                    )}
                    {!entry.purchasePrice && entry.figure.msrp && (
                      <>
                        <p className="text-xs text-muted-foreground">MSRP</p>
                        <p className="text-sm font-bold">{formatPrice(entry.figure.msrp)}</p>
                      </>
                    )}
                  </div>

                  {/* Status badge */}
                  <Badge className={`shrink-0 border-0 text-xs ${STATUS_COLORS[entry.status]}`}>
                    {STATUS_LABELS[entry.status]}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
