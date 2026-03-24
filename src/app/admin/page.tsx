import { prisma } from '@/lib/prisma'
import { ImageUploadRow } from '@/components/admin/ImageUploadRow'

export default async function AdminPage() {
  const figures = await prisma.figure.findMany({
    orderBy: [{ character: 'asc' }, { releaseDate: 'asc' }],
    select: { id: true, name: true, character: true, slug: true, images: true },
  })

  const withImages = figures.filter((f) => f.images.length > 0).length

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-1">Figure Images</h1>
        <p className="text-muted-foreground">
          {withImages} of {figures.length} figures have images
        </p>
      </div>

      <div className="space-y-3">
        {figures.map((figure) => (
          <ImageUploadRow key={figure.id} figure={figure} />
        ))}
      </div>
    </div>
  )
}
