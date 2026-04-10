import { Suspense } from 'react'
import { connection } from 'next/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { AddFigureForm } from '@/components/admin/AddFigureForm'
import { RescrapeLowPricesButton } from '@/components/admin/RescrapeLowPricesButton'
import { SubmissionActions } from '@/components/admin/SubmissionActions'
import { AdminFigureList } from '@/components/admin/AdminFigureList'

async function AdminContent() {
  await connection()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== process.env.ADMIN_EMAIL) redirect('/auth/login')

  const [pendingSubmissions, figures, priceCount] = await Promise.all([
    prisma.figureSubmission.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.figure.findMany({
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
    }),
    prisma.priceSale.groupBy({ by: ['figureId'], _count: true }),
  ])

  const withImages = figures.filter((f) => f.images.length > 0).length
  const withPrices = priceCount.length

  const serializedFigures = figures.map((f) => ({
    ...f,
    releaseDate: f.releaseDate ? f.releaseDate.toISOString() : null,
  }))

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground/40 mb-1">Dashboard</p>
          <h1 className="font-display text-5xl leading-none tracking-wide mb-4">Admin</h1>
          <div className="flex flex-wrap gap-4">
            {[
              { label: 'Figures', value: figures.length },
              { label: 'With Images', value: `${withImages}/${figures.length}` },
              { label: 'With Prices', value: `${withPrices}/${figures.length}` },
              ...(pendingSubmissions.length > 0 ? [{ label: 'Pending', value: pendingSubmissions.length, highlight: true }] : []),
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className={`text-xl font-mono font-bold tabular-nums ${(s as { highlight?: boolean }).highlight ? 'text-orange-400' : ''}`}>{s.value}</p>
                <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/40 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap shrink-0 pt-1">
          <RescrapeLowPricesButton />
          <AddFigureForm />
        </div>
      </div>

      {/* Pending submissions */}
      <div className="mb-8 bg-card border border-border/50 rounded-xl p-5 shadow-sm">
        <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full inline-block ${pendingSubmissions.length > 0 ? 'bg-orange-400' : 'bg-muted-foreground/30'}`} />
          User Submissions
          <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${pendingSubmissions.length > 0 ? 'bg-orange-500/20 text-orange-400' : 'bg-muted text-muted-foreground/50'}`}>
            {pendingSubmissions.length} pending
          </span>
        </h2>
        {pendingSubmissions.length === 0 ? (
          <p className="text-xs font-mono text-muted-foreground/40 uppercase tracking-widest text-center py-4">No pending submissions</p>
        ) : (
          <div className="space-y-3">
            {pendingSubmissions.map((sub) => (
              <div key={sub.id} className="bg-background border border-border/40 rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{sub.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {sub.character} · {sub.series}
                      {sub.arc ? ` · ${sub.arc}` : ''}
                      {sub.releaseDate ? ` · ${sub.releaseDate}` : ''}
                      {sub.msrp ? ` · $${sub.msrp}` : ''}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {sub.isWebExclusive && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">WEB</span>}
                      {sub.isRerelease && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">RE</span>}
                      {sub.isThirdParty && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">3P</span>}
                    </div>
                    {sub.notes && (
                      <p className="text-xs text-muted-foreground/60 mt-2 border-t border-border/40 pt-2 italic">{sub.notes}</p>
                    )}
                  </div>
                  <SubmissionActions id={sub.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Figure list */}
      <AdminFigureList figures={serializedFigures} />
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
