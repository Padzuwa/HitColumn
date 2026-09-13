import { useEffect, useState, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import TrackCard from '../components/TrackCard'
import { searchSongs } from '../utils/search'

export default function Search() {
  const [params, setParams] = useSearchParams()
  const urlQuery = params.get('q') || ''
  const [input, setInput] = useState(urlQuery)
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)

  // Load all songs once
  useEffect(() => {
    let active = true

    async function run() {
      const { data } = await supabase
        .from('songs')
        .select('*, artists:artist_id (artist_name)')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(500)

      if (!active) return
      setSongs(data || [])
      setLoading(false)
    }

    run()
    return () => {
      active = false
    }
  }, [])

  // ✅ Sync URL whenever the user types (debounced to avoid spam)
  useEffect(() => {
    const timeout = setTimeout(() => {
      const trimmed = input.trim()
      if (trimmed === urlQuery) return
      setParams(trimmed ? { q: trimmed } : {}, { replace: true })
    }, 250)

    return () => clearTimeout(timeout)
  }, [input, urlQuery, setParams])

  const getArtistName = (row) =>
    row?.artist_name || row?.artists?.artist_name || 'Unknown Artist'

  // ✅ Live fuzzy search on every keystroke
  const results = useMemo(
    () => searchSongs(songs, input, getArtistName),
    [songs, input]
  )

  const songUrl = (song) => `/song/${song.slug || song.id}`

  return (
    <div className="hc-container">
      <section className="hc-section">
        <span className="hc-eyebrow">Search</span>
        <h1 className="hc-display" style={{ marginTop: '0.5rem' }}>
          Find music
        </h1>

        <div className="hc-search-bar" style={{ marginTop: '1.5rem' }}>
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Start typing to search..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoComplete="off"
            autoFocus
          />
          {input && (
            <button
              type="button"
              className="hc-search-clear"
              onClick={() => setInput('')}
              aria-label="Clear search"
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>

        {input.trim() && !loading && (
          <p className="hc-small hc-muted" style={{ marginTop: '1rem' }}>
            {results.length} {results.length === 1 ? 'result' : 'results'} for "
            {input.trim()}"
          </p>
        )}

        {loading ? (
          <div className="hc-loading-screen">
            <div className="hc-loader"></div>
          </div>
        ) : !input.trim() ? (
          <p className="hc-muted" style={{ marginTop: '2rem' }}>
            Type to search across every song on HitColumn.
          </p>
        ) : results.length === 0 ? (
          <div
            className="hc-card hc-card-pad"
            style={{ marginTop: '2rem', textAlign: 'center' }}
          >
            <i
              className="fas fa-search"
              style={{ fontSize: '2rem', color: 'var(--hc-text-subtle)' }}
            ></i>
            <p className="hc-muted">No songs match "{input.trim()}".</p>
            <Link
              to="/songs"
              className="hc-btn hc-btn-secondary"
              style={{ marginTop: '1rem' }}
            >
              Browse all songs
            </Link>
          </div>
        ) : (
          <div className="hc-track-grid" style={{ marginTop: '1.5rem' }}>
            {results.map((song) => (
              <TrackCard
                key={song.id}
                song={song}
                songUrl={songUrl}
                getArtistName={getArtistName}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}