import { ApifyClient } from 'apify-client'
import { PrismaClient } from '../src/generated/prisma'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })
const client = new ApifyClient({ token: process.env.APIFY_TOKEN })

async function main() {
  const figures = await prisma.figure.findMany({ select: { id: true, name: true, isThirdParty: true } })
  console.log(`Fetching prices for ${figures.length} figures...`)

  let totalImported = 0
  let totalSkipped = 0

  for (const figure of figures) {
    process.stdout.write(`  ${figure.name}... `)
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
      let imported = 0

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
          imported++
          totalImported++
        } catch {
          totalSkipped++
        }
      }

      console.log(`${imported} imported`)
    } catch (err) {
      console.log(`ERROR: ${err instanceof Error ? err.message : err}`)
    }
  }

  console.log(`\nDone. ${totalImported} imported, ${totalSkipped} skipped.`)
  await pool.end()
}

main().catch(console.error)
