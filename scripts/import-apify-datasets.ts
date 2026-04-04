import { ApifyClient } from 'apify-client'
import { PrismaClient } from '../src/generated/prisma'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })
const client = new ApifyClient({ token: process.env.APIFY_TOKEN })

const ACTOR_ID = 'oTtB3VgfuE9GtxQt2'

async function main() {
  // Build a map of normalized figure name -> figureId for fast lookup
  const figures = await prisma.figure.findMany({ select: { id: true, name: true } })
  const figureMap = new Map(figures.map((f) => [f.name.replace(/[-/]/g, ' ').toLowerCase(), f.id]))
  console.log(`Loaded ${figures.length} figures from DB`)

  // List all runs of the actor
  const { items: runs } = await client.actor(ACTOR_ID).runs().list({ limit: 500 })
  console.log(`Found ${runs.length} actor runs\n`)

  let totalImported = 0
  let totalSkipped = 0
  let unmatched = 0

  for (const run of runs) {
    // Get the run input from the key-value store
    const runDetails = await client.run(run.id).get()
    if (!runDetails?.defaultKeyValueStoreId) { unmatched++; continue }
    const inputRecord = await client.keyValueStore(runDetails.defaultKeyValueStoreId).getRecord('INPUT')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const keyword = (inputRecord?.value as any)?.keyword as string | undefined
    if (!keyword) { unmatched++; continue }

    const figureId = figureMap.get(keyword.toLowerCase())
    if (!figureId) {
      console.log(`  No match for keyword: "${keyword}"`)
      unmatched++
      continue
    }

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
            figureId,
            price,
            saleDate: soldAt ? new Date(soldAt) : new Date(),
            source: 'ebay',
            condition: i.condition ?? null,
            sourceUrl: i.url ?? null,
            externalId,
          },
        })
        imported++
        totalImported++
      } catch {
        totalSkipped++
      }
    }

    const figureName = figures.find((f) => f.id === figureId)?.name
    console.log(`  ✓ ${figureName}: ${imported} imported`)
  }

  console.log(`\nDone. ${totalImported} imported, ${totalSkipped} skipped, ${unmatched} unmatched runs.`)
  await pool.end()
}

main().catch(console.error)
