import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function SongDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [song, setSong] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function load() {
      let data = null
      let error = null

      // 1. Try slug first
      const slugQuery = await supabase
        .from('songs')
        .select('*, artists:artist_id (artist_name, bio)')
        .eq('slug', id)
        .eq('status', 'approved')
        .maybeSingle()

      if (slugQuery.data) {
        data = slugQuery.data
      } else {
        // 2. Fall back to UUID
        const idQuery = await supabase
          .from('songs')
          .select('*, artists:artist_id (artist_name, bio)')
          .eq('id', id)
          .eq('status', 'approved')
          .maybeSingle()

        data = idQuery.data
        error = idQuery.error
      }

      if (error || !data) {
        setErrorMsg('Song not found.')
        setLoading(false)
        return
      }

      setSong(data)
      updatePageMeta(data)

      // 3. Fetch related songs from the same genre
      if (data.genre) {
        const { data: rel } = await supabase
          .from('songs')
          .select('*, artists:artist_id (artist_name)')
          .eq('status', 'approved')
          .eq('genre', data.genre)
          .neq('id', data.id)
          .order('created_at', { ascending: false })
          .limit(4)

        setRelated(rel || [])
      }

      setLoading(false)
    }

    load()
  }, [id])

  function updatePageMeta(data) {
    document.title = `${data.title} – ${data.artists?.artist_name || 'Artist'} | HitColumn`

    setMeta(
      'description',
      `Listen to ${data.title} by ${data.artists?.artist_name || 'Artist'} on HitColumn. Free streaming and download.`
    )
    setMeta('og:title', `${data.title} – ${data.artists?.artist_name || 'Artist'}`, true)
    setMeta('og:description', `Stream and download ${data.title} free on HitColumn.`, true)
    setMeta('og:image', data.cover_url || '', true)
    setMeta('og:type', 'music.song', true)
    setMeta('og:audio', data.audio_url, true)

    // JSON-LD for Google
    const existing = document.getElementById('song-jsonld')
    if (existing) existing.remove()

    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.id = 'song-jsonld'
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'MusicRecording',
      name: data.title,
      byArtist: {
        '@type': 'MusicGroup',
        name: data.artists?.artist_name || 'Artist'
      },
      genre: data.genre,
      image: data.cover_url,
      audio: {
        '@type': 'AudioObject',
        url: data.audio_url
      },
      url: window.location.href
    })
    document.head.appendChild(script)
  }

  function setMeta(name, content, isProperty = false) {
    const attr = isProperty ? 'property' : 'name'
    let tag = document.querySelector(`meta[${attr}="${name}"]`)
    if (!tag) {
      tag = document.createElement('meta')
      tag.setAttribute(attr, name)
      document.head.appendChild(tag)
    }
    tag.setAttribute('content', content)
  }

  async function handlePlay(e) {
    const audio = e.target
    if (audio.currentTime > 1) return

    const { error } = await supabase
      .from('songs')
      .update({ play_count: (song.play_count || 0) + 1 })
      .eq('id', song.id)

    if (!error) {
      setSong((s) => ({ ...s, play_count: (s.play_count || 0) + 1 }))
    }
  }

  async function handleDownload() {
    const { error } = await supabase
      .from('songs')
      .update({ download_count: (song.download_count || 0) + 1 })
      .eq('id', song.id)

    if (!error) {
      setSong((s) => ({ ...s, download_count: (s.download_count || 0) + 1 }))
    }
  }

  function share(platform) {
    const url = encodeURIComponent(window.location.href)
    const text = encodeURIComponent(
      `Listen to ${song.title} by ${song.artists?.artist_name || 'Artist'} on HitColumn`
    )

    if (platform === 'copy') {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      return
    }

    const map = {
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      x: `https://twitter.com/intent/tweet?text=${text}&url=${url}`
    }

    window.open(map[platform], '_blank')
  }

  if (loading) {
    return (
      <div className="hc-loading-screen">
        <div className="hc-loader"></div>
        <p className="hc-muted">Loading song...</p>
      </div>
    )
  }

  if (errorMsg || !song) {
    return (
      <div className="hc-container">
        <section className="hc-section" style={{ textAlign: 'center' }}>
          <i
            className="fas fa-music"
            style={{ fontSize: '3rem', color: 'var(--hc-text-subtle)' }}
          ></i>
          <h1 className="hc-section-title" style={{ marginTop: '1rem' }}>
            Song not found
          </h1>
          <p className="hc-muted">
            The track you're looking for might have been removed.
          </p>
          <button
            className="hc-btn hc-btn-primary"
            style={{ marginTop: '1.5rem' }}
            onClick={() => navigate('/songs')}
          >
            <i className="fas fa-arrow-left"></i> Back to Songs
          </button>
        </section>
      </div>
    )
  }

  return (
    <div className="hc-container">
      <section className="hc-section">
        <button className="hc-back-btn" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left"></i> Back
        </button>

        {/* Song hero */}
        <div className="hc-song-hero">
          <div className="hc-song-art">
            {song.cover_url ? (
              <img src={song.cover_url} alt={song.title} />
            ) : (
              <i className="fas fa-music"></i>
            )}
          </div>

          <div className="hc-song-meta">
            <span className="hc-tag">{song.genre || 'Music'}</span>

            <h1 className="hc-song-title">{song.title}</h1>

            <p className="hc-song-artist">
              by <strong>{song.artists?.artist_name || 'Unknown Artist'}</strong>
            </p>

            <div className="hc-song-stats">
              <div className="hc-stat-pill">
                <i className="fas fa-play"></i> {song.play_count || 0} plays
              </div>
              <div className="hc-stat-pill">
                <i className="fas fa-download"></i> {song.download_count || 0} downloads
              </div>
            </div>

            <audio controls onPlay={handlePlay} className="hc-song-player">
              <source src={song.audio_url} type="audio/mpeg" />
            </audio>

            <div className="hc-song-actions">
              <a
                href={song.audio_url}
                download
                onClick={handleDownload}
                className="hc-btn hc-btn-primary"
              >
                <i className="fas fa-download"></i> Download
              </a>

              <button
                className="hc-btn hc-btn-secondary"
                onClick={() => share('whatsapp')}
              >
                <i className="fab fa-whatsapp"></i> WhatsApp
              </button>

              <button
                className="hc-btn hc-btn-secondary"
                onClick={() => share('facebook')}
              >
                <i className="fab fa-facebook"></i> Facebook
              </button>

              <button
                className="hc-btn hc-btn-secondary"
                onClick={() => share('x')}
              >
                <i className="fab fa-x-twitter"></i> X
              </button>

              <button
                className="hc-btn hc-btn-ghost"
                onClick={() => share('copy')}
              >
                <i className={`fas ${copied ? 'fa-check' : 'fa-link'}`}></i>{' '}
                {copied ? 'Copied!' : 'Copy link'}
              </button>
            </div>
          </div>
        </div>

        {/* Related songs */}
        {related.length > 0 && (
          <div style={{ marginTop: '3rem' }}>
            <h2
              className="hc-section-title"
              style={{ marginBottom: '1.5rem' }}
            >
              More {song.genre} songs
            </h2>

            <div className="hc-track-grid">
              {related.map((r) => (
                <Link
                  key={r.id}
                  to={`/song/${r.slug || r.id}`}
                  className="hc-track-card"
                >
                  <div className="hc-track-art">
                    {r.cover_url ? (
                      <img src={r.cover_url} alt={r.title} />
                    ) : (
                      <i
                        className="fas fa-music"
                        style={{
                          fontSize: '2.5rem',
                          color: 'var(--hc-text-subtle)'
                        }}
                      ></i>
                    )}
                  </div>

                  <div className="hc-track-info">
                    <p className="hc-track-title">{r.title}</p>
                    <p className="hc-track-meta">
                      {r.artists?.artist_name || 'Unknown Artist'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}