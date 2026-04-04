import { NextRequest, NextResponse } from 'next/server'
import { ApifyClient } from 'apify-client'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const figures = await prisma.figure.findMany({ select: { id: true, name: true, isThirdParty: true } })
  const client = new ApifyClient({ token: process.env.APIFY_TOKEN })

  let totalImported = 0
  let totalSkipped = 0

  for (const figure of figures) {
    try {
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

      for (const item of items) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const i = item as any
        const price = parseFloat(i.soldPrice ?? '0')
        const externalId = String(i.itemId ?? '')
        const soldAt = i.endedAt ?? null

        if (!price || price < 15 || !externalId) { totalSkipped++; continue }

        try {
          await prisma.priceSale.create({
            data: {
              figureId: figure.id,
              price,
              saleDate: soldAt ? new Date(soldAt) : new Date(),
              source: 'ebay',
              condition: i.condition ?? null,
              sourceUrl: i.url ?? i.itemUrl ?? null,
              externalId,
            },
          })
          totalImported++
        } catch {
          totalSkipped++
        }
      }
    } catch (err) {
      console.error(`Failed to fetch prices for ${figure.name}:`, err)
    }
  }

  return NextResponse.json({ imported: totalImported, skipped: totalSkipped, figures: figures.length })
}
