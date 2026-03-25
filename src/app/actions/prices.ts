'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function submitPrice(figureId: string, figureSlug: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const price = parseFloat(formData.get('price') as string)
  const saleDateRaw = formData.get('saleDate') as string
  const source = (formData.get('source') as string).trim()
  const condition = (formData.get('condition') as string | null)?.trim() || null

  if (!price || price <= 0) throw new Error('Invalid price.')
  if (!saleDateRaw) throw new Error('Sale date is required.')
  if (!source) throw new Error('Source is required.')

  let submittedBy: string | null = null
  if (user) {
    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id }, select: { id: true } })
    submittedBy = dbUser?.id ?? null
  }

  await prisma.priceSale.create({
    data: {
      figureId,
      price,
      saleDate: new Date(saleDateRaw),
      source,
      condition,
      submittedBy,
    },
  })

  revalidatePath(`/figures/${figureSlug}`)
}
