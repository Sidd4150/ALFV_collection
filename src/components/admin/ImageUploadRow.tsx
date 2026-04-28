'use client'

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { Upload, Trash2, ImagePlus, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { uploadFigureImage, deleteFigureImage } from '@/app/actions/images'

type FigureRow = {
  id: string
  name: string
  character: string
  slug: string
  images: string[]
}

/** Resize and convert to WebP using a canvas. maxDimension=0 means no resize. */
function compressToWebP(file: File, maxDimension: number, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      let { width, height } = img
      if (maxDimension > 0 && (width > maxDimension || height > maxDimension)) {
        if (width >= height) {
          height = Math.round((height * maxDimension) / width)
          width = maxDimension
        } else {
          width = Math.round((width * maxDimension) / height)
          height = maxDimension
        }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl)
          if (blob) resolve(blob)
          else reject(new Error('Canvas toBlob failed'))
        },
        'image/webp',
        quality,
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Image load failed'))
    }
    img.src = objectUrl
  })
}

export function ImageUploadRow({ figure, editSlot, priceSlot }: { figure: FigureRow; editSlot?: React.ReactNode; priceSlot?: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')

    startTransition(async () => {
      try {
        const [thumbBlob, fullBlob] = await Promise.all([
          compressToWebP(file, 800, 0.75),
          compressToWebP(file, 0, 0.92),
        ])

        const formData = new FormData()
        formData.append('thumb', new File([thumbBlob], 'thumb.webp', { type: 'image/webp' }))
        formData.append('full', new File([fullBlob], 'full.webp', { type: 'image/webp' }))

        await uploadFigureImage(figure.id, formData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed')
      }
    })

    e.target.value = ''
  }

  function handleDelete(imageUrl: string) {
    startTransition(async () => {
      try {
        await deleteFigureImage(figure.id, imageUrl)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Delete failed')
      }
    })
  }

  const hasImages = figure.images.length > 0

  return (
    <div>
      {/* Header row */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded((o) => !o)}
      >
        {/* Thumbnail */}
        <div className="w-10 h-10 rounded-md bg-muted shrink-0 overflow-hidden flex items-center justify-center border border-border/40">
          {hasImages ? (
            <Image
              src={figure.images[0]}
              alt={figure.name}
              width={40}
              height={40}
              className="object-cover w-full h-full"
            />
          ) : (
            <ImagePlus className="h-4 w-4 text-muted-foreground/40" />
          )}
        </div>

        {/* Name */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-[0.1em] text-muted-foreground/40 truncate">{figure.character}</p>
          <p className="text-sm font-medium truncate">{figure.name}</p>
        </div>

        {/* Image count */}
        <span className="text-[10px] font-mono text-muted-foreground/40 shrink-0 tabular-nums">
          {figure.images.length}img
        </span>

        {/* Upload button */}
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5 text-xs border-border/50 h-7 px-2.5"
          disabled={isPending}
          onClick={(e) => {
            e.stopPropagation()
            inputRef.current?.click()
          }}
        >
          <Upload className="h-3 w-3" />
          {isPending ? '…' : 'Upload'}
        </Button>

        {editSlot}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />

        {expanded ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
        )}
      </div>

      {/* Expanded section */}
      {expanded && (
        <div className="border-t border-border/30 bg-muted/10" onClick={(e) => e.stopPropagation()}>
          {/* Price actions */}
          {priceSlot && (
            <div className="px-4 pt-3 pb-2 border-b border-border/20">
              {priceSlot}
            </div>
          )}
          {/* Images */}
          <div className="p-4">
            {error && <p className="text-xs font-mono text-destructive mb-3">{error}</p>}
            {figure.images.length === 0 ? (
              <p className="text-xs font-mono text-muted-foreground/40 text-center py-4 uppercase tracking-widest">
                No images yet
              </p>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {figure.images.map((url) => (
                  <div key={url} className="relative group aspect-square">
                    <Image
                      src={url}
                      alt={figure.name}
                      fill
                      className="object-cover rounded-md"
                    />
                    <button
                      onClick={() => handleDelete(url)}
                      disabled={isPending}
                      className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center"
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
