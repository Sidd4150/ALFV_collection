import { Suspense } from 'react'
import { connection } from 'next/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { ImageUploadRow } from '@/components/admin/ImageUploadRow'
import { AddFigureForm } from '@/components/admin/AddFigureForm'
import { EditFigureForm } from '@/components/admin/EditFigureForm'
import { DeleteFigureButton } from '@/components/admin/DeleteFigureButton'
import { FetchPricesButton } from '@/components/admin/FetchPricesButton'
import { ClearPricesButton } from '@/components/admin/ClearPricesButton'
import { RescrapeLowPricesButton } from '@/components/admin/RescrapeLowPricesButton'

async function AdminContent() {
  await connection()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== process.env.ADMIN_EMAIL) redirect('/auth/login')

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
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground/40 mb-1">Dashboard</p>
          <h1 className="font-display text-5xl leading-none tracking-wide">Figures</h1>
          <p className="text-[11px] font-mono text-muted-foreground/50 mt-2 tabular-nums">
            {withImages}/{figures.length} with images
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap pb-1">
          <RescrapeLowPricesButton />
          <AddFigureForm />
        </div>
      </div>

      {/* Figure list */}
      <div className="space-y-2">
        {figures.map((figure) => (
          <div key={figure.id} className="bg-card border border-border/50 rounded-lg overflow-hidden shadow-sm hover:border-border/80 transition-colors">
            <ImageUploadRow
              figure={figure}
              editSlot={
                <>
                  <FetchPricesButton figureId={figure.id} />
                  <ClearPricesButton figureId={figure.id} />
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

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto px-4 py-8 text-xs font-mono text-muted-foreground/40">Loading…</div>}>
      <AdminContent />
    </Suspense>
  )
}
