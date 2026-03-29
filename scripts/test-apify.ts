import { ApifyClient } from 'apify-client'

const token = process.env.APIFY_TOKEN
if (!token) {
  console.error('Missing APIFY_TOKEN env variable')
  process.exit(1)
}

const client = new ApifyClient({ token })

async function main() {
  console.log('Running Apify eBay actor...')

  const run = await client.actor('oTtB3VgfuE9GtxQt2').call({
    keyword: 'lowest born saiyan',
    daysToScrape: 90,
    count: 5,
    categoryId: '0',
    ebaySite: 'ebay.com',
    sortOrder: 'endedRecently',
    itemCondition: 'any',
    currencyMode: 'USD',
    detailedSearch: false,
  })

  console.log(`Run finished. Dataset ID: ${run.defaultDatasetId}`)

  const { items } = await client.dataset(run.defaultDatasetId).listItems()

  console.log(`\nTotal results: ${items.length}\n`)

  if (items.length > 0) {
    console.log('Sample item keys:', Object.keys(items[0]))
    console.log('\n--- First 3 results ---')
    items.slice(0, 3).forEach((item, i) => {
      console.log(`\n[${i + 1}]`, JSON.stringify(item, null, 2))
    })
  }
}

main().catch(console.error)
