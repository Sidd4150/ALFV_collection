'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export async function createFigure(formData: FormData) {
  const name = (formData.get('name') as string).trim()
  const character = (formData.get('character') as string).trim()
  const series = (formData.get('series') as string).trim()
  const arc = (formData.get('arc') as string | null)?.trim() || null
  const releaseDateRaw = formData.get('releaseDate') as string | null
  const msrpRaw = formData.get('msrp') as string | null
  const isWebExclusive = formData.get('isWebExclusive') === 'true'
  const isRerelease = formData.get('isRerelease') === 'true'
  const isThirdParty = formData.get('isThirdParty') === 'true'

  if (!name || !character || !series) {
    throw new Error('Name, character, and series are required.')
  }

  const baseSlug = toSlug(name)
  // Ensure uniqueness by appending a suffix if needed
  let slug = baseSlug
  let suffix = 1
  while (await prisma.figure.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix++}`
  }

  const figure = await prisma.figure.create({
    data: {
      slug,
      name,
      character,
      series,
      arc: arc || null,
      releaseDate: releaseDateRaw ? new Date(releaseDateRaw) : null,
      msrp: msrpRaw ? parseFloat(msrpRaw) : null,
      isWebExclusive,
      isRerelease,
      isThirdParty,
      accessories: [],
      images: [],
    },
  })

  revalidatePath('/admin')
  revalidatePath('/catalog')

  return figure.id
}

export async function updateFigure(id: string, formData: FormData) {
  const name = (formData.get('name') as string).trim()
  const character = (formData.get('character') as string).trim()
  const series = (formData.get('series') as string).trim()
  const arc = (formData.get('arc') as string | null)?.trim() || null
  const releaseDateRaw = formData.get('releaseDate') as string | null
  const msrpRaw = formData.get('msrp') as string | null
  const isWebExclusive = formData.get('isWebExclusive') === 'true'
  const isRerelease = formData.get('isRerelease') === 'true'
  const isThirdParty = formData.get('isThirdParty') === 'true'

  if (!name || !character || !series) {
    throw new Error('Name, character, and series are required.')
  }

  const figure = await prisma.figure.findUnique({ where: { id }, select: { slug: true } })
  if (!figure) throw new Error('Figure not found.')

  await prisma.figure.update({
    where: { id },
    data: {
      name,
      character,
      series,
      arc: arc || null,
      releaseDate: releaseDateRaw ? new Date(releaseDateRaw) : null,
      msrp: msrpRaw ? parseFloat(msrpRaw) : null,
      isWebExclusive,
      isRerelease,
      isThirdParty,
    },
  })

  revalidatePath('/admin')
  revalidatePath('/catalog')
  revalidatePath(`/figures/${figure.slug}`)
}

export async function deleteFigure(id: string) {
  const figure = await prisma.figure.findUnique({ where: { id }, select: { slug: true } })
  if (!figure) throw new Error('Figure not found.')

  await prisma.figure.delete({ where: { id } })

  revalidatePath('/admin')
  revalidatePath('/catalog')
  revalidatePath(`/figures/${figure.slug}`)
}
