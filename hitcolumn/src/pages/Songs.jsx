import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function Songs() {
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)

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
        <h1 className="hc-section-title">All Songs</h1>
        <p className="hc-muted">Browse songs uploaded by HitColumn artists.</p>

        {songs.length === 0 ? (
          <p className="hc-muted" style={{ marginTop: '2rem' }}>No songs yet.</p>
        ) : (
          <div className="hc-track-grid" style={{ marginTop: '2rem' }}>
            {songs.map((song) => (
              <div key={song.id} className="hc-track-card">
                <div className="hc-track-art">
                  {song.cover_url ? (
                    <img src={song.cover_url} alt={song.title} />
                  ) : (
                    <i className="fas fa-music" style={{ fontSize: '2.5rem', color: 'var(--hc-text-subtle)' }}></i>
                  )}
                </div>
                <div className="hc-track-info">
                  <p className="hc-track-title">{song.title}</p>
                  <p className="hc-track-meta">
                    {song.artists?.artist_name || 'Unknown Artist'} • {song.genre}
                  </p>

                  <div className="hc-track-stats" style={{ display: 'flex', gap: '14px', marginTop: '4px' }}>
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
    <h3 className="hc-section-title" style={{ fontSize: '1.4rem' }}>Contact HitColumn</h3>
    <p className="hc-muted">For business inquiries, support, or partnerships.</p>
    <div className="hc-footer-links">
      <a href="mailto:peazydesun@gmail.com" className="hc-btn hc-btn-secondary">
        <i className="fas fa-envelope"></i> peazydesun@gmail.com
      </a>
      <a href="tel:+265992404606" className="hc-btn hc-btn-secondary">
        <i className="fas fa-phone"></i> +265 992 404 606
      </a>
      <a href="https://wa.me/265992404606" target="_blank" className="hc-btn hc-btn-secondary">
        <i className="fab fa-whatsapp"></i> WhatsApp
      </a>
    </div>
    <p className="hc-small hc-muted" style={{ marginTop: '1.5rem' }}>
      &copy; 2026 HitColumn. All rights reserved.
    </p>
  </div>
</footer>
    </div>
  )
}