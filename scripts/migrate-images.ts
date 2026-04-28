import 'dotenv/config'
import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.join(__dirname, '../.env.local'), override: true })

import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma'
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const BUCKET = 'figure-images'
const THUMB_MAX_PX = 800
const THUMB_QUALITY = 75
const FULL_QUALITY = 90

async function downloadImage(url: string): Promise<Buffer> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

async function migrateImage(figureId: string, oldUrl: string): Promise<string> {
  const buffer = await downloadImage(oldUrl)

  const ts = Date.now()
  const thumbPath = `figures/${figureId}/${ts}_thumb.webp`
  const fullPath = `figures/${figureId}/${ts}_full.webp`

  const [thumbBuffer, fullBuffer] = await Promise.all([
    sharp(buffer)
      .resize(THUMB_MAX_PX, THUMB_MAX_PX, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: THUMB_QUALITY })
      .toBuffer(),
    sharp(buffer)
      .webp({ quality: FULL_QUALITY })
      .toBuffer(),
  ])

  const [thumbUpload, fullUpload] = await Promise.all([
    supabase.storage.from(BUCKET).upload(thumbPath, thumbBuffer, { contentType: 'image/webp', upsert: false }),
    supabase.storage.from(BUCKET).upload(fullPath, fullBuffer, { contentType: 'image/webp', upsert: false }),
  ])

  if (thumbUpload.error) throw thumbUpload.error
  if (fullUpload.error) throw fullUpload.error

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(thumbPath)
  return publicUrl
}

async function main() {
  const figures = await prisma.figure.findMany({
    select: { id: true, slug: true, images: true },
    where: { images: { isEmpty: false } },
  })

  const total = figures.reduce((sum, f) => sum + f.images.length, 0)
  console.log(`Found ${figures.length} figures with ${total} images total\n`)

  let done = 0
  let skipped = 0
  let failed = 0

  for (const figure of figures) {
    const newImages: string[] = []
    let changed = false

    for (const oldUrl of figure.images) {
      // Skip images already migrated
      if (oldUrl.includes('_thumb.webp')) {
        newImages.push(oldUrl)
        skipped++
        continue
      }

      try {
        const thumbUrl = await migrateImage(figure.id, oldUrl)
        newImages.push(thumbUrl)
        changed = true
        done++
        console.log(`[${done + skipped}/${total}] ✓ ${figure.slug} — ${path.basename(oldUrl)}`)
      } catch (err) {
        console.error(`[${done + skipped}/${total}] ✗ ${figure.slug} — ${oldUrl}\n  ${err}`)
        // Keep the old URL so the figure isn't broken
        newImages.push(oldUrl)
        failed++
      }

      // Small delay to avoid hammering Supabase
      await new Promise((r) => setTimeout(r, 100))
    }

    if (changed) {
      await prisma.figure.update({
        where: { id: figure.id },
        data: { images: newImages },
      })
    }
  }

  console.log(`\nDone. Migrated: ${done}, Already migrated: ${skipped}, Failed: ${failed}`)
  await pool.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
