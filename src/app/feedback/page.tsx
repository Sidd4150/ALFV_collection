'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { FeedbackForm } from '@/components/FeedbackForm'

type Tab = 'feedback' | 'missing'

function FeedbackContent() {
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<Tab>(() =>
    searchParams.get('tab') === 'missing' ? 'missing' : 'feedback'
  )

  useEffect(() => {
    if (searchParams.get('tab') === 'missing') setTab('missing')
  }, [searchParams])

  return (
    <>
      {/* Tab toggle */}
      <div className="flex gap-1 p-1 rounded-lg bg-muted/40 border border-border/40 mb-8 w-fit">
        <button
          onClick={() => setTab('feedback')}
          className={`px-4 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider transition-all ${
            tab === 'feedback'
              ? 'bg-[#4a1258] text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Send Feedback
        </button>
        <button
          onClick={() => setTab('missing')}
          className={`px-4 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider transition-all ${
            tab === 'missing'
              ? 'bg-[#4a1258] text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Missing Figure?
        </button>
      </div>

      {tab === 'feedback' ? (
        <div>
          <p className="text-sm text-muted-foreground mb-5">
            Found a bug, have a suggestion, or just want to say something? We read everything.
          </p>
          <FeedbackForm type="feedback" placeholder="Bugs, ideas, anything…" />
        </div>
      ) : (
        <div>
          <p className="text-sm text-muted-foreground mb-5">
            Don&apos;t see a figure that should be in the catalog? Let us know which one and we&apos;ll add it.
          </p>
          <FeedbackForm
            type="missing_figure"
            placeholder="e.g. S.H. Figuarts Super Saiyan 3 Goku (2024 re-release)…"
          />
        </div>
      )}
    </>
  )
}

export default function FeedbackPage() {
  return (
    <div className="min-h-screen">
      <div className="max-w-xl mx-auto px-4 py-16">
        <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground/50 mb-2">
          Contact
        </p>
        <h1 className="font-display text-5xl leading-none tracking-wide mb-8">Feedback</h1>
        <Suspense>
          <FeedbackContent />
        </Suspense>
      </div>
    </div>
  )
}
