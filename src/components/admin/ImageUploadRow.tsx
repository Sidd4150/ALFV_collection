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

export function ImageUploadRow({ figure, editSlot }: { figure: FigureRow; editSlot?: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')

    const formData = new FormData()
    formData.append('image', file)

    startTransition(async () => {
      try {
        await uploadFigureImage(figure.id, formData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed')
      }
    })

    // reset input
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
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/40 transition-colors"
        onClick={() => setExpanded((o) => !o)}
      >
        {/* Thumbnail */}
        <div className="w-12 h-12 rounded-lg bg-muted shrink-0 overflow-hidden flex items-center justify-center">
          {hasImages ? (
            <Image
              src={figure.images[0]}
              alt={figure.name}
              width={48}
              height={48}
              className="object-cover w-full h-full"
            />
          ) : (
            <ImagePlus className="h-5 w-5 text-muted-foreground" />
          )}
        </div>

        {/* Name */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">{figure.character}</p>
          <p className="font-semibold text-sm truncate">{figure.name}</p>
        </div>

        {/* Image count */}
        <span className="text-xs text-muted-foreground shrink-0">
          {figure.images.length} image{figure.images.length !== 1 ? 's' : ''}
        </span>

        {/* Upload button */}
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-1"
          disabled={isPending}
          onClick={(e) => {
            e.stopPropagation()
            inputRef.current?.click()
          }}
        >
          <Upload className="h-3.5 w-3.5" />
          {isPending ? 'Uploading…' : 'Upload'}
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
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </div>

      {/* Expanded image grid */}
      {expanded && (
        <div className="border-t border-border p-4">
          {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
          {figure.images.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No images yet. Click Upload to add one.
            </p>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {figure.images.map((url) => (
                <div key={url} className="relative group aspect-square">
                  <Image
                    src={url}
                    alt={figure.name}
                    fill
                    className="object-cover rounded-lg"
                  />
                  <button
                    onClick={() => handleDelete(url)}
                    disabled={isPending}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center"
                  >
                    <Trash2 className="h-5 w-5 text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
