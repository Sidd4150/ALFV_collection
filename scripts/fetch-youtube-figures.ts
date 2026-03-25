import 'dotenv/config'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'
dotenv.config({ path: path.join(__dirname, '../.env.local'), override: true })

const API_KEY = process.env.YOUTUBE_API_KEY!
const CHANNEL_HANDLE = 'BigDeanoReviews'
const CHANNEL_ID = 'UCDG1fCyIUo9wX5_TpAj0ksg'

const DB_KEYWORDS = [
  'dragon ball', 'dragonball', 'dbz', 'dbs', 'dbgt', 'daima',
  'goku', 'vegeta', 'gohan', 'frieza', 'freeza', 'piccolo', 'broly',
  'cell', 'beerus', 'trunks', 'android', 'krillin', 'bardock',
  'gogeta', 'vegito', 'jiren', 'zamasu', 'hit ', 'nappa', 'raditz',
  'cooler', 'turles', 'yamcha', 'bulma', 'whis', 'gotenks',
]

function isDragonBall(title: string): boolean {
  const lower = title.toLowerCase()
  return DB_KEYWORDS.some((kw) => lower.includes(kw))
}

async function getChannelId(): Promise<string> {
  return CHANNEL_ID
}

async function getUploadPlaylistId(channelId: string): Promise<string> {
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${API_KEY}`
  )
  const data = await res.json()
  return data.items[0].contentDetails.relatedPlaylists.uploads
}

async function fetchAllTitles(playlistId: string): Promise<{ title: string; url: string }[]> {
  const results: { title: string; url: string }[] = []
  let pageToken = ''

  do {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50&key=${API_KEY}${pageToken ? `&pageToken=${pageToken}` : ''}`
    const res = await fetch(url)
    const data = await res.json()

    for (const item of data.items ?? []) {
      const title = item.snippet?.title ?? ''
      const videoId = item.snippet?.resourceId?.videoId
      results.push({
        title,
        url: `https://www.youtube.com/watch?v=${videoId}`,
      })
    }

    pageToken = data.nextPageToken ?? ''
  } while (pageToken)

  return results
}

async function main() {
  if (!API_KEY || API_KEY === 'your_youtube_api_key') {
    console.error('YOUTUBE_API_KEY not set in .env.local')
    process.exit(1)
  }

  console.log(`Fetching videos from @${CHANNEL_HANDLE}...`)

  const channelId = await getChannelId()
  const playlistId = await getUploadPlaylistId(channelId)
  const allVideos = await fetchAllTitles(playlistId)

  console.log(`Total videos: ${allVideos.length}`)

  const dbFigures = allVideos.filter((v) => isDragonBall(v.title))

  console.log(`Dragon Ball related: ${dbFigures.length}\n`)
  dbFigures.forEach((v) => console.log(`  • ${v.title}`))

  // Save to JSON for review
  const outPath = path.join(__dirname, '../scraper/youtube-db-figures.json')
  fs.writeFileSync(outPath, JSON.stringify(dbFigures, null, 2))
  console.log(`\nSaved to scraper/youtube-db-figures.json`)
}

main().catch(console.error)
