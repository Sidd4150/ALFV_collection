import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { DeleteAccountButton } from '@/components/DeleteAccountButton'

async function ProfileContent() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirectTo=/profile')

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: {
      _count: {
        select: { collections: true },
      },
    },
  })

  const [ownedCount, wishlistCount] = dbUser
    ? await Promise.all([
        prisma.userCollection.count({ where: { userId: dbUser.id, status: 'OWNED' } }),
        prisma.userCollection.count({ where: { userId: dbUser.id, status: 'WISHLIST' } }),
      ])
    : [0, 0]

  const displayName = user.user_metadata?.username ?? user.email?.split('@')[0] ?? 'Collector'
  const joinedAt = dbUser?.createdAt ?? new Date(user.created_at)

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-10">
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground/40 mb-1">Account</p>
          <h1 className="font-display text-5xl leading-none tracking-wide">{displayName}</h1>
        </div>

        {/* Info */}
        <div className="bg-card border border-border/50 rounded-lg divide-y divide-border/30 shadow-md mb-6">
          <Row label="Username" value={displayName} />
          <Row label="Email" value={user.email ?? '—'} />
          <Row
            label="Member since"
            value={joinedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          />
        </div>

        {/* Collection stats */}
        <div className="bg-card border border-border/50 rounded-lg divide-y divide-border/30 shadow-md mb-10">
          <Row label="Owned" value={String(ownedCount)} mono />
          <Row label="Wishlisted" value={String(wishlistCount)} mono />
        </div>

        {/* Danger zone */}
        <div className="border border-destructive/20 rounded-lg p-5 bg-destructive/5">
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-destructive/60 mb-1">Danger Zone</p>
          <p className="text-sm text-muted-foreground mb-4">
            Permanently delete your account and all collection data. This cannot be undone.
          </p>
          <DeleteAccountButton />
        </div>

      </div>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto px-4 py-10 text-xs font-mono text-muted-foreground/40">Loading…</div>}>
      <ProfileContent />
    </Suspense>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5 gap-4">
      <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-muted-foreground/50 shrink-0">{label}</span>
      <span className={`text-sm truncate text-right ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )
}
