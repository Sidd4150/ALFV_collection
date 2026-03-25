import * as fs from 'fs'
import * as path from 'path'

const THIRD_PARTY_BRANDS = [
  'Neokong', 'Mythos Anime', 'Demoniacal Fit', 'Beast Deities', 'ZT Toys',
  'Black Hole Toys', 'WP Model', 'KW Studio', 'LS Studio', 'GM Studio',
  'AIR Studio', 'AIR/', 'HMYR', 'TK Custom', 'DKO', 'E&C', 'N&T', 'N&C',
  'Kamione', 'OC Toys', 'Recustom', 'Block K Studio', 'YGMW', 'Voltorb Studio',
  'Nonou Custom', 'PT Custom', 'Jesse', 'ZD Studio', 'Magic Model', 'DL Custom',
  'Hoom', 'Steamed Crab', 'Wow Superaction Studio', 'WOW Superaction Studio',
  'DCG Toys', 'Vitoforge', 'Lion Heart Studio', 'SH Figuposes',
]

const STOP_WORDS = [
  ' - Comparisons', ' - Head', ' - Review', ' Comparisons', ' Review',
  ' Headswaps', ' - TK ', ' - Beast', ' - NYCC', ' - Dragonball',
  ' - Dragon Ball', ' - DBS', ' - DBZ', ' - Movie', ' - Yellow',
  ' - Second', ' - Silver', ' - Ver', ' - Version', ' - Update',
  ' Mod', ' Tutorial',
]

const SERIES_MAP: Record<string, string> = {
  'daima': 'Dragon Ball Daima',
  'dragon ball super': 'Dragon Ball Super',
  'dbs': 'Dragon Ball Super',
  'dragonball super': 'Dragon Ball Super',
  'dragon ball gt': 'Dragon Ball GT',
  'dbgt': 'Dragon Ball GT',
  'dragon ball heroes': 'Dragon Ball Super',
  'db heroes': 'Dragon Ball Super',
  'dragonball heroes': 'Dragon Ball Super',
  'dragon ball z': 'Dragon Ball Z',
  'dbz': 'Dragon Ball Z',
  'dragonballz': 'Dragon Ball Z',
  'broly movie': 'Dragon Ball Super',
  'fusion reborn': 'Dragon Ball Z',
  'namek': 'Dragon Ball Z',
  'moro': 'Dragon Ball Super',
}

const CHARACTERS = [
  'Ultra Instinct Goku', 'Super Saiyan Blue Gogeta', 'Super Saiyan Blue Vegito',
  'Super Saiyan Blue Kaioken Goku', 'Super Saiyan Blue Goku', 'Super Saiyan Blue Vegeta',
  'Super Saiyan 4 Gogeta', 'Super Saiyan 4 Vegito', 'Super Saiyan 4 Broly',
  'Super Saiyan 4 Goku', 'Super Saiyan 4 Vegeta',
  'Super Saiyan 3 Vegito', 'Super Saiyan 3 Bardock', 'Super Saiyan 3 Gotenks',
  'Super Saiyan 3 Goku', 'Super Saiyan 3 Broly',
  'Super Saiyan 2 Gohan', 'Super Saiyan 2 Goku', 'Super Saiyan 2 Vegeta',
  'Super Saiyan God Goku', 'Super Saiyan God Vegeta',
  'Limit Breaker SSJ4 Broly', 'Dark SSJ4 Broly', 'Legendary Super Saiyan Broly',
  'Legendary Super Saiyan Goku', 'LSSJ Broly', 'LSSJ Goku',
  'Kaioken Goku', 'Super Gogeta', 'Super Vegito',
  'Future Gohan', 'Future Trunks', 'Beast Gohan', 'Ultimate Gohan',
  'Majin Vegeta', 'Goku Black', 'Gotenks',
  'Android 13', 'Android 17', 'Android 18',
  'Recoome', 'Jeice', 'Broly', 'Bardock',
  'Piccolo', 'Beerus', 'Frieza', 'Cooler',
  'Goku', 'Vegeta', 'Gohan', 'Trunks', 'Vegito', 'Gogeta',
  'Moro',
]

function extractBrand(title: string): { brand: string; isThirdParty: boolean } {
  for (const brand of THIRD_PARTY_BRANDS) {
    if (title.toLowerCase().includes(brand.toLowerCase())) {
      return { brand, isThirdParty: true }
    }
  }
  // Check for generic "3rd Party" mention
  if (title.toLowerCase().includes('3rd party')) {
    return { brand: 'Unknown', isThirdParty: true }
  }
  // Bootlegs are still 3rd party
  if (title.toLowerCase().includes('bootleg')) {
    return { brand: 'Bootleg', isThirdParty: true }
  }
  return { brand: 'Bandai', isThirdParty: false }
}

