'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { submitFeedback } from '@/app/actions/feedback'

export function Footer() {
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    setStatus('sending')
    try {
      await submitFeedback(email, message)
      setStatus('sent')
      setMessage('')
      setEmail('')
    } catch {
      setStatus('error')
    }
  }

  return (
    <footer className="border-t border-border bg-background mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-10 flex flex-col md:flex-row gap-10 md:gap-20">
        {/* Brand */}
        <div className="flex flex-col gap-2 min-w-[160px]">
          <span className="text-lg font-black tracking-tight" style={{ color: '#4a1258' }}>ALFV</span>
          <span className="text-xs text-muted-foreground">Action Legends Figure Vault</span>
          <span className="text-xs text-muted-foreground">Track your S.H. Figuarts collection &amp; market prices.</span>
        </div>

        {/* Feedback form */}
        <div className="flex-1 max-w-md">
          <p className="text-sm font-semibold mb-3">Send Feedback</p>
          {status === 'sent' ? (
            <p className="text-sm text-muted-foreground">Thanks for the feedback!</p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-2">
              <Input
                type="email"
                placeholder="Email (optional)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-sm"
              />
              <textarea
                placeholder="What's on your mind? Bugs, missing figures, ideas…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
              <div className="flex items-center gap-3">
                <Button type="submit" size="sm" disabled={status === 'sending'}>
                  {status === 'sending' ? 'Sending…' : 'Send'}
                </Button>
                {status === 'error' && (
                  <span className="text-xs text-destructive">Something went wrong. Try again.</span>
                )}
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 text-xs text-muted-foreground">
          © {new Date().getFullYear()} ALFV. Not affiliated with Bandai or Tamashii Nations.
        </div>
      </div>
    </footer>
  )
}
