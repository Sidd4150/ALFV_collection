import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: path.join(__dirname, '../.env') })
dotenv.config({ path: path.join(__dirname, '../.env.local'), override: true })

const BUCKET = 'figure-images'
const IMAGES_DIR = path.join(__dirname, '../scraper/figure_images')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets()
  if (!buckets?.find(b => b.name === BUCKET)) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true })
    if (error) throw new Error(`Failed to create bucket: ${error.message}`)
    console.log(`Created bucket "${BUCKET}"`)
  }
}

async function main() {
  await ensureBucket()

  const files = fs.readdirSync(IMAGES_DIR).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
  console.log(`Uploading ${files.length} images...\n`)

  let uploaded = 0
  let skipped = 0

  for (const file of files) {
    const slug = path.basename(file, path.extname(file)).replace(/_/g, '-')
    const figure = await prisma.figure.findUnique({ where: { slug } })

    if (!figure) {
      console.log(`  ? No figure found for slug "${slug}" (${file})`)
      skipped++
      continue
    }

    const fileBuffer = fs.readFileSync(path.join(IMAGES_DIR, file))
    const storagePath = file

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      })

    if (error) {
      console.log(`  ✗ ${file}: ${error.message}`)
      skipped++
      continue
    }

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)

    await prisma.figure.update({
      where: { slug },
      data: { images: [publicUrl] },
    })

    console.log(`  ✓ ${figure.name}`)
    uploaded++
  }

  console.log(`\nDone. Uploaded: ${uploaded}, Skipped: ${skipped}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
