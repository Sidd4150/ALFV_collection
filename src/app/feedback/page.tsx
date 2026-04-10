import { FeedbackForm } from '@/components/FeedbackForm'

export default function FeedbackPage() {
  return (
    <div className="min-h-screen">
      <div className="max-w-xl mx-auto px-4 py-16">
        <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground/50 mb-2">
          Contact
        </p>
        <h1 className="font-display text-5xl leading-none tracking-wide mb-3">Feedback</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Found a bug, have a suggestion, or just want to say something? We read everything.
        </p>
        <FeedbackForm type="feedback" placeholder="Bugs, ideas, anything…" />
      </div>
    </div>
  )
}
