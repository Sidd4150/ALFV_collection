import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils'

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
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: 'Owned', value: owned.length, color: 'text-green-500' },
            { label: 'Wishlisted', value: wishlist.length, color: 'text-orange-500' },
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
                    {entry.condition && (
                      <p className="text-sm text-muted-foreground mt-1">{entry.condition}</p>
                    )}
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
