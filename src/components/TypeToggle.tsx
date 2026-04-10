'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'

export function TypeToggle({
  officialImage,
  thirdPartyImage,
}: {
  officialImage?: string
  thirdPartyImage?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get('thirdParty')

  const toggle = (value: 'false' | 'true') => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('page')
    if (current === value) {
      params.delete('thirdParty')
    } else {
      params.set('thirdParty', value)
    }
    router.push(`/?${params.toString()}`)
  }

  const btnBase =
    'relative overflow-hidden rounded-2xl w-48 h-28 flex items-end justify-start p-4 transition-all duration-300 cursor-pointer group ring-2'

  return (
    <div className="flex justify-center gap-4 mb-2">
      <button
        onClick={() => toggle('false')}
        className={`${btnBase} ${
          current === 'false'
            ? 'ring-white/60 shadow-[0_0_24px_rgba(255,255,255,0.15)]'
            : 'ring-white/10 hover:ring-white/30'
        }`}
      >
        {officialImage && (
          <Image
            src={officialImage}
            alt="Official SHF"
            fill
            className="object-cover scale-105 group-hover:scale-110 transition-transform duration-500 ease-out"
            sizes="192px"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
        <span className="relative z-10 text-sm font-semibold text-white leading-tight">
          Official Dragon Ball SHF
        </span>
      </button>

      <button
        onClick={() => toggle('true')}
        className={`${btnBase} ${
          current === 'true'
            ? 'ring-white/60 shadow-[0_0_24px_rgba(255,255,255,0.15)]'
            : 'ring-white/10 hover:ring-white/30'
        }`}
      >
        {thirdPartyImage && (
          <Image
            src={thirdPartyImage}
            alt="Third-Party"
            fill
            className="object-cover scale-105 group-hover:scale-110 transition-transform duration-500 ease-out"
            sizes="192px"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
        <span className="relative z-10 text-sm font-semibold text-white leading-tight">
          Third-Party
        </span>
      </button>
    </div>
  )
}
