import { prisma } from '@/lib/prisma'
import { ImageUploadRow } from '@/components/admin/ImageUploadRow'
import { AddFigureForm } from '@/components/admin/AddFigureForm'
import { EditFigureForm } from '@/components/admin/EditFigureForm'
import { DeleteFigureButton } from '@/components/admin/DeleteFigureButton'

export default async function AdminPage() {
  const figures = await prisma.figure.findMany({
    orderBy: [{ character: 'asc' }, { releaseDate: 'asc' }],
    select: {
      id: true,
      name: true,
      character: true,
      slug: true,
      images: true,
      series: true,
      arc: true,
      releaseDate: true,
      msrp: true,
      isWebExclusive: true,
      isRerelease: true,
      isThirdParty: true,
    },
  })

  const withImages = figures.filter((f) => f.images.length > 0).length

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black mb-1">Admin</h1>
          <p className="text-muted-foreground">
            {withImages} of {figures.length} figures have images
          </p>
        </div>
        <AddFigureForm />
      </div>

      <div className="space-y-3">
        {figures.map((figure) => (
          <div key={figure.id} className="bg-card border border-border rounded-xl overflow-hidden">
            <ImageUploadRow
              figure={figure}
              editSlot={
                <>
                  <EditFigureForm figure={{
                    ...figure,
                    releaseDate: figure.releaseDate ? figure.releaseDate.toISOString() : null,
                  }} />
                  <DeleteFigureButton id={figure.id} name={figure.name} />
                </>
              }
            />
          </div>
        ))}
      </div>
    </div>
  )
}
