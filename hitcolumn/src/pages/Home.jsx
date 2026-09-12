import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { trackPlay, trackDownload } from '../utils/counters'
import TrackCard from '../components/TrackCard'

export default function Home() {
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function fetchLatestSongs() {
      const { data } = await supabase
        .from('songs')
        .select('*, artists:artist_id (artist_name)')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(8)

      if (data) setSongs(data)
      setLoading(false)
    }

    async function fetchUser() {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
    }

    fetchLatestSongs()
    fetchUser()
  }, [])

  function handlePlay(song) {
    trackPlay(song, (next) => {
      setSongs((prev) =>
        prev.map((s) => (s.id === song.id ? { ...s, play_count: next } : s))
      )
    })
  }

  function handleDownload(song) {
    trackDownload(song, (next) => {
      setSongs((prev) =>
        prev.map((s) =>
          s.id === song.id ? { ...s, download_count: next } : s
        )
      )
    })
  }

  const songUrl = (song) => `/song/${song.slug || song.id}`
  const getArtistName = (row) =>
    row?.artist_name || row?.artists?.artist_name || 'Unknown Artist'

  const q = search.toLowerCase().trim()
  const filteredSongs = q
    ? songs.filter(
        (s) =>
          s.title?.toLowerCase().includes(q) ||
          s.genre?.toLowerCase().includes(q) ||
          getArtistName(s).toLowerCase().includes(q)
      )
    : songs

  if (loading) {
    return (
      <div className="hc-loading-screen">
        <div className="hc-loader"></div>
        <p className="hc-muted">Loading HitColumn...</p>
      </div>
    )
  }

  const uploadLink = user ? '/upload' : '/login'

  return (
    <div className="hc-container">
      <section className="hc-hero" style={{ marginTop: '2rem' }}>
        <div className="hc-hero-content">
          <span className="hc-eyebrow">Where hits are uploaded</span>
          <h1 className="hc-display">HitColumn</h1>
          <p className="hc-muted" style={{ maxWidth: '520px', fontSize: '1.1rem' }}>
            The platform for artists to share their sound with the world.
          </p>

          <div className="hc-hero-search">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search songs, artists, or genres..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="hc-search-clear"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>

          <div className="hc-hero-actions">
            <Link to={uploadLink} className="hc-btn hc-btn-primary">
              <i className="fas fa-upload"></i> Upload Your First 3 Songs Free
            </Link>
            <Link to="/songs" className="hc-btn hc-btn-secondary">
              <i className="fas fa-compact-disc"></i> Browse All Songs
            </Link>
          </div>
        </div>
      </section>

      <section className="hc-section">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <h2 className="hc-section-title" style={{ margin: 0 }}>
            {search ? 'Search results' : 'Latest Uploads'}
          </h2>
          {!search && (
            <Link to="/songs" className="hc-btn hc-btn-ghost">
              View All <i className="fas fa-arrow-right"></i>
            </Link>
          )}
        </div>

        {search && (
          <p
            className="hc-small hc-muted"
            style={{ marginTop: '-0.5rem', marginBottom: '1rem' }}
          >
            {filteredSongs.length}{' '}
            {filteredSongs.length === 1 ? 'result' : 'results'} for "{search}"
          </p>
        )}

        {filteredSongs.length === 0 ? (
          <div className="hc-card hc-card-pad" style={{ textAlign: 'center' }}>
            {search ? (
              <>
                <i
                  className="fas fa-search"
                  style={{
                    fontSize: '2rem',
                    color: 'var(--hc-text-subtle)',
                    marginBottom: '1rem'
                  }}
                ></i>
                <p className="hc-muted">
                  No songs match "{search}".{' '}
                  <Link to="/songs" style={{ color: 'var(--hc-brand)' }}>
                    Browse all songs
                  </Link>
                </p>
              </>
            ) : (
              <p className="hc-muted">No songs yet. Be the first to upload.</p>
            )}
          </div>
        ) : (
          <div className="hc-track-grid">
            {filteredSongs.map((song) => (
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

      <section className="hc-section" style={{ paddingTop: '0' }}>
        <div
          className="hc-card hc-card-pad"
          style={{
            background: 'linear-gradient(135deg, var(--hc-brand-soft), transparent)',
            borderColor: 'var(--hc-brand)',
            textAlign: 'center'
          }}
        >
          <span className="hc-eyebrow">Why HitColumn</span>
          <h2 className="hc-section-title" style={{ marginTop: '0.5rem' }}>
            Built for both Upcoming Artists & Established Musicians, Loved by Fans
          </h2>
          <p className="hc-muted" style={{ maxWidth: '600px', margin: '0 auto 1.5rem' }}>
            Upload your first 3 songs for free. Get discovered by fans across
            Malawi and beyond. No complicated setup — just your music, your way.
          </p>
          <div
            style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}
          >
            <Link to="/login" className="hc-btn hc-btn-primary">
              <i className="fas fa-user-plus"></i> Create Artist Account
            </Link>
            <Link to="/songs" className="hc-btn hc-btn-secondary">
              <i className="fas fa-headphones"></i> Explore Music
            </Link>
          </div>
        </div>
      </section>

      <footer className="hc-footer">
        <div className="hc-footer-content">
          <h3 className="hc-section-title" style={{ fontSize: '1.3rem' }}>
            Contact HitColumn
          </h3>
          <p className="hc-muted">
            For business inquiries, support, or partnerships.
          </p>
          <div className="hc-footer-links">
            <a href="mailto:peazydesun@gmail.com" className="hc-btn hc-btn-secondary">
              <i className="fas fa-envelope"></i> peazydesun@gmail.com
            </a>
            <a href="tel:+265992404606" className="hc-btn hc-btn-secondary">
              <i className="fas fa-phone"></i> +265 992 404 606
            </a>
            <a
              href="https://wa.me/265992404606"
              target="_blank"
              rel="noopener noreferrer"
              className="hc-btn hc-btn-secondary"
            >
              <i className="fab fa-whatsapp"></i> WhatsApp
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}