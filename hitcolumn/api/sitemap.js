import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  try {
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    )

    const { data: songs } = await supabase
      .from('songs')
      .select('slug, id, created_at, updated_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })

    const { data: artists } = await supabase
      .from('artists')
      .select('id, created_at')

    const base = 'https://hitcolumn.vercel.app'

    const staticPages = [
      { path: '', priority: '1.0', freq: 'daily' },
      { path: 'songs', priority: '0.9', freq: 'daily' },
      { path: 'search', priority: '0.7', freq: 'weekly' },
      { path: 'about', priority: '0.6', freq: 'monthly' },
      { path: 'support', priority: '0.6', freq: 'monthly' },
      { path: 'subscription', priority: '0.7', freq: 'monthly' }
    ]

    const urls = [
      ...staticPages.map(
        (p) => `
  <url>
    <loc>${base}/${p.path}</loc>
    <changefreq>${p.freq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
      ),
      ...(songs || []).map(
        (s) => `
  <url>
    <loc>${base}/song/${s.slug || s.id}</loc>
    <lastmod>${new Date(s.updated_at || s.created_at).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>`
      ),
      ...(artists || []).map(
        (a) => `
  <url>
    <loc>${base}/artist/${a.id}</loc>
    <lastmod>${new Date(a.created_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
      )
    ].join('')

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`

    res.setHeader('Content-Type', 'application/xml; charset=utf-8')
    res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=1800')
    res.status(200).send(xml)
  } catch (err) {
    console.error('Sitemap error:', err)
    res.status(500).send('Sitemap generation failed')
  }
}