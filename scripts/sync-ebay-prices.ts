import 'dotenv/config'
import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.join(__dirname, '../.env.local'), override: true })

import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

// ── eBay OAuth token ──────────────────────────────────────────────────────────

async function getEbayToken(): Promise<string> {
  const credentials = Buffer.from(
    `${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`
  ).toString('base64')

  const res = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope',
  })

  if (!res.ok) throw new Error(`eBay auth failed: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.access_token
}

// ── eBay search for sold listings ─────────────────────────────────────────────

type EbayItem = {
  itemId: string
  title: string
  price: { value: string; currency: string }
  itemWebUrl: string
  lastSoldDate?: string
  itemCreationDate?: string
  condition?: string
}

async function fetchSoldListings(query: string, token: string): Promise<EbayItem[]> {
  const params = new URLSearchParams({
    q: query,
    filter: 'buyingOptions:{FIXED_PRICE},conditions:{USED|LIKE_NEW|NEW},itemLocationCountry:US',
    sort: 'newlyListed',
    limit: '3',
  })

  // Use the Marketplace Insights API for sold listings
  const res = await fetch(
    `https://api.ebay.com/buy/marketplace_insights/v1_beta/item_sales/search?${params}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
        'Content-Type': 'application/json',
      },
    }
  )

  if (!res.ok) {
    console.warn(`  eBay search failed for "${query}": ${res.status}`)
    return []
  }

  const data = await res.json()
  return (data.itemSales ?? []).slice(0, 3)
}

// ── Parse condition ───────────────────────────────────────────────────────────

function parseCondition(item: EbayItem): string {
  const c = item.condition?.toLowerCase() ?? ''
  if (c.includes('new')) return 'Mint in Box'
  if (c.includes('like new') || c.includes('open box')) return 'Open Box'
  if (c.includes('used')) return 'Loose'
  return 'Used'
}

// ── Main sync ─────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.EBAY_CLIENT_ID || process.env.EBAY_CLIENT_ID === 'your_ebay_client_id') {
    console.error('eBay credentials not set in .env.local')
    process.exit(1)
  }

  console.log('Getting eBay token...')
  const token = await getEbayToken()

  const figures = await prisma.figure.findMany({
    select: { id: true, name: true, character: true, slug: true },
    orderBy: { updatedAt: 'desc' },
  })

  console.log(`Syncing eBay prices for ${figures.length} figures...\n`)

  let totalSaved = 0
  let totalSkipped = 0

  for (const figure of figures) {
    const query = `${figure.name} SHF`
    const items = await fetchSoldListings(query, token)

    if (items.length === 0) {
      console.log(`  – ${figure.name}: no results`)
      continue
    }

    let saved = 0
    for (const item of items) {
      const price = parseFloat(item.price.value)
      if (!price || item.price.currency !== 'USD') continue

      const saleDate = new Date(item.lastSoldDate ?? item.itemCreationDate ?? Date.now())

      try {
        await prisma.priceSale.create({
          data: {
            figureId: figure.id,
            price,
            saleDate,
            source: 'eBay',
            condition: parseCondition(item),
            sourceUrl: item.itemWebUrl,
            externalId: item.itemId,
          },
        })
        saved++
        totalSaved++
      } catch {
        // externalId unique constraint = already imported, skip
        totalSkipped++
      }
    }

    console.log(`  ✓ ${figure.name}: ${saved} new sale(s)`)

    // Be nice to the API — small delay between requests
    await new Promise((r) => setTimeout(r, 300))
  }

  console.log(`\nDone. Saved: ${totalSaved}, Skipped (duplicates): ${totalSkipped}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
