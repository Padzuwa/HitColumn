import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import TrackCard from '../components/TrackCard'
import { trackPlay, trackDownload } from '../utils/counters'

// Canonical helper
function setCanonical(href) {
  let tag = document.querySelector('link[rel="canonical"]')
  if (!tag) {
    tag = document.createElement('link')
    tag.setAttribute('rel', 'canonical')
    document.head.appendChild(tag)
  }
  tag.setAttribute('href', href)
}

export default function Artist() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [artist, setArtist] = useState(null)
  const [songs, setSongs] = useState([])
  const [stats, setStats] = useState({ plays: 0, downloads: 0 })
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)

      // 1. Load artist
      const { data: artistData, error: artistError } = await supabase
        .from('artists')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (artistError || !artistData) {
        setErrorMsg('Artist not found.')
        setLoading(false)
        return
      }

      setArtist(artistData)

      // 2. Load their approved songs
      const { data: songsData } = await supabase
        .from('songs')
        .select('*')
        .eq('artist_id', id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })

      const list = songsData || []
      setSongs(list)

      // 3. Aggregate stats
      const plays = list.reduce((sum, s) => sum + (s.play_count || 0), 0)
      const downloads = list.reduce((sum, s) => sum + (s.download_count || 0), 0)
      setStats({ plays, downloads })

      updatePageMeta(artistData, list)
      setLoading(false)
    }

    load()
  }, [id])

  function updatePageMeta(data, songsList) {
    const url = `https://hitcolumn.vercel.app/artist/${data.id}`
    const name = data.artist_name || 'Artist'
    const songCount = songsList.length

    document.title = `${name} – ${songCount} song${songCount === 1 ? '' : 's'} | HitColumn`
    setCanonical(url)

    setMeta('description', `Listen to ${songCount} free song${songCount === 1 ? '' : 's'} by ${name} on HitColumn. Stream and download now.`)

    setMeta('og:title', `${name} | HitColumn`, true)
    setMeta('og:description', `Explore the full catalog of ${name} on HitColumn.`, true)
    setMeta('og:type', 'profile', true)
    setMeta('og:url', url, true)
    if (songsList[0]?.cover_url) {
      setMeta('og:image', songsList[0].cover_url, true)
    }

    // JSON-LD MusicGroup schema
    const existing = document.getElementById('artist-jsonld')
    if (existing) existing.remove()

    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.id = 'artist-jsonld'
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'MusicGroup',
      name,
      url,
      description: data.bio || `${name} on HitColumn`,
      image: songsList[0]?.cover_url,
      track: songsList.slice(0, 10).map((s) => ({
        '@type': 'MusicRecording',
        name: s.title,
        url: `https://hitcolumn.vercel.app/song/${s.slug || s.id}`
      }))
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

  function handlePlay(song) {
    trackPlay(song, (next) => {
      setSongs((prev) =>
        prev.map((s) => (s.id === song.id ? { ...s, play_count: next } : s))
      )
      setStats((st) => ({ ...st, plays: st.plays + 1 }))
    })
  }

  function handleDownload(song) {
    trackDownload(song, (next) => {
      setSongs((prev) =>
        prev.map((s) =>
          s.id === song.id ? { ...s, download_count: next } : s
        )
      )
      setStats((st) => ({ ...st, downloads: st.downloads + 1 }))
    })
  }

  function shareProfile(platform) {
    const url = encodeURIComponent(window.location.href)
    const name = artist?.artist_name || 'Artist'
    const text = encodeURIComponent(`Check out ${name} on HitColumn`)

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

  const songUrl = (song) => `/song/${song.slug || song.id}`
  const getArtistName = () => artist?.artist_name || 'Unknown Artist'

  if (loading) {
    return (
      <div className="hc-loading-screen">
        <div className="hc-loader"></div>
        <p className="hc-muted">Loading artist...</p>
      </div>
    )
  }

  if (errorMsg || !artist) {
    return (
      <div className="hc-container">
        <section className="hc-section" style={{ textAlign: 'center' }}>
          <i
            className="fas fa-user-slash"
            style={{ fontSize: '3rem', color: 'var(--hc-text-subtle)' }}
          ></i>
          <h1 className="hc-section-title" style={{ marginTop: '1rem' }}>
            Artist not found
          </h1>
          <p className="hc-muted">This profile may have been removed.</p>
          <button
            className="hc-btn hc-btn-primary"
            style={{ marginTop: '1.5rem' }}
            onClick={() => navigate('/songs')}
          >
            <i className="fas fa-arrow-left"></i> Browse songs
          </button>
        </section>
      </div>
    )
  }

  const initial = artist.artist_name?.charAt(0).toUpperCase() || 'A'
  const joinDate = artist.created_at
    ? new Date(artist.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      })
    : null

  return (
    <div className="hc-container">
      {/* Hero banner */}
      <section
        className="hc-artist-hero"
        style={
          songs[0]?.cover_url
            ? {
                backgroundImage: `linear-gradient(180deg, rgba(7,11,18,0.55), rgba(7,11,18,0.95)), url(${songs[0].cover_url})`
              }
            : undefined
        }
      >
        <button className="hc-back-btn" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left"></i> Back
        </button>

        <div className="hc-artist-hero-inner">
          <div className="hc-artist-avatar">{initial}</div>

          <div className="hc-artist-hero-info">
            <span className="hc-eyebrow">Artist Profile</span>
            <h1 className="hc-artist-name">{artist.artist_name}</h1>

            {artist.bio && (
              <p className="hc-artist-bio">{artist.bio}</p>
            )}

            <div className="hc-artist-meta">
              {joinDate && (
                <span className="hc-stat-pill">
                  <i className="fas fa-calendar"></i> Joined {joinDate}
                </span>
              )}
              <span className="hc-stat-pill">
                <i className="fas fa-music"></i> {songs.length} song
                {songs.length === 1 ? '' : 's'}
              </span>
              <span className="hc-stat-pill">
                <i className="fas fa-play"></i>{' '}
                {stats.plays.toLocaleString()} plays
              </span>
              <span className="hc-stat-pill">
                <i className="fas fa-download"></i>{' '}
                {stats.downloads.toLocaleString()} downloads
              </span>
            </div>

            <div className="hc-artist-actions">
              <button
                className="hc-btn hc-btn-secondary"
                onClick={() => shareProfile('whatsapp')}
              >
                <i className="fab fa-whatsapp"></i> WhatsApp
              </button>
              <button
                className="hc-btn hc-btn-secondary"
                onClick={() => shareProfile('facebook')}
              >
                <i className="fab fa-facebook"></i> Facebook
              </button>
              <button
                className="hc-btn hc-btn-secondary"
                onClick={() => shareProfile('x')}
              >
                <i className="fab fa-x-twitter"></i> X
              </button>
              <button
                className="hc-btn hc-btn-ghost"
                onClick={() => shareProfile('copy')}
              >
                <i className={`fas ${copied ? 'fa-check' : 'fa-link'}`}></i>{' '}
                {copied ? 'Copied!' : 'Copy link'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Songs */}
      <section className="hc-section">
        <div className="hc-section-header" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
          <h2 className="hc-section-title" style={{ margin: 0 }}>
            Songs by {artist.artist_name}
          </h2>
          <p className="hc-muted" style={{ marginTop: '4px' }}>
            {songs.length} track{songs.length === 1 ? '' : 's'} available
          </p>
        </div>

        {songs.length === 0 ? (
          <div className="hc-card hc-card-pad" style={{ textAlign: 'center' }}>
            <i
              className="fas fa-music"
              style={{ fontSize: '2rem', color: 'var(--hc-text-subtle)', marginBottom: '1rem' }}
            ></i>
            <p className="hc-muted">No songs published yet.</p>
          </div>
        ) : (
          <div className="hc-track-grid">
            {songs.map((song) => (
              <TrackCard
                key={song.id}
                song={song}
                songUrl={songUrl}
                getArtistName={getArtistName}
                onPlay={handlePlay}
                onDownload={handleDownload}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}