'use server'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export async function deleteAccount() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Delete Prisma user — cascades to UserCollection and PriceSale
  await prisma.user.deleteMany({ where: { supabaseId: user.id } })

  // Delete the Supabase auth record
  await supabaseAdmin.auth.admin.deleteUser(user.id)

  // Sign out the session
  await supabase.auth.signOut()

  redirect('/')
}
