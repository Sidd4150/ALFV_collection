import Link from 'next/link'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils'
import type { Figure } from '@/generated/prisma'

export function FigureCard({ figure }: { figure: Figure }) {
  return (
    <Link href={`/figures/${figure.slug}`} className="group block">
      <div className="relative rounded-lg overflow-hidden border border-border/50 shadow-lg hover:border-[#4a1258]/50 hover:shadow-[0_4px_24px_rgba(74,18,88,0.25)] transition-all duration-300 aspect-[3/4]">

        {/* Full-bleed image */}
        {figure.images[0] ? (
          <Image
            src={figure.images[0]}
            alt={figure.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 bg-muted flex items-center justify-center">
            <span className="text-muted-foreground/40 text-[10px] font-mono tracking-widest uppercase">No Image</span>
          </div>
        )}

        {/* Gradient overlay — bottom to 40% */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/20 to-transparent" />

        {/* Top badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {figure.isThirdParty && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-600/85 text-white backdrop-blur-sm">3P</span>
          )}
          {figure.isWebExclusive && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/85 text-white backdrop-blur-sm">WEB</span>
          )}
          {figure.isRerelease && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/85 text-white backdrop-blur-sm">RE</span>
          )}
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-[10px] font-mono text-white/45 uppercase tracking-[0.12em] mb-0.5 truncate">
            {figure.character}
          </p>
          <p className="text-sm font-semibold leading-snug text-white line-clamp-2 group-hover:text-[#c9a040] transition-colors duration-200">
            {figure.name}
          </p>
          {figure.msrp && (
            <p className="text-[11px] font-mono mt-1.5 text-[#c9a040]/80">
              {formatPrice(figure.msrp)}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
