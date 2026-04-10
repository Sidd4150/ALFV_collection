'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  if (!process.env.ADMIN_EMAIL || user.email !== process.env.ADMIN_EMAIL) throw new Error('Not authorized')
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export async function submitFigure(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const name = (formData.get('name') as string).trim()
  const character = (formData.get('character') as string).trim()
  const series = (formData.get('series') as string).trim()
  if (!name || !character || !series) throw new Error('Name, character, and series are required.')

  const dbUser = user
    ? await prisma.user.findUnique({ where: { supabaseId: user.id }, select: { id: true } })
    : null

  await prisma.figureSubmission.create({
    data: {
      name,
      character,
      series,
      arc: (formData.get('arc') as string | null)?.trim() || null,
      releaseDate: (formData.get('releaseDate') as string | null) || null,
      msrp: formData.get('msrp') ? parseFloat(formData.get('msrp') as string) : null,
      msrpJpy: formData.get('msrpJpy') ? parseInt(formData.get('msrpJpy') as string) : null,
      janCode: (formData.get('janCode') as string | null)?.trim() || null,
      version: (formData.get('version') as string | null)?.trim() || null,
      description: (formData.get('description') as string | null)?.trim() || null,
      isWebExclusive: formData.get('isWebExclusive') === 'true',
      isRerelease: formData.get('isRerelease') === 'true',
      isThirdParty: formData.get('isThirdParty') === 'true',
      accessories: formData.getAll('accessories').map((a) => (a as string).trim()).filter(Boolean),
      notes: (formData.get('notes') as string | null)?.trim() || null,
      submittedBy: dbUser?.id ?? null,
    },
  })
}

export async function approveSubmission(id: string) {
  await requireAdmin()

  const sub = await prisma.figureSubmission.findUniqueOrThrow({ where: { id } })

  let slug = toSlug(sub.name)
  const existing = await prisma.figure.findUnique({ where: { slug } })
  if (existing) slug = `${slug}-${Date.now()}`

  await prisma.figure.create({
    data: {
      slug,
      name: sub.name,
      character: sub.character,
      series: sub.series,
      arc: sub.arc,
      releaseDate: sub.releaseDate ? new Date(sub.releaseDate) : null,
      msrp: sub.msrp,
      msrpJpy: sub.msrpJpy,
      janCode: sub.janCode,
      version: sub.version,
      description: sub.description,
      isWebExclusive: sub.isWebExclusive,
      isRerelease: sub.isRerelease,
      isThirdParty: sub.isThirdParty,
      accessories: sub.accessories,
    },
  })

  await prisma.figureSubmission.update({ where: { id }, data: { status: 'APPROVED' } })

  revalidatePath('/admin')
  revalidatePath('/')
}

export async function rejectSubmission(id: string) {
  await requireAdmin()
  await prisma.figureSubmission.update({ where: { id }, data: { status: 'REJECTED' } })
  revalidatePath('/admin')
}
