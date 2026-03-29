'use server'

import { ApifyClient } from 'apify-client'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail || user.email !== adminEmail) throw new Error('Not authorized')
}

export async function fetchEbayPrices(figureId: string): Promise<{ imported: number; skipped: number }> {
  await requireAdmin()

  const figure = await prisma.figure.findUnique({ where: { id: figureId }, select: { name: true, series: true, isThirdParty: true } })
  if (!figure) throw new Error('Figure not found')

  const client = new ApifyClient({ token: process.env.APIFY_TOKEN })
  const baseName = figure.name.replace(/[-/]/g, ' ')
  const keyword = figure.isThirdParty ? baseName : `${baseName} SH Figuarts`

  const run = await client.actor('oTtB3VgfuE9GtxQt2').call({
    keyword,
    daysToScrape: 90,
    count: 3,
    categoryId: '0',
    ebaySite: 'ebay.com',
    sortOrder: 'endedRecently',
    itemCondition: 'any',
    currencyMode: 'USD',
    detailedSearch: false,
  })

  const { items } = await client.dataset(run.defaultDatasetId).listItems()

  let imported = 0
  let skipped = 0

  for (const item of items) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const i = item as any
    const price = parseFloat(i.soldPrice ?? '0')
    const externalId = String(i.itemId ?? '')
    const soldAt = i.endedAt ?? null

    if (!price || !externalId) { skipped++; continue }

    try {
      await prisma.priceSale.create({
        data: {
          figureId,
          price,
          saleDate: soldAt ? new Date(soldAt) : new Date(),
          source: 'ebay',
          condition: i.condition ?? null,
          sourceUrl: i.url ?? i.itemUrl ?? null,
          externalId,
        },
      })
      imported++
    } catch {
      // externalId unique constraint = already exists
      skipped++
    }
  }

  revalidatePath('/admin')
  revalidatePath('/')

  return { imported, skipped }
}
