'use client'

import { useState } from 'react'
import Image from 'next/image'

export function FigureImageGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0)

  if (images.length === 0) {
    return (
      <div className="bg-muted border border-border rounded-2xl aspect-square flex items-center justify-center">
        <p className="text-muted-foreground text-sm">No image yet</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div className="bg-muted border border-border rounded-2xl aspect-square relative overflow-hidden">
        <Image
          src={images[active]}
          alt={name}
          fill
          className="object-cover rounded-2xl"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>

      {/* Thumbnails — only shown when there are multiple images */}
      {images.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {images.map((url, i) => (
            <button
              key={url}
              onClick={() => setActive(i)}
              className={`w-16 h-16 rounded-lg overflow-hidden relative shrink-0 border-2 transition-colors ${
                i === active ? 'border-orange-500' : 'border-transparent'
              }`}
            >
              <Image src={url} alt={`${name} ${i + 1}`} fill className="object-cover" sizes="64px" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
