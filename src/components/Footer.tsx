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
    <footer className="border-t border-border/30 bg-background mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-10 grid md:grid-cols-[1fr_1px_1fr] gap-10 items-start">

        {/* Brand */}
        <div className="flex flex-col gap-3">
          <span className="font-display text-5xl leading-none text-[#4a1258]">ALFV</span>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-[220px]">
            Action Legends Figure Vault. Track your S.H. Figuarts Dragon Ball collection & market prices.
          </p>
          <div className="flex gap-3 mt-1">
            <span className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-widest border border-border/40 rounded px-2 py-1">
              SHF
            </span>
            <span className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-widest border border-border/40 rounded px-2 py-1">
              Dragon Ball
            </span>
          </div>
        </div>

        {/* Vertical divider */}
        <div className="hidden md:block self-stretch bg-border/30" />

        {/* Feedback */}
        <div className="max-w-md">
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground/50 mb-4">
            Send Feedback
          </p>
          {status === 'sent' ? (
            <div className="border border-border/40 rounded-lg px-4 py-3">
              <p className="text-sm text-muted-foreground">Thanks — feedback received.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
              <Input
                type="email"
                placeholder="Email (optional)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-sm bg-card/50 border-border/50 focus:border-[#4a1258]/50"
              />
              <textarea
                placeholder="Bugs, missing figures, ideas…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={3}
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
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border/20 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <span className="text-[10px] font-mono text-muted-foreground/30 uppercase tracking-widest">
            © 2026 ALFV
          </span>
          <span className="text-[10px] font-mono text-muted-foreground/25 uppercase tracking-widest text-right">
            Not affiliated with Bandai or Tamashii Nations
          </span>
        </div>
      </div>
    </footer>
  )
}
