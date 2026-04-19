import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs/promises'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
const bucket = 'tracks'

// set this true if the bucket is public
const IS_PUBLIC_BUCKET = true

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL in environment')
}

if (!supabaseKey) {
  throw new Error(
    'Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY in environment'
  )
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function listAllFiles(prefix = '') {
  let page = 0
  const limit = 100
  const out = []

  while (true) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(prefix, {
        limit,
        offset: page * limit,
        sortBy: { column: 'name', order: 'asc' },
      })

    if (error) throw error
    if (!data || data.length === 0) break

    for (const item of data) {
      const fullPath = prefix ? `${prefix}/${item.name}` : item.name

      const looksLikeFolder = !item.metadata && !item.id
      if (looksLikeFolder) {
        const nested = await listAllFiles(fullPath)
        out.push(...nested)
        continue
      }

      if (fullPath.toLowerCase().endsWith('.mp3')) {
        out.push({
          path: fullPath,
          name: item.name,
          size: item.metadata?.size ?? null,
        })
      }
    }

    if (data.length < limit) break
    page += 1
  }

  return out
}

async function buildUrls(paths) {
  if (IS_PUBLIC_BUCKET) {
    return paths.map((path) => {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path)
      return { path, url: data.publicUrl }
    })
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrls(paths, 60 * 60 * 24)

  if (error) throw error
  if (!data) return []

  return data.map((row) => ({
    path: row.path,
    url: row.signedUrl,
  }))
}

function toPixId(path) {
  return path.replace(/\.mp3$/i, '').replace(/[^\w/-]+/g, '_')
}

async function main() {
  const files = await listAllFiles('')
  const urls = await buildUrls(files.map((f) => f.path))

  const assets = urls.map((u) => {
    const pixId = toPixId(u.path)
    return {
      pix_id: pixId,
      stage: 'PIX_ORIGINAL',
      dup_lane: 'GPMC-1',
      derivative_id: `${pixId}-ORIG`,
      original_mp3_url: u.url,
      current_mp3_url: u.url,
      required_full_audio: true,
      lineage: {
        original_pix_id: pixId,
      },
    }
  })

  const manifest = { assets }

  await fs.writeFile(
    'audio-manifest.json',
    JSON.stringify(manifest, null, 2),
    'utf8'
  )

  console.log(`Wrote audio-manifest.json with ${manifest.assets.length} MP3 assets`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
