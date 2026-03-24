'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { CollectionStatus } from '@/generated/prisma'

async function getOrCreateUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  return prisma.user.upsert({
    where: { supabaseId: user.id },
    update: {},
    create: {
      supabaseId: user.id,
      email: user.email!,
      username: user.user_metadata?.username ?? user.email!.split('@')[0],
    },
  })
}

export async function upsertCollection(
  figureId: string,
  status: CollectionStatus,
  purchasePrice?: number,
  condition?: string,
  notes?: string
) {
  const dbUser = await getOrCreateUser()

  await prisma.userCollection.upsert({
    where: { userId_figureId: { userId: dbUser.id, figureId } },
    update: { status, purchasePrice: purchasePrice ?? null, condition: condition ?? null, notes: notes ?? null },
    create: { userId: dbUser.id, figureId, status, purchasePrice: purchasePrice ?? null, condition: condition ?? null, notes: notes ?? null },
  })

  revalidatePath('/collection')
  revalidatePath(`/figures/[slug]`, 'page')
}

export async function removeFromCollection(figureId: string) {
  const dbUser = await getOrCreateUser()

  await prisma.userCollection.deleteMany({
    where: { userId: dbUser.id, figureId },
  })

  revalidatePath('/collection')
  revalidatePath(`/figures/[slug]`, 'page')
}

export async function getCollectionEntry(figureId: string) {
  try {
    const dbUser = await getOrCreateUser()
    return prisma.userCollection.findUnique({
      where: { userId_figureId: { userId: dbUser.id, figureId } },
    })
  } catch {
    return null
  }
}
