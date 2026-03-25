'use client'

import { useState, useTransition, useRef } from 'react'
import { Plus, X, ImagePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createFigure } from '@/app/actions/figures'
import { uploadFigureImage } from '@/app/actions/images'

const SERIES = ['Dragon Ball Z', 'Dragon Ball Super', 'Dragon Ball GT', 'Dragon Ball Daima']

export function AddFigureForm() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const formRef = useRef<HTMLFormElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    setImageFiles((prev) => [...prev, ...files])
    e.target.value = ''
  }

  function removeImage(index: number) {
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      try {
        const figureId = await createFigure(formData)

        for (const file of imageFiles) {
          const imgData = new FormData()
          imgData.append('image', file)
          await uploadFigureImage(figureId, imgData)
        }

        formRef.current?.reset()
        setImageFiles([])
        setOpen(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create figure')
      }
    })
  }

  if (!open) {
    return (
      <Button
        className="gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-4 w-4" />
        Add Figure
      </Button>
    )
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-bold text-lg">Add Figure</h2>
        <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Name *</label>
            <Input name="name" placeholder="Super Saiyan Son Goku" required />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Character *</label>
            <Input name="character" placeholder="Son Goku" required />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Series *</label>
            <select
              name="series"
              required
              defaultValue=""
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="" disabled>Select series</option>
              {SERIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Arc</label>
            <Input name="arc" placeholder="Cell Saga" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Release Date</label>
            <Input name="releaseDate" type="month" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">MSRP (USD)</label>
            <Input name="msrp" type="number" step="0.01" placeholder="69.99" />
          </div>
        </div>

        <div className="flex gap-6 flex-wrap">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" name="isWebExclusive" value="true" className="rounded" />
            Web Exclusive
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" name="isRerelease" value="true" className="rounded" />
            Re-release
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" name="isThirdParty" value="true" className="rounded" />
            3rd Party
          </label>
        </div>

        {/* Image upload */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Images</label>
          <div className="flex flex-wrap gap-2 items-center">
            {imageFiles.map((file, i) => (
              <div key={i} className="relative group w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="w-16 h-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:border-orange-400 hover:text-orange-400 transition-colors shrink-0"
            >
              <ImagePlus className="h-5 w-5" />
            </button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageChange}
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-3 pt-1">
          <Button type="submit" disabled={isPending} className="bg-orange-500 hover:bg-orange-600 text-white font-bold">
            {isPending ? (imageFiles.length > 0 ? 'Uploading…' : 'Adding…') : 'Add Figure'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
