import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await connection()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login?redirectTo=/admin')

  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail || user.email !== adminEmail) redirect('/')

  return (
    <div className="min-h-screen">
      <div className="border-b border-border bg-muted/40 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Admin</span>
          <span className="text-border">·</span>
          <span className="text-sm font-medium">Action Legends Figure Vault</span>
        </div>
      </div>
      {children}
    </div>
  )
}