// Words that indicate the extracted text is not a figure name
const JUNK_STARTS = [
  'and ', 'are ', 'is ', 'the ', 'with ', 'for ', 'by ', 'on ', 'has ',
  'was ', 'have ', 'but ', 'its ', "isn't", 'looks', 'promo', 'news',
  'release', 'reveal', 'shipping', 'coming', 'about', 'almost', 'update',
  'in hand', '3d ', '3d printed',
]

const JUNK_CONTAINS = [
  'how to', 'tutorial', 'extravaganza', 'roundup', 'showcase',
  'pearlescent', 'spray paint', 'leg swap', 'shoulder mod', 'ab crunch',
  'neck peg', 'aura effect', 'effect', 'dates', 'store news',
]

function extractFigureName(title: string): string | null {
  const match = title.match(/figuarts\s+(.+)/i)
  if (!match) return null

  let name = match[1]

  // Remove hashtags
  name = name.replace(/#\S+/g, '').trim()

  // Cut at stop words / separators
  for (const stop of STOP_WORDS) {
    const idx = name.toLowerCase().indexOf(stop.toLowerCase())
    if (idx > 0) name = name.substring(0, idx)
  }

  // Remove trailing punctuation/whitespace
  name = name.replace(/[!?.,-]+$/, '').trim()

  // Skip if too short or too long
  if (name.length < 4 || name.split(' ').length > 9) return null

  const lower = name.toLowerCase()

  // Skip junk starts
  if (JUNK_STARTS.some(j => lower.startsWith(j))) return null

  // Skip junk content
  if (JUNK_CONTAINS.some(j => lower.includes(j))) return null

  // Must start with uppercase (real figure names do)
  if (!/^[A-Z]/.test(name)) return null

  // Skip if it reads like a sentence (contains verb indicators mid-string)
  if (/\b(is|are|was|has|isn't|aren't)\b/.test(lower)) return null

  return name
}

function extractCharacter(figureName: string): string {
  const lower = figureName.toLowerCase()
  for (const char of CHARACTERS) {
    if (lower.includes(char.toLowerCase())) return char
  }
  const words = figureName.split(' ')
  return words.slice(0, Math.min(3, words.length)).join(' ')
}

function extractSeries(title: string): string {
  const lower = title.toLowerCase()
  for (const [keyword, series] of Object.entries(SERIES_MAP)) {
    if (lower.includes(keyword)) return series
  }
  return 'Dragon Ball Z'
}

type ParsedFigure = {
  name: string
  brand: string
  character: string
  series: string
  isThirdParty: boolean
  sourceUrl: string
  sourceTitle: string
}

async function main() {
  const inPath = path.join(__dirname, '../scraper/youtube-db-figures.json')
  const videos: { title: string; url: string }[] = JSON.parse(fs.readFileSync(inPath, 'utf-8'))

  const seen = new Set<string>()
  const figures: ParsedFigure[] = []

  for (const { title, url } of videos) {
    const figureName = extractFigureName(title)
    if (!figureName) continue

    // Deduplicate by normalised name
    const key = figureName.toLowerCase().replace(/\s+/g, ' ').trim()
    if (seen.has(key)) continue
    seen.add(key)

    const { brand, isThirdParty } = extractBrand(title)
    const character = extractCharacter(figureName)
    const series = extractSeries(title)

    figures.push({
      name: figureName,
      brand,
      character,
      series,
      isThirdParty,
      sourceUrl: url,
      sourceTitle: title,
    })
  }

  // Sort: 3rd party first, then alphabetically
  figures.sort((a, b) => {
    if (a.isThirdParty !== b.isThirdParty) return a.isThirdParty ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  const outPath = path.join(__dirname, '../scraper/parsed-figures.json')
  fs.writeFileSync(outPath, JSON.stringify(figures, null, 2))

  console.log(`Parsed ${figures.length} unique figures\n`)
  console.log(`3rd Party: ${figures.filter(f => f.isThirdParty).length}`)
  console.log(`Official:  ${figures.filter(f => !f.isThirdParty).length}`)
  console.log(`\nSaved to scraper/parsed-figures.json`)
  console.log('\nSample:')
  figures.slice(0, 10).forEach(f =>
    console.log(`  [${f.isThirdParty ? f.brand : 'Official'}] ${f.name}`)
  )
}

main().catch(console.error)
