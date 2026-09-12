import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Admin() {
  const [user, setUser] = useState(null)
  const [tab, setTab] = useState('overview')
  const [songs, setSongs] = useState([])
  const [artists, setArtists] = useState([])
  const [messages, setMessages] = useState([])
  const [subs, setSubs] = useState([])
  const [limits, setLimits] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return navigate('/login')

      const { data: artist } = await supabase
        .from('artists')
        .select('is_admin')
        .eq('id', userData.user.id)
        .single()

      if (!artist?.is_admin) return navigate('/')

      setUser(userData.user)
      await loadAll()
      setLoading(false)
    }
    init()
  }, [navigate])

async function loadAll() {
  const [s, a, m, sub, l] = await Promise.all([
    supabase.from('songs').select('*, artists:artist_id (artist_name)').order('created_at', { ascending: false }),
    supabase.from('artists').select('*').order('created_at', { ascending: false }),
    supabase.from('support_messages').select('*').order('created_at', { ascending: false }),
    supabase.from('subscriptions').select('*, artists:artist_id (artist_name)').order('created_at', { ascending: false }),
    supabase.from('upload_limits').select('*')
  ])
  setSongs(s.data || [])
  setArtists(a.data || [])
  setMessages(m.data || [])
  setSubs(sub.data || [])
  setLimits(l.data || [])
}

  async function toggleSongStatus(song) {
    const newStatus = song.status === 'approved' ? 'pending' : 'approved'
    const { error } = await supabase.from('songs').update({ status: newStatus }).eq('id', song.id)
    if (!error) {
      setSongs((prev) => prev.map((s) => s.id === song.id ? { ...s, status: newStatus } : s))
    }
  }

  async function deleteSong(id) {
    if (!confirm('Delete this song permanently?')) return
    const { error } = await supabase.from('songs').delete().eq('id', id)
    if (!error) setSongs((prev) => prev.filter((s) => s.id !== id))
  }

  async function approveSub(sub) {
    const planUploadsMap = { starter: 1, creator: 3, pro: 5, studio: 15 }
    const extraUploads = planUploadsMap[sub.plan] || 0

    const { error: e1 } = await supabase.from('subscriptions').update({ status: 'approved' }).eq('id', sub.id)
    if (e1) return

    const { data: currentLimit } = await supabase
      .from('upload_limits')
      .select('max_uploads')
      .eq('artist_id', sub.artist_id)
      .single()

    const newMax = (currentLimit?.max_uploads || 3) + extraUploads

    const { error: e2 } = await supabase
      .from('upload_limits')
      .update({ plan: sub.plan, max_uploads: newMax })
      .eq('artist_id', sub.artist_id)

    if (!e2) {
      setSubs((prev) => prev.map((s) => s.id === sub.id ? { ...s, status: 'approved' } : s))
    }
  }

  if (loading) {
    return (
      <div className="hc-loading-screen">
        <div className="hc-loader"></div>
        <p className="hc-muted">Loading admin...</p>
      </div>
    )
  }

  const totalPlays = songs.reduce((sum, s) => sum + (s.play_count || 0), 0)
  const totalDownloads = songs.reduce((sum, s) => sum + (s.download_count || 0), 0)
  const pendingSongs = songs.filter((s) => s.status !== 'approved').length
  const pendingSubs = subs.filter((s) => s.status === 'pending').length
  const unreadMessages = messages.length

  const TABS = [
    { id: 'overview', label: 'Overview', icon: 'fas fa-chart-line' },
    { id: 'songs', label: 'Songs', icon: 'fas fa-music' },
    { id: 'artists', label: 'Artists', icon: 'fas fa-users' },
    { id: 'messages', label: 'Messages', icon: 'fas fa-envelope' },
    { id: 'subscriptions', label: 'Subscriptions', icon: 'fas fa-crown' }
  ]

  const filteredSongs = songs.filter((s) =>
    s.title?.toLowerCase().includes(search.toLowerCase()) ||
    s.artists?.artist_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="hc-container">
      <section className="hc-section">
        {/* Header */}
        <div className="hc-admin-header">
          <div>
            <span className="hc-eyebrow">Admin</span>
            <h1 className="hc-display" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', marginTop: '0.4rem' }}>
              Dashboard
            </h1>
            <p className="hc-muted" style={{ marginTop: '4px' }}>
              Welcome back. Here is how HitColumn is doing today.
            </p>
          </div>
          <button className="hc-btn hc-btn-secondary" onClick={loadAll}>
            <i className="fas fa-rotate"></i> Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="hc-admin-stats">
          <div className="hc-stat-card">
            <div className="hc-stat-icon"><i className="fas fa-music"></i></div>
            <div>
              <p className="hc-stat-label">Total Songs</p>
              <h2 className="hc-stat-value">{songs.length}</h2>
            </div>
          </div>
          <div className="hc-stat-card">
            <div className="hc-stat-icon"><i className="fas fa-users"></i></div>
            <div>
              <p className="hc-stat-label">Artists</p>
              <h2 className="hc-stat-value">{artists.length}</h2>
            </div>
          </div>
          <div className="hc-stat-card">
            <div className="hc-stat-icon"><i className="fas fa-play"></i></div>
            <div>
              <p className="hc-stat-label">Total Plays</p>
              <h2 className="hc-stat-value">{totalPlays.toLocaleString()}</h2>
            </div>
          </div>
          <div className="hc-stat-card">
            <div className="hc-stat-icon"><i className="fas fa-download"></i></div>
            <div>
              <p className="hc-stat-label">Downloads</p>
              <h2 className="hc-stat-value">{totalDownloads.toLocaleString()}</h2>
            </div>
          </div>
          <div className="hc-stat-card is-warn">
            <div className="hc-stat-icon"><i className="fas fa-clock"></i></div>
            <div>
              <p className="hc-stat-label">Pending Songs</p>
              <h2 className="hc-stat-value">{pendingSongs}</h2>
            </div>
          </div>
          <div className="hc-stat-card is-brand">
            <div className="hc-stat-icon"><i className="fas fa-crown"></i></div>
            <div>
              <p className="hc-stat-label">Pending Subs</p>
              <h2 className="hc-stat-value">{pendingSubs}</h2>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="hc-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`hc-tab ${tab === t.id ? 'is-active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <i className={t.icon}></i> {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="hc-admin-panel">
          {tab === 'overview' && (
            <div className="hc-overview">
              <div className="hc-card hc-card-pad">
                <h3 className="hc-section-title" style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>
                  <i className="fas fa-bolt" style={{ color: 'var(--hc-brand)' }}></i> Quick Actions
                </h3>
                <div className="hc-quick-actions">
                  <button className="hc-btn hc-btn-primary" onClick={() => setTab('songs')}>
                    <i className="fas fa-music"></i> Review Songs
                  </button>
                  <button className="hc-btn hc-btn-secondary" onClick={() => setTab('subscriptions')}>
                    <i className="fas fa-crown"></i> Approve Subs
                  </button>
                  <button className="hc-btn hc-btn-secondary" onClick={() => setTab('messages')}>
                    <i className="fas fa-envelope"></i> Messages
                  </button>
                </div>
              </div>

              <div className="hc-card hc-card-pad">
                <h3 className="hc-section-title" style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>
                  <i className="fas fa-list" style={{ color: 'var(--hc-brand)' }}></i> Recent Activity
                </h3>
                <ul className="hc-activity-list">
                  {songs.slice(0, 5).map((s) => (
                    <li key={s.id}>
                      <span className="hc-activity-dot"></span>
                      <div>
                        <strong>{s.artists?.artist_name || 'Artist'}</strong> uploaded <em>{s.title}</em>
                        <p className="hc-small hc-muted">{new Date(s.created_at).toLocaleDateString()}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {tab === 'songs' && (
            <>
              <div className="hc-admin-toolbar">
                <div className="hc-search">
                  <i className="fas fa-search"></i>
                  <input
                    type="text"
                    placeholder="Search songs or artists..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <p className="hc-small hc-muted">{filteredSongs.length} result(s)</p>
              </div>

              <div className="hc-table-wrap">
                <table className="hc-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Artist</th>
                      <th>Genre</th>
                      <th>Status</th>
                      <th>Plays</th>
                      <th>Downloads</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSongs.map((s) => (
                      <tr key={s.id}>
                        <td className="hc-td-strong">{s.title}</td>
                        <td>{s.artists?.artist_name || '—'}</td>
                        <td><span className="hc-tag">{s.genre || '—'}</span></td>
                        <td>
                          <span className={`hc-status ${s.status === 'approved' ? 'is-success' : 'is-warn'}`}>
                            <i className={`fas ${s.status === 'approved' ? 'fa-check-circle' : 'fa-clock'}`}></i> {s.status}
                          </span>
                        </td>
                        <td>{s.play_count || 0}</td>
                        <td>{s.download_count || 0}</td>
                        <td>
                          <div className="hc-row-actions">
                            <button className="hc-icon-btn" onClick={() => toggleSongStatus(s)} title="Toggle status">
                              <i className={`fas ${s.status === 'approved' ? 'fa-eye-slash' : 'fa-check'}`}></i>
                            </button>
                            <button className="hc-icon-btn is-danger" onClick={() => deleteSong(s.id)} title="Delete">
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === 'artists' && (
  <div className="hc-table-wrap">
    <table className="hc-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Uploads Used</th>
          <th>Max Uploads</th>
          <th>Remaining</th>
          <th>Plan</th>
          <th>Joined</th>
        </tr>
      </thead>
      <tbody>
        {artists.map((a) => {
          const limit = limits.find((l) => l.artist_id === a.id)
          const used = limit?.uploads_used ?? 0
          const max = limit?.max_uploads ?? 3
          const remaining = Math.max(max - used, 0)
          const percent = max > 0 ? Math.min((used / max) * 100, 100) : 0

          return (
            <tr key={a.id}>
              <td className="hc-td-strong">{a.artist_name}</td>
              <td>{a.email || '—'}</td>
              <td>
                {a.is_admin ? (
                  <span className="hc-status is-brand">
                    <i className="fas fa-shield-halved"></i> Admin
                  </span>
                ) : (
                  <span className="hc-status">
                    <i className="fas fa-user"></i> Artist
                  </span>
                )}
              </td>
              <td>
                <div className="hc-usage">
                  <div className="hc-usage-bar">
                    <div
                      className={`hc-usage-fill ${remaining === 0 ? 'is-full' : ''}`}
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                  <span className="hc-small hc-muted">{used}</span>
                </div>
              </td>
              <td>{max}</td>
              <td>
                <span className={`hc-status ${remaining === 0 ? 'is-warn' : 'is-success'}`}>
                  <i className={`fas ${remaining === 0 ? 'fa-exclamation-circle' : 'fa-check-circle'}`}></i> {remaining}
                </span>
              </td>
              <td><span className="hc-tag">{limit?.plan || 'free'}</span></td>
              <td>{new Date(a.created_at).toLocaleDateString()}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  </div>
)}

          {tab === 'messages' && (
            <div className="hc-table-wrap">
              <table className="hc-table">
                <thead>
                  <tr>
                    <th>From</th>
                    <th>Subject</th>
                    <th>Message</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <div className="hc-td-strong">{m.name}</div>
                        <div className="hc-small hc-muted">{m.email}</div>
                      </td>
                      <td><span className="hc-tag">{m.subject}</span></td>
                      <td style={{ maxWidth: '360px' }}>{m.message}</td>
                      <td>{new Date(m.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
{tab === 'subscriptions' && (
  <div className="hc-table-wrap">
    <table className="hc-table">
      <thead>
        <tr>
          <th>Artist</th>
          <th>Plan</th>
          <th>Amount</th>
          <th>Status</th>
          <th style={{ textAlign: 'right' }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {subs.map((s) => (
          <tr key={s.id}>
            <td className="hc-td-strong">{s.artists?.artist_name || '—'}</td>
            <td><span className="hc-tag">{s.plan}</span></td>
            <td>MWK {(s.amount_mwk || 0).toLocaleString()}</td>
            <td>
              <span className={`hc-status ${s.status === 'approved' ? 'is-success' : 'is-warn'}`}>
                <i className={`fas ${s.status === 'approved' ? 'fa-check-circle' : 'fa-clock'}`}></i> {s.status}
              </span>
            </td>
            <td>
              <div className="hc-row-actions">
                {s.status !== 'approved' && (
                  <button
                    className="hc-icon-btn"
                    onClick={() => approveSub(s)}
                    title="Approve"
                  >
                    <i className="fas fa-check"></i>
                  </button>
                )}
                <button
                  className="hc-icon-btn is-danger"
                  onClick={() => deleteSub(s.id)}
                  title="Delete"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}
        </div>
      </section>
    </div>
  )
}