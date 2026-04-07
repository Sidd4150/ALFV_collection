'use client'

import Link from 'next/link'
import { FeedbackForm } from '@/components/FeedbackForm'

export function Footer() {
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
          <div className="flex gap-4 mt-2">
            <Link
              href="/feedback"
              className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50 hover:text-[#4a1258] transition-colors"
            >
              Feedback
            </Link>
            <Link
              href="/feedback?tab=missing"
              className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50 hover:text-[#4a1258] transition-colors"
            >
              Missing Figure?
            </Link>
          </div>
        </div>

        {/* Vertical divider */}
        <div className="hidden md:block self-stretch bg-border/30" />

        {/* Feedback */}
        <div className="max-w-md">
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground/50 mb-4">
            Send Feedback
          </p>
          <FeedbackForm type="feedback" placeholder="Bugs, missing figures, ideas…" compact />
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
