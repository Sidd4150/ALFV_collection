import Link from 'next/link'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils'
import type { Figure } from '@/generated/prisma'

export function FigureCard({ figure }: { figure: Figure }) {
  return (
    <Link href={`/figures/${figure.slug}`} className="group block h-full">
      <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-[#4a1258] transition-colors h-full flex flex-col">
        {/* Image */}
        <div className="aspect-square bg-muted relative overflow-hidden">
          {figure.images[0] ? (
            <Image
              src={figure.images[0]}
              alt={figure.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-muted-foreground text-xs">No image</span>
            </div>
          )}
          {/* Badge overlays */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {figure.isThirdParty && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500 text-white">3rd Party</span>
            )}
            {figure.isWebExclusive && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500 text-white">Web Excl.</span>
            )}
            {figure.isRerelease && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500 text-white">Re-release</span>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="p-3 flex flex-col flex-1">
          <p className="text-xs text-muted-foreground truncate">{figure.character}</p>
          <p className="text-sm font-bold leading-tight mt-0.5 line-clamp-2 group-hover:text-[#4a1258] transition-colors flex-1">{figure.name}</p>
          {figure.msrp && (
            <p className="text-sm text-muted-foreground mt-2">{formatPrice(figure.msrp)}</p>
          )}
        </div>
      </div>
    </Link>
  )
}
