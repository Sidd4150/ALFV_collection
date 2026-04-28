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

  const thumb = formData.get('thumb') as File
  const full = formData.get('full') as File
  if (!thumb || thumb.size === 0) throw new Error('No file provided')

  const ts = Date.now()
  const thumbPath = `figures/${figureId}/${ts}_thumb.webp`
  const fullPath = `figures/${figureId}/${ts}_full.webp`

  const [thumbBytes, fullBytes] = await Promise.all([
    thumb.arrayBuffer(),
    full.arrayBuffer(),
  ])

  const [thumbUpload, fullUpload] = await Promise.all([
    supabaseAdmin.storage.from(BUCKET).upload(thumbPath, thumbBytes, { contentType: 'image/webp', upsert: false }),
    supabaseAdmin.storage.from(BUCKET).upload(fullPath, fullBytes, { contentType: 'image/webp', upsert: false }),
  ])

  if (thumbUpload.error) throw thumbUpload.error
  if (fullUpload.error) throw fullUpload.error

  const { data: { publicUrl } } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(thumbPath)

  const figure = await prisma.figure.update({
    where: { id: figureId },
    data: { images: { push: publicUrl } },
    select: { slug: true },
  })

  revalidatePath('/admin')
  revalidatePath(`/figures/${figure.slug}`)
}

export async function deleteFigureImage(figureId: string, imageUrl: string) {
  await requireAdmin()

  const url = new URL(imageUrl)
  const thumbStoragePath = url.pathname.split(`/object/public/${BUCKET}/`)[1]

  const pathsToDelete: string[] = []
  if (thumbStoragePath) {
    pathsToDelete.push(thumbStoragePath)
    // Also delete the full-size counterpart if it exists
    if (thumbStoragePath.includes('_thumb.webp')) {
      pathsToDelete.push(thumbStoragePath.replace('_thumb.webp', '_full.webp'))
    }
  }

  if (pathsToDelete.length > 0) {
    await supabaseAdmin.storage.from(BUCKET).remove(pathsToDelete)
  }

  const figure = await prisma.figure.findUnique({ where: { id: figureId }, select: { slug: true, images: true } })
  if (!figure) throw new Error('Figure not found')

  await prisma.figure.update({
    where: { id: figureId },
    data: { images: figure.images.filter((img) => img !== imageUrl) },
  })

  revalidatePath('/admin')
  revalidatePath(`/figures/${figure.slug}`)
}
