import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { trackPlay, trackDownload } from '../utils/counters'
import TrackCard from '../components/TrackCard'
import { searchSongs } from '../utils/search'

const PAGE_SIZE = 5

export default function Songs() {
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [search, setSearch] = useState('')
  const [totalCount, setTotalCount] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')

  const getArtistName = (row) =>
    row?.artist_name || row?.artists?.artist_name || 'Unknown Artist'
  const songUrl = (song) => `/song/${song.slug || song.id}`

  // ---- Load one page ----
  const loadPage = useCallback(async (reset = false) => {
    const offset = reset ? 0 : songs.length

    if (reset) {
      setLoading(true)
      setErrorMsg('')
    } else {
      setLoadingMore(true)
    }

    const from = offset
    const to = offset + PAGE_SIZE - 1

    const { data, error, count } = await supabase
      .from('songs')
      .select('*, artists:artist_id (artist_name)', { count: 'estimated' })
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      setErrorMsg('Could not load songs. Please try again.')
      setLoading(false)
      setLoadingMore(false)
      return
    }

    const batch = data || []

    if (reset) {
      setSongs(batch)
    } else {
      setSongs((prev) => [...prev, ...batch])
    }

    setHasMore(batch.length === PAGE_SIZE)
    if (typeof count === 'number') setTotalCount(count)

    setLoading(false)
    setLoadingMore(false)
  }, [songs.length])

  // ---- Initial load ----
  useEffect(() => {
    loadPage(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- Play / download ----
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

  // ---- Search across loaded songs ----
  const filteredSongs = searchSongs(songs, search, getArtistName)

  // ---- Genre list from loaded songs ----
  const genres = [
    'All',
    ...Array.from(new Set(songs.map((s) => s.genre).filter(Boolean)))
  ]

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
        <h1 className="hc-display" style={{ marginTop: '0.5rem' }}>
          All Songs
        </h1>
        <p className="hc-muted">
          Search and explore tracks from HitColumn artists.
        </p>

        <div className="hc-search-bar">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search by title, artist, or genre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="hc-search-clear"
              onClick={() => setSearch('')}
              aria-label="Clear"
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>

        {genres.length > 1 && !search && (
          <div className="hc-chips">
            {genres.map((g) => (
              <Link
                key={g}
                to={g === 'All' ? '/songs' : `/genre/${g.toLowerCase()}`}
                className="hc-chip"
              >
                {g}
              </Link>
            ))}
          </div>
        )}

        {errorMsg && (
          <div className="hc-badge hc-badge-live" style={{ marginTop: '1rem' }}>
            {errorMsg}
          </div>
        )}

        <p className="hc-small hc-muted" style={{ marginTop: '1rem' }}>
          Showing <strong>{filteredSongs.length}</strong>
          {totalCount > 0 && !search ? ` of ${totalCount}` : ''}{' '}
          {filteredSongs.length === 1 ? 'song' : 'songs'}
          {search && ` for "${search}"`}
        </p>

        {filteredSongs.length === 0 ? (
          <div
            className="hc-card hc-card-pad"
            style={{ textAlign: 'center', marginTop: '1.5rem' }}
          >
            <i
              className="fas fa-search"
              style={{
                fontSize: '2rem',
                color: 'var(--hc-text-subtle)',
                marginBottom: '1rem'
              }}
            ></i>
            <p className="hc-muted">
              {search ? 'No songs found. Try another search.' : 'No songs yet.'}
            </p>
          </div>
        ) : (
          <>
            <div className="hc-track-grid" style={{ marginTop: '1.5rem' }}>
              {filteredSongs.map((song) => (
                <TrackCard
                  key={song.id}
                  song={song}
                  songUrl={songUrl}
                  getArtistName={getArtistName}
                  onPlay={handlePlay}
                  onDownload={handleDownload}
                  playlist={filteredSongs}
                />
              ))}
            </div>

            {/* ✅ Load more button */}
            {!search && hasMore && (
              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <button
                  className="hc-btn hc-btn-primary"
                  onClick={() => loadPage(false)}
                  disabled={loadingMore}
                  style={{ minWidth: '180px' }}
                >
                  {loadingMore ? (
                    <>
                      <span
                        className="hc-play-spinner"
                        aria-hidden="true"
                        style={{
                          borderTopColor: '#fffaf2',
                          borderRightColor: '#fffaf2'
                        }}
                      ></span>{' '}
                      Loading...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-arrow-down"></i> Load More
                    </>
                  )}
                </button>
              </div>
            )}

            {!search && !hasMore && songs.length > PAGE_SIZE && (
              <p
                className="hc-small hc-muted"
                style={{ textAlign: 'center', marginTop: '2rem' }}
              >
                <i className="fas fa-check-circle"></i> You've reached the end
              </p>
            )}
          </>
        )}
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
            <a
              href="mailto:peazydesun@gmail.com"
              className="hc-btn hc-btn-secondary"
            >
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