'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { submitFeedback } from '@/app/actions/feedback'

interface Props {
  type?: string
  placeholder?: string
  compact?: boolean
}

export function FeedbackForm({ type = 'feedback', placeholder = 'Bugs, missing figures, ideas…', compact = false }: Props) {
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    setStatus('sending')
    try {
      await submitFeedback(email, message, type)
      setStatus('sent')
      setMessage('')
      setEmail('')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <div className="border border-border/40 rounded-lg px-4 py-3">
        <p className="text-sm text-muted-foreground">Thanks — we&apos;ll look into it.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
      <Input
        type="email"
        placeholder="Email (optional)"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="text-sm bg-card/50 border-border/50 focus:border-[#4a1258]/50"
      />
      <textarea
        placeholder={placeholder}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        required
        rows={compact ? 3 : 5}
        className="w-full rounded-md border border-border/50 bg-card/50 px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#4a1258]/40 focus:border-[#4a1258]/50 resize-none transition-colors"
      />
      <div className="flex items-center gap-3">
        <Button
          type="submit"
          size="sm"
          disabled={status === 'sending'}
          className="bg-[#4a1258] hover:bg-[#5d1870] text-white text-xs font-mono uppercase tracking-wider"
        >
          {status === 'sending' ? 'Sending…' : 'Send'}
        </Button>
        {status === 'error' && (
          <span className="text-xs text-destructive font-mono">Error. Try again.</span>
        )}
      </div>
    </form>
  )
}
