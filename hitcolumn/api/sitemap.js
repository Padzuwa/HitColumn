// /api/sitemap.js
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  )

  const { data: songs } = await supabase
    .from('songs')
    .select('slug, id, created_at')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  const base = 'https://hitcolumn.vercel.app'
  const staticPages = ['', 'songs', 'search', 'about', 'support', 'subscription']

  const urls = [
    ...staticPages.map(
      (p) => `
  <url>
    <loc>${base}/${p}</loc>
    <changefreq>weekly</changefreq>
    <priority>${p === '' ? '1.0' : '0.8'}</priority>
  </url>`
    ),
    ...(songs || []).map(
      (s) => `
  <url>
    <loc>${base}/song/${s.slug || s.id}</loc>
    <lastmod>${s.created_at}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>`
    )
  ].join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`

  res.setHeader('Content-Type', 'application/xml')
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600')
  res.send(xml)
}