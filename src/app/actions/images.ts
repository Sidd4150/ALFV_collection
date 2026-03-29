'use server'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin, BUCKET, ensureBucket } from '@/lib/supabase/admin'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail || user.email !== adminEmail) throw new Error('Not authorized')
}

export async function uploadFigureImage(figureId: string, formData: FormData) {
  await requireAdmin()
  await ensureBucket()

  const file = formData.get('image') as File
  if (!file || file.size === 0) throw new Error('No file provided')

  const ext = file.name.split('.').pop()
  const filename = `${Date.now()}.${ext}`
  const path = `figures/${figureId}/${filename}`

  const bytes = await file.arrayBuffer()

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: false })

  if (error) throw error

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from(BUCKET)
    .getPublicUrl(path)

  await prisma.figure.update({
    where: { id: figureId },
    data: { images: { push: publicUrl } },
  })

  revalidatePath('/admin')
  revalidatePath('/')
  revalidatePath('/figures/[slug]', 'page')
}

export async function deleteFigureImage(figureId: string, imageUrl: string) {
  await requireAdmin()

  // Extract storage path from URL
  const url = new URL(imageUrl)
  const path = url.pathname.split(`/object/public/${BUCKET}/`)[1]

  if (path) {
    await supabaseAdmin.storage.from(BUCKET).remove([path])
  }

  const figure = await prisma.figure.findUnique({ where: { id: figureId } })
  if (!figure) throw new Error('Figure not found')

  await prisma.figure.update({
    where: { id: figureId },
    data: { images: figure.images.filter((img) => img !== imageUrl) },
  })

  revalidatePath('/admin')
  revalidatePath('/')
  revalidatePath('/figures/[slug]', 'page')
}
