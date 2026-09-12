import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { trackPlay, trackDownload } from '../utils/counters'
import TrackCard from '../components/TrackCard'

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
      .select('*, artists:artist_id (artist_name)')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })

    if (data) setSongs(data)
    setLoading(false)
  }

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

  const genres = ['All', ...Array.from(new Set(songs.map((s) => s.genre).filter(Boolean)))]

  const filteredSongs = songs.filter((song) => {
    const q = search.toLowerCase().trim()
    const matchesSearch =
      !q ||
      song.title?.toLowerCase().includes(q) ||
      song.genre?.toLowerCase().includes(q) ||
      getArtistName(song).toLowerCase().includes(q)

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

  return (
    <div className="hc-container">
      <section className="hc-section">
        <span className="hc-eyebrow">Browse</span>
        <h1 className="hc-display" style={{ marginTop: '0.5rem' }}>All Songs</h1>
        <p className="hc-muted">Search and explore tracks from HitColumn artists.</p>

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

        <p className="hc-small hc-muted" style={{ marginTop: '1rem' }}>
          {filteredSongs.length} {filteredSongs.length === 1 ? 'song' : 'songs'}
          {search && ` for "${search}"`}
          {genre !== 'All' && ` in ${genre}`}
        </p>

        {filteredSongs.length === 0 ? (
          <div className="hc-card hc-card-pad" style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <i className="fas fa-search" style={{ fontSize: '2rem', color: 'var(--hc-text-subtle)', marginBottom: '1rem' }}></i>
            <p className="hc-muted">No songs found. Try another search.</p>
          </div>
        ) : (
          <div className="hc-track-grid" style={{ marginTop: '1.5rem' }}>
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