import 'dotenv/config'
import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.join(__dirname, '../.env.local'), override: true })

import { chromium } from 'playwright'
import * as cheerio from 'cheerio'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

type SoldListing = {
  itemId: string
  title: string
  price: number
  soldDate: Date
  url: string
  condition: string
}

function extractItemId(url: string): string {
  const match = url.match(/\/itm\/(\d+)/)
  return match ? match[1] : url
}

function parsePrice(raw: string): number | null {
  // Handle ranges like "$40.00 to $50.00" — take the lower
  const cleaned = raw.replace(/to\s*\$[\d,.]+/i, '').trim()
  const match = cleaned.match(/([\d,]+\.?\d*)/)
  if (!match) return null
  return parseFloat(match[1].replace(/,/g, ''))
}

function parseSoldDate(raw: string): Date | null {
  const cleaned = raw.replace(/^Sold\s+/i, '').trim()
  const d = new Date(cleaned)
  return isNaN(d.getTime()) ? null : d
}

function normalizeCondition(raw: string): string {
  const lower = raw.toLowerCase()
  if (lower.includes('open box')) return 'Open Box'
  if (lower.includes('new')) return 'Mint in Box'
  if (lower.includes('pre-owned') || lower.includes('used')) return 'Loose'
  return 'Used'
}

async function parseListings(html: string, maxResults = 3): Promise<SoldListing[]> {
  const $ = cheerio.load(html)
  const results: SoldListing[] = []

  $('li.s-item, div.s-item').each((_i, el) => {
    if (results.length >= maxResults) return false

    const title = $(el).find('.s-item__title').text().trim()
    if (!title || title === 'Shop on eBay') return

    const priceText = $(el).find('.s-item__price').first().text().trim()
    const price = parsePrice(priceText)
    if (!price || price <= 0) return

    const href = $(el).find('a.s-item__link').attr('href') ?? ''
    const url = href.split('?')[0]
    if (!url) return

    const itemId = extractItemId(url)
    const soldDateText = $(el).find('.POSITIVE').text().trim()
    const soldDate = parseSoldDate(soldDateText) ?? new Date()
    const condition = normalizeCondition($(el).find('.SECONDARY_INFO').first().text().trim())

    results.push({ itemId, title, price, soldDate, url, condition })
  })

  return results
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function main() {
  // Optional: --figure "Name" to sync a single figure
  const singleArg = process.argv.indexOf('--figure')
  const singleName = singleArg !== -1 ? process.argv[singleArg + 1] : null

  const figures = await prisma.figure.findMany({
    select: { id: true, name: true },
    orderBy: { updatedAt: 'desc' },
    ...(singleName
      ? { where: { name: { contains: singleName, mode: 'insensitive' } } }
      : {}),
  })

  console.log(`\nLaunching browser...`)
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'en-US',
    viewport: { width: 1280, height: 800 },
  })
  const page = await context.newPage()

  // Block images/fonts to speed up loads
  await page.route('**/*.{png,jpg,jpeg,gif,webp,svg,woff,woff2,ttf}', (r) => r.abort())

  console.log(`Scraping eBay sold listings for ${figures.length} figure(s)...\n`)

  let totalSaved = 0
  let totalSkipped = 0
  let totalErrors = 0

  for (const figure of figures) {
    const query = encodeURIComponent(`${figure.name} SHF`)
    const url =
      `https://www.ebay.com/sch/i.html?_nkw=${query}&LH_Complete=1&LH_Sold=1&_sop=13&LH_PrefLoc=1&_ipg=10`

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 })
      // Brief wait for dynamic content
      await sleep(800)
      const html = await page.content()
      const listings = await parseListings(html, 3)

      if (listings.length === 0) {
        console.log(`  – ${figure.name}: no results`)
        await sleep(1500)
        continue
      }

      let saved = 0
      for (const listing of listings) {
        try {
          await prisma.priceSale.create({
            data: {
              figureId: figure.id,
              price: listing.price,
              saleDate: listing.soldDate,
              source: 'eBay',
              condition: listing.condition,
              sourceUrl: listing.url,
              externalId: `ebay-${listing.itemId}`,
            },
          })
          saved++
          totalSaved++
        } catch {
          totalSkipped++
        }
      }

      const prices = listings.map((l) => `$${l.price.toFixed(2)}`).join(', ')
      console.log(`  ✓ ${figure.name}: ${saved} new [${prices}]`)
    } catch (err) {
      console.warn(`  [ERROR] ${figure.name}: ${err}`)
      totalErrors++
    }

    // Polite delay between pages
    await sleep(2000 + Math.random() * 1000)
  }

  await browser.close()

  console.log('\n─────────────────────────────────────')
  console.log(`Saved:    ${totalSaved}`)
  console.log(`Skipped:  ${totalSkipped} (already in DB)`)
  console.log(`Errors:   ${totalErrors}`)
  console.log(`Total:    ${figures.length} figures processed`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
