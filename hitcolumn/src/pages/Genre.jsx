import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import TrackCard from '../components/TrackCard'

export default function Genre() {
  const { slug } = useParams()
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)

  const genreMap = {
    afrobeat: 'Afrobeat',
    dancehall: 'Dancehall',
    amapiano: 'Amapiano',
    trap: 'Trap',
    rnb: 'RnB',
    other: 'Other'
  }

  const genreName = genreMap[slug] || 'Music'

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('songs')
        .select('*, artists:artist_id (artist_name)')
        .eq('status', 'approved')
        .eq('genre', genreName)
        .order('created_at', { ascending: false })

      setSongs(data || [])
      setLoading(false)
    }
    load()
  }, [genreName])

  useEffect(() => {
    document.title = `${genreName} Songs – Free Stream & Download | HitColumn`
    let tag = document.querySelector('meta[name="description"]')
    if (!tag) {
      tag = document.createElement('meta')
      tag.setAttribute('name', 'description')
      document.head.appendChild(tag)
    }
    tag.setAttribute('content', `Stream and download free ${genreName} songs from artists on HitColumn.`)
  }, [genreName])

  const getArtistName = (row) =>
    row?.artist_name || row?.artists?.artist_name || 'Unknown Artist'
  const songUrl = (song) => `/song/${song.slug || song.id}`

  if (loading) {
    return (
      <div className="hc-loading-screen">
        <div className="hc-loader"></div>
      </div>
    )
  }

  return (
    <div className="hc-container">
      <section className="hc-section">
        <span className="hc-eyebrow">Genre</span>
        <h1 className="hc-display" style={{ marginTop: '0.5rem' }}>
          {genreName} Songs
        </h1>
        <p className="hc-muted">
          {songs.length} free {genreName} track{songs.length === 1 ? '' : 's'} on HitColumn.
        </p>

        {songs.length === 0 ? (
          <p className="hc-muted" style={{ marginTop: '2rem' }}>No songs in this genre yet.</p>
        ) : (
          <div className="hc-track-grid" style={{ marginTop: '2rem' }}>
            {songs.map((song) => (
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