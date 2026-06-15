import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export async function getSessionUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function requireUser() {
  const user = await getSessionUser()
  if (!user) throw new Error('Not authenticated')
  return user
}

export async function isAdmin() {
  const user = await getSessionUser()
  if (!user) return false
  
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { isAdmin: true }
  })
  
  return dbUser?.isAdmin || user.email === process.env.ADMIN_EMAIL
}

export async function requireAdmin() {
  const user = await requireUser()
  
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { isAdmin: true }
  })

  const isExplicitAdmin = dbUser?.isAdmin || user.email === process.env.ADMIN_EMAIL
  
  if (!isExplicitAdmin) {
    throw new Error('Not authorized')
  }
  
  return user
}
