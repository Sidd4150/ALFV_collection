'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ThemeToggle'
import { NavbarUser } from '@/components/NavbarUser'

const navLinks = [
  { href: '/', label: 'Catalog' },
  { href: '/collection', label: 'Collection' },
  { href: '/feedback', label: 'Feedback' },
]

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="bg-background/95 backdrop-blur-md sticky top-0 z-50">
      {/* Purple top accent stripe */}
      <div className="h-[2px] w-full bg-[#4a1258]" />

      <div className="border-b border-border/40 shadow-[0_1px_20px_rgba(74,18,88,0.15)]">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group" onClick={() => setMobileOpen(false)}>
            <Image src="/favicon.png" alt="ALFV" width={32} height={32} className="object-contain opacity-90 group-hover:opacity-100 transition-opacity" priority />
            <span className="font-display text-3xl leading-none tracking-wider text-[#4a1258]">ALFV</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-7">
            {navLinks.map((l, i) => (
              <Link
                key={l.href}
                href={l.href}
                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
              >
                <span className="text-[10px] font-mono text-muted-foreground/40 group-hover:text-[#4a1258]/70 transition-colors tabular-nums">
                  0{i + 1}
                </span>
                {l.label}
              </Link>
            ))}
            <div className="w-px h-4 bg-border/60" />
            <ThemeToggle />
            <NavbarUser />
          </div>

          {/* Mobile: theme + hamburger */}
          <div className="flex md:hidden items-center gap-1">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle menu"
              onClick={() => setMobileOpen((o) => !o)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border/30 bg-background/98 px-4 py-4 flex flex-col gap-1">
            {navLinks.map((l, i) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 py-2.5 px-3 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors group"
              >
                <span className="text-[10px] font-mono text-muted-foreground/30 group-hover:text-[#4a1258]/60 transition-colors">0{i + 1}</span>
                <span className="text-sm font-medium">{l.label}</span>
              </Link>
            ))}
            <div className="pt-2 border-t border-border/30 mt-1">
              <NavbarUser />
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
