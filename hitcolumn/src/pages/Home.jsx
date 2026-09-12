import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Home() {
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    async function fetchLatestSongs() {
      const { data } = await supabase
        .from('songs')
        .select(`
          *,
          artists:artist_id (artist_name)
        `)
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
          <div className="hc-hero-actions">
            <Link to={uploadLink} className="hc-btn hc-btn-primary">
              <i className="fas fa-upload"></i> Upload Your First 3 Songs Free
            </Link>
            <Link to="/songs" className="hc-btn hc-btn-secondary">
              <i className="fas fa-compact-disc"></i> Browse Songs
            </Link>
          </div>
        </div>
      </section>

      <section className="hc-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 className="hc-section-title" style={{ margin: 0 }}>Latest Uploads</h2>
          <Link to="/songs" className="hc-btn hc-btn-ghost">View All</Link>
        </div>

        {songs.length === 0 ? (
          <div className="hc-card hc-card-pad" style={{ textAlign: 'center' }}>
            <p className="hc-muted">No songs yet. Be the first to upload.</p>
          </div>
        ) : (
          <div className="hc-track-grid">
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

                  <div className="hc-track-stats" style={{ display: 'flex', gap: '14px', marginTop: '6px' }}>
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

      <section className="hc-section" style={{ paddingTop: '0' }}>
        <div className="hc-card hc-card-pad" style={{
          background: 'linear-gradient(135deg, var(--hc-brand-soft), transparent)',
          borderColor: 'var(--hc-brand)',
          textAlign: 'center'
        }}>
          <span className="hc-eyebrow">Why HitColumn</span>
          <h2 className="hc-section-title" style={{ marginTop: '0.5rem' }}>Built for both Upcoming Artists & Established Musicians, Loved by Fans</h2>
          <p className="hc-muted" style={{ maxWidth: '600px', margin: '0 auto 1.5rem' }}>
            Upload your first 3 songs for free. Get discovered by fans across Malawi and beyond.
            No complicated setup — just your music, your way.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
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