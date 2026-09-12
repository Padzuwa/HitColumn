import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Songs() {
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [genre, setGenre] = useState('All')

  useEffect(() => {
    fetchSongs()
  }, [])

  async function fetchSongs() {
    const { data } = await supabase
      .from('songs')
      .select(`
        *,
        artists:artist_id (artist_name)
      `)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })

    if (data) setSongs(data)
    setLoading(false)
  }

  async function handlePlay(song, event) {
    const audio = event.target
    if (audio.currentTime > 1) return

    const { error } = await supabase
      .from('songs')
      .update({ play_count: (song.play_count || 0) + 1 })
      .eq('id', song.id)

    if (!error) {
      setSongs(prev =>
        prev.map(s => s.id === song.id ? { ...s, play_count: (s.play_count || 0) + 1 } : s)
      )
    }
  }

  async function handleDownload(song) {
    const { error } = await supabase
      .from('songs')
      .update({ download_count: (song.download_count || 0) + 1 })
      .eq('id', song.id)

    if (!error) {
      setSongs(prev =>
        prev.map(s => s.id === song.id ? { ...s, download_count: (s.download_count || 0) + 1 } : s)
      )
    }
  }

  // Build genre list from songs
  const genres = ['All', ...Array.from(new Set(songs.map(s => s.genre).filter(Boolean)))]

  // Filter songs by search + genre
  const filteredSongs = songs.filter((song) => {
    const q = search.toLowerCase().trim()
    const matchesSearch =
      !q ||
      song.title?.toLowerCase().includes(q) ||
      song.genre?.toLowerCase().includes(q) ||
      song.artists?.artist_name?.toLowerCase().includes(q)

    const matchesGenre = genre === 'All' || song.genre === genre
    return matchesSearch && matchesGenre
  })

  if (loading) {
    return (
      <div className="hc-loading-screen">
        <div className="hc-loader"></div>
        <p className="hc-muted">Loading songs...</p>
      </div>
    )
  }
  const songUrl = (song) => `/song/${song.slug || song.id}`

  return (
    <div className="hc-container">
      <section className="hc-section">
        <span className="hc-eyebrow">Browse</span>
        <h1 className="hc-display" style={{ marginTop: '0.5rem' }}>All Songs</h1>
        <p className="hc-muted">Search and explore tracks from HitColumn artists.</p>

        {/* Search bar */}
        <div className="hc-search-bar">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search by title, artist, or genre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="hc-search-clear" onClick={() => setSearch('')} aria-label="Clear">
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>

        {/* Genre chips */}
        {genres.length > 1 && (
          <div className="hc-chips">
            {genres.map((g) => (
              <button
                key={g}
                className={`hc-chip ${genre === g ? 'is-active' : ''}`}
                onClick={() => setGenre(g)}
              >
                {g}
              </button>
            ))}
          </div>
        )}

        {/* Results count */}
        <p className="hc-small hc-muted" style={{ marginTop: '1rem' }}>
          {filteredSongs.length} {filteredSongs.length === 1 ? 'song' : 'songs'}
          {search && ` for "${search}"`}
          {genre !== 'All' && ` in ${genre}`}
        </p>

        {/* Results */}
{filteredSongs.length === 0 ? (
  <div
    className="hc-card hc-card-pad"
    style={{ textAlign: 'center', marginTop: '1.5rem' }}
  >
    <i
      className="fas fa-search"
      style={{ fontSize: '2rem', color: 'var(--hc-text-subtle)', marginBottom: '1rem' }}
    ></i>
    <p className="hc-muted">No songs found. Try another search.</p>
  </div>
) : (
  <div className="hc-track-grid" style={{ marginTop: '1.5rem' }}>
    {filteredSongs.map((song) => (
      <div key={song.id} className="hc-track-card">
        <Link to={songUrl(song)} className="hc-track-art">
          {song.cover_url ? (
            <img src={song.cover_url} alt={song.title} />
          ) : (
            <i
              className="fas fa-music"
              style={{ fontSize: '2.5rem', color: 'var(--hc-text-subtle)' }}
            ></i>
          )}
        </Link>

        <div className="hc-track-info">
          <Link to={songUrl(song)} className="hc-track-title-link">
            <p className="hc-track-title">{song.title}</p>
          </Link>

          <p className="hc-track-meta">
            {song.artists?.artist_name || 'Unknown Artist'} • {song.genre}
          </p>

          <div
            className="hc-track-stats"
            style={{ display: 'flex', gap: '14px', marginTop: '4px' }}
          >
            <span className="hc-muted" style={{ fontSize: '0.75rem' }}>
              <i className="fas fa-play"></i> {song.play_count || 0}
            </span>
            <span className="hc-muted" style={{ fontSize: '0.75rem' }}>
              <i className="fas fa-download"></i> {song.download_count || 0}
            </span>
          </div>

          <div className="hc-track-actions" style={{ marginTop: '10px' }}>
            <audio
              controls
              onPlay={(e) => handlePlay(song, e)}
              style={{ width: '100%', height: '36px' }}
            >
              <source src={song.audio_url} type="audio/mpeg" />
            </audio>

            <a
              href={song.audio_url}
              download
              className="hc-btn hc-btn-secondary"
              style={{ width: '100%', marginTop: '8px', textAlign: 'center' }}
              onClick={() => handleDownload(song)}
            >
              <i className="fas fa-download"></i> Download
            </a>
          </div>
        </div>
      </div>
    ))}
  </div>
)}
      </section>
      

      <footer className="hc-footer">
        <div className="hc-footer-content">
          <h3 className="hc-section-title" style={{ fontSize: '1.3rem' }}>Contact HitColumn</h3>
          <p className="hc-muted">For business inquiries, support, or partnerships.</p>
          <div className="hc-footer-links">
            <a href="mailto:peazydesun@gmail.com" className="hc-btn hc-btn-secondary">
              <i className="fas fa-envelope"></i> peazydesun@gmail.com
            </a>
            <a href="tel:+265992404606" className="hc-btn hc-btn-secondary">
              <i className="fas fa-phone"></i> +265 992 404 606
            </a>
            <a href="https://wa.me/265992404606" target="_blank" rel="noopener noreferrer" className="hc-btn hc-btn-secondary">
              <i className="fab fa-whatsapp"></i> WhatsApp
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}