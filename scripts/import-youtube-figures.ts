import 'dotenv/config'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'
dotenv.config({ path: path.join(__dirname, '../.env.local'), override: true })

import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

interface ParsedFigure {
  name: string
  brand: string
  character: string
  series: string
  isThirdParty: boolean
  sourceUrl: string
  sourceTitle: string
}

// Names that clearly aren't a figure product — they're commentary, news, or noise
const NOISE_PATTERNS = [
  /how did they know/i,
  /next week/i,
  /isnt made by/i,
  /isn't made by/i,
  /look sooo good/i,
  /body goes hard/i,
  /update and$/i,
  /promo shots revealed/i,
  /goes hard/i,
  / and$/i,
]

function isNoise(name: string): boolean {
  return NOISE_PATTERNS.some((re) => re.test(name))
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function makeSlugs(brand: string, name: string): string[] {
  // Primary: brand-prefixed slug (avoids conflicts with official figures)
  const brandSlug = slugify(brand)
  const nameSlug = slugify(name)
  const primary = `${brandSlug}-${nameSlug}`
  // Fallback: just the name slug (in case brand is "Bootleg" or "Unknown")
  return [primary, nameSlug]
}

async function main() {
  const inPath = path.join(__dirname, '../scraper/parsed-figures.json')
  const figures: ParsedFigure[] = JSON.parse(fs.readFileSync(inPath, 'utf-8'))

  // By default only import 3rd party; pass --all to include official
  const importAll = process.argv.includes('--all')
  const candidates = importAll ? figures : figures.filter((f) => f.isThirdParty)

  console.log(`\nImporting ${candidates.length} figures (${importAll ? 'all' : '3rd party only'})...\n`)

  let created = 0
  let skipped = 0
  let noise = 0

  for (const fig of candidates) {
    if (isNoise(fig.name)) {
      console.log(`  [NOISE]   ${fig.name}`)
      noise++
      continue
    }

    const [primarySlug, fallbackSlug] = makeSlugs(fig.brand, fig.name)

    // Check if either slug already exists
    const existing = await prisma.figure.findFirst({
      where: { OR: [{ slug: primarySlug }, { slug: fallbackSlug }] },
      select: { id: true, slug: true },
    })

    if (existing) {
      console.log(`  [EXISTS]  ${fig.name} → ${existing.slug}`)
      skipped++
      continue
    }

    const data = {
      slug: primarySlug,
      name: fig.name,
      character: fig.character,
      series: fig.series,
      isThirdParty: fig.isThirdParty,
      brand: undefined, // no brand field on Figure model — stored in name/character
      accessories: [] as string[],
      images: [] as string[],
    }

    await prisma.figure.create({ data })
    console.log(`  [CREATED] [${fig.brand}] ${fig.name}`)
    created++
  }

  console.log(`\n─────────────────────────────────────`)
  console.log(`Created:  ${created}`)
  console.log(`Skipped:  ${skipped} (already in DB)`)
  console.log(`Noise:    ${noise} (filtered as non-figure titles)`)
  console.log(`Total:    ${candidates.length}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
