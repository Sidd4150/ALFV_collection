'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import type { User } from '@supabase/supabase-js'

export function NavbarUser() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (loading) return <div className="w-16 h-8" />

  if (!user) {
    return (
      <Button asChild size="sm" className="bg-orange-500 hover:bg-orange-600 text-white font-bold">
        <Link href="/auth/login">Sign In</Link>
      </Button>
    )
  }

  const displayName = user.user_metadata?.username ?? user.email?.split('@')[0] ?? 'Account'

  return (
    <div className="flex items-center gap-3">
      <Link href="/profile" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
        {displayName}
      </Link>
      <Button
        variant="outline"
        size="sm"
        onClick={handleSignOut}
      >
        Sign Out
      </Button>
    </div>
  )
}
