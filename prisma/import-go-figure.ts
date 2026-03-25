import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma'
import * as fs from 'fs'
import * as path from 'path'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

interface GoFigureEntry {
  url: string
  name: string
  image_url: string
  details: Record<string, string>
  contents: string[] | null
}

// Sorted longest-first so more specific names match before substrings
const KNOWN_CHARACTERS = [
  'Super Android 17',
  'Android 19',
  'Android 18',
  'Android 17',
  'Golden Frieza',
  'Full Power Frieza',
  'Orange Piccolo',
  'Goku Black',
  'Future Trunks',
  'Son Gohan',
  'Gotenks',
  'Son Goku',
  'Vegito',
  'Gogeta',
  'Vegeta',
  'Frieza',
  'Piccolo',
  'Beerus',
  'Jiren',
  'Broly',
  'Krillin',
  'Bardock',
  'Caulifla',
  'Nappa',
  'Raditz',
  'Yamcha',
  'Cooler',
  'Turles',
  'Whis',
  'Hit',
  'Pan',
  'Cell',
  'Kale',
  'Toppo',
  'Master Roshi',
  'King Cold',
  'Bulma',
  'Videl',
  'Cabba',
]

function extractCharacter(name: string): string {
  const lower = name.toLowerCase()
  for (const char of KNOWN_CHARACTERS) {
    if (lower.includes(char.toLowerCase())) return char
  }
  // Fallback: first two words
  const words = name.split(' ')
  return words.slice(0, Math.min(2, words.length)).join(' ')
}

function extractSeries(name: string): string {
  const lower = name.toLowerCase()
  if (/ gt\b|-gt\b/.test(lower)) return 'Dragon Ball GT'
  if (lower.includes('daima')) return 'Dragon Ball Daima'
  if (
    lower.includes('super saiyan god') ||
    lower.includes('super saiyan blue') ||
    lower.includes('ultra instinct') ||
    lower.includes('super hero') ||
    lower.includes('tournament of power') ||
    lower.includes('future trunks') ||
    lower.includes('universe 6') ||
    lower.includes('universe 11') ||
    lower.includes('unwavering saiyan') ||
    lower.includes('goku black') ||
    lower.includes('vegito') ||
    (lower.includes('gogeta') && lower.includes('blue')) ||
    lower.includes('innocent challenger')
  ) return 'Dragon Ball Super'
  return 'Dragon Ball Z'
}

function parseReleaseDate(dateStr: string | undefined): Date | null {
  if (!dateStr) return null
  // Take text before any parenthetical "(P-Bandai)", before comma, etc.
  const cleaned = dateStr.replace(/\(.*?\)/g, '').split(',')[0].trim()
  const parsed = new Date(cleaned)
  return isNaN(parsed.getTime()) ? null : parsed
}

function parseMsrp(priceStr: string | undefined): number | null {
  if (!priceStr) return null
  const match = priceStr.match(/\$?([\d.]+)/)
  return match ? parseFloat(match[1]) : null
}

function slugFromUrl(url: string): string {
  const pathname = new URL(url).pathname
  const last = pathname.split('/').filter(Boolean).pop() ?? ''
  // Strip trailing spaces/dashes, remove shfiguarts- prefix
  return last.replace(/^shfiguarts-/, '').replace(/-+$/, '').trim() || last
}

function isExclusive(releaseType: string | undefined): boolean {
  if (!releaseType) return false
  const lower = releaseType.toLowerCase()
  return (
    lower.includes('p-bandai') ||
    lower.includes('premium bandai') ||
    lower.includes('exclusive') ||
    lower.includes('tamashii') ||
    lower.includes('sdcc')
  )
}

async function main() {
  const jsonPath = path.join(__dirname, '../scraper/go_figure.json')
  const raw: GoFigureEntry[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))

  // Only real figure entries: must have an image and a price
  const entries = raw.filter(
    (e) => e.image_url?.trim() && e.details?.Price
  )

  console.log(`Importing ${entries.length} figures from go_figure.json...\n`)

  let created = 0
  let updated = 0
  let skipped = 0

  for (const entry of entries) {
    const slug = slugFromUrl(entry.url)
    if (!slug) { skipped++; continue }

    const name = entry.name.trim()
    const data = {
      name,
      character: extractCharacter(name),
      series: extractSeries(name),
      releaseDate: parseReleaseDate(entry.details['Release Date']),
      msrp: parseMsrp(entry.details['Price']),
      isWebExclusive: isExclusive(entry.details['Type of Release']),
      isRerelease: false,
      accessories: (entry.contents ?? []).filter(Boolean),
      images: entry.image_url ? [entry.image_url] : [],
    }

    await prisma.figure.upsert({
      where: { slug },
      update: data,
      create: { slug, ...data },
    })

    console.log(`  ✓ ${name}`)
    created++
  }

  console.log(`\nDone. Upserted ${created} figures. Skipped: ${skipped}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
