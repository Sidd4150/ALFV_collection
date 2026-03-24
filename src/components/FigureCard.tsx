import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils'
import type { Figure } from '@/generated/prisma'

export function FigureCard({ figure }: { figure: Figure }) {
  return (
    <Link href={`/figures/${figure.slug}`}>
      <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-orange-500 transition-colors group cursor-pointer h-full">
        {/* Image */}
        <div className="aspect-square bg-muted relative overflow-hidden">
          {figure.images[0] ? (
            <Image
              src={figure.images[0]}
              alt={figure.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-muted-foreground text-xs">No image</span>
            </div>
          )}
        </div>
        {/* Info */}
        <div className="p-3">
          <div className="flex gap-1 mb-1 flex-wrap">
            {figure.isWebExclusive && (
              <Badge className="text-[10px] px-1 py-0 bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-400 border-0">Exclusive</Badge>
            )}
            {figure.isRerelease && (
              <Badge className="text-[10px] px-1 py-0 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-400 border-0">Re-release</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mb-0.5">{figure.character}</p>
          <p className="text-sm font-bold leading-tight group-hover:text-orange-500 transition-colors line-clamp-2">{figure.name}</p>
          {figure.msrp && (
            <p className="text-sm text-muted-foreground mt-1">{formatPrice(figure.msrp)}</p>
          )}
        </div>
      </div>
    </Link>
  )
}
