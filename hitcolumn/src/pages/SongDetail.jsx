import { useEffect, useRef, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { trackPlay, trackDownload } from '../utils/counters'

const RADIUS = 34
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function pauseAllOtherAudios(except) {
  document.querySelectorAll('audio').forEach((el) => {
    if (el !== except && !el.paused) {
      try {
        el.pause()
        el.currentTime = 0
      } catch (e) {}
    }
  })
}

export default function SongDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [song, setSong] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [copied, setCopied] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [loadingAudio, setLoadingAudio] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef(null)
  const loadingTimerRef = useRef(null)

  // 1. Load song data
  useEffect(() => {
    async function load() {
      let data = null
      let error = null

      const slugQuery = await supabase
        .from('songs')
        .select('*, artists:artist_id (artist_name, bio)')
        .eq('slug', id)
        .eq('status', 'approved')
        .maybeSingle()

      if (slugQuery.data) {
        data = slugQuery.data
      } else {
        const idQuery = await supabase
          .from('songs')
          .select('*, artists:artist_id (artist_name, bio)')
          .eq('id', id)
          .eq('status', 'approved')
          .maybeSingle()

        data = idQuery.data
        error = idQuery.error
      }

      if (error || !data) {
        setErrorMsg('Song not found.')
        setLoading(false)
        return
      }

      setSong(data)
      updatePageMeta(data)

      if (data.genre) {
        const { data: rel } = await supabase
          .from('songs')
          .select('*, artists:artist_id (artist_name)')
          .eq('status', 'approved')
          .eq('genre', data.genre)
          .neq('id', data.id)
          .order('created_at', { ascending: false })
          .limit(4)

        setRelated(rel || [])
      }

      setLoading(false)
    }

    load()
  }, [id])

  // 2. Audio event listeners
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const stopLoading = () => {
      setLoadingAudio(false)
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current)
        loadingTimerRef.current = null
      }
    }

    const onPlay = () => setPlaying(true)
    const onPlaying = () => stopLoading()
    const onCanPlay = () => stopLoading()
    const onPause = () => setPlaying(false)
    const onEnded = () => {
      setPlaying(false)
      setProgress(0)
      setCurrentTime(0)
    }
    const onWaiting = () => setLoadingAudio(true)
    const onError = () => {
      stopLoading()
      setPlaying(false)
    }
    const onTimeUpdate = () => {
      const audio = audioRef.current
      if (!audio) return
      setCurrentTime(audio.currentTime)
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration)
        setProgress((audio.currentTime / audio.duration) * 100)
      }
    }
    const onLoadedMetadata = () => {
      const audio = audioRef.current
      if (audio && audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration)
      }
    }

    audio.addEventListener('play', onPlay)
    audio.addEventListener('playing', onPlaying)
    audio.addEventListener('canplay', onCanPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('waiting', onWaiting)
    audio.addEventListener('error', onError)
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)

    return () => {
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('playing', onPlaying)
      audio.removeEventListener('canplay', onCanPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('waiting', onWaiting)
      audio.removeEventListener('error', onError)
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current)
    }
  }, [song])

  // 3. Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause()
      }
    }
  }, [])

  function getArtistName(row) {
    return row?.artist_name || row?.artists?.artist_name || 'Unknown Artist'
  }

  function formatTime(seconds) {
    if (!seconds || !isFinite(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  function updatePageMeta(data) {
    const artistName = getArtistName(data)
    document.title = `${data.title} – ${artistName} | HitColumn`

    setMeta(
      'description',
      `Listen to ${data.title} by ${artistName} on HitColumn. Free streaming and download.`
    )
    setMeta('og:title', `${data.title} – ${artistName}`, true)
    setMeta('og:description', `Stream and download ${data.title} free on HitColumn.`, true)
    setMeta('og:image', data.cover_url || '', true)
    setMeta('og:type', 'music.song', true)
    setMeta('og:audio', data.audio_url, true)

    const existing = document.getElementById('song-jsonld')
    if (existing) existing.remove()

    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.id = 'song-jsonld'
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'MusicRecording',
      name: data.title,
      byArtist: { '@type': 'MusicGroup', name: artistName },
      genre: data.genre,
      image: data.cover_url,
      audio: { '@type': 'AudioObject', url: data.audio_url },
      url: window.location.href
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

  async function togglePlay() {
    const audio = audioRef.current
    if (!audio) return

    if (audio.paused) {
      pauseAllOtherAudios(audio)

      // ✅ Show spinner immediately
      setLoadingAudio(true)
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current)
      loadingTimerRef.current = setTimeout(() => setLoadingAudio(false), 20000)

      try {
        audio.preload = 'auto'
        await audio.play()

        // ✅ Count play only on fresh start
        if (audio.currentTime < 1) {
          trackPlay(song, (next) => {
            setSong((s) => ({ ...s, play_count: next }))
          })
        }
      } catch (err) {
        console.error('Play failed:', err)
        setLoadingAudio(false)
      }
    } else {
      audio.pause()
    }
  }

  function seek(e) {
    const audio = audioRef.current
    if (!audio) return
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    if (audio.duration && isFinite(audio.duration)) {
      audio.currentTime = percent * audio.duration
    }
  }

  function handleDownload() {
    trackDownload(song, (next) => {
      setSong((s) => ({ ...s, download_count: next }))
    })
  }

  function share(platform) {
    const url = encodeURIComponent(window.location.href)
    const artistName = getArtistName(song)
    const text = encodeURIComponent(
      `Listen to ${song.title} by ${artistName} on HitColumn`
    )

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

  if (loading) {
    return (
      <div className="hc-loading-screen">
        <div className="hc-loader"></div>
        <p className="hc-muted">Loading song...</p>
      </div>
    )
  }

  if (errorMsg || !song) {
    return (
      <div className="hc-container">
        <section className="hc-section" style={{ textAlign: 'center' }}>
          <i
            className="fas fa-music"
            style={{ fontSize: '3rem', color: 'var(--hc-text-subtle)' }}
          ></i>
          <h1 className="hc-section-title" style={{ marginTop: '1rem' }}>
            Song not found
          </h1>
          <p className="hc-muted">
            The track you're looking for might have been removed.
          </p>
          <button
            className="hc-btn hc-btn-primary"
            style={{ marginTop: '1.5rem' }}
            onClick={() => navigate('/songs')}
          >
            <i className="fas fa-arrow-left"></i> Back to Songs
          </button>
        </section>
      </div>
    )
  }

  const strokeDashoffset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE
  const showSpinner = loadingAudio && !playing

  return (
    <div className="hc-container">
      <section className="hc-section">
        <button className="hc-back-btn" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left"></i> Back
        </button>

        <div className="hc-song-hero">
          <div className="hc-song-art">
            {song.cover_url ? (
              <img src={song.cover_url} alt={song.title} />
            ) : (
              <i className="fas fa-music"></i>
            )}
          </div>

          <div className="hc-song-meta">
            <span className="hc-tag">{song.genre || 'Music'}</span>
            <h1 className="hc-song-title">{song.title}</h1>
            <p className="hc-song-artist">
              by <strong>{getArtistName(song)}</strong>
            </p>

            <div className="hc-song-stats">
              <div className="hc-stat-pill">
                <i className="fas fa-play"></i> {song.play_count || 0} plays
              </div>
              <div className="hc-stat-pill">
                <i className="fas fa-download"></i> {song.download_count || 0} downloads
              </div>
            </div>

            {/* ✅ Custom player */}
            <div className="hc-song-player-wrap">
              <button
                type="button"
                className={`hc-play-circle hc-play-circle-lg ${
                  playing ? 'is-playing' : ''
                } ${showSpinner ? 'is-loading' : ''}`}
                onClick={togglePlay}
                aria-label={playing ? 'Pause' : showSpinner ? 'Loading' : 'Play'}
                aria-busy={showSpinner}
              >
                <svg className="hc-play-ring" viewBox="0 0 80 80" aria-hidden="true">
                  <circle
                    className="hc-play-ring-track"
                    cx="40"
                    cy="40"
                    r={RADIUS}
                  />
                  <circle
                    className="hc-play-ring-fill"
                    cx="40"
                    cy="40"
                    r={RADIUS}
                    style={{
                      strokeDasharray: CIRCUMFERENCE,
                      strokeDashoffset
                    }}
                  />
                </svg>

                {showSpinner ? (
                  <span className="hc-play-spinner" aria-hidden="true"></span>
                ) : (
                  <i className={`fas ${playing ? 'fa-pause' : 'fa-play'}`}></i>
                )}
              </button>

              <div className="hc-player-timeline">
                <div className="hc-player-times">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
                <div
                  className="hc-player-track"
                  onClick={seek}
                  role="slider"
                  aria-label="Seek"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(progress)}
                >
                  <div
                    className="hc-player-progress"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Hidden audio element controlled by our UI */}
            <audio
              ref={audioRef}
              src={song.audio_url}
              preload="metadata"
              crossOrigin="anonymous"
              style={{ display: 'none' }}
            />

            <div className="hc-song-actions">
              <a
                href={song.audio_url}
                download
                onClick={handleDownload}
                className="hc-btn hc-btn-primary"
              >
                <i className="fas fa-download"></i> Download
              </a>

              <button
                className="hc-btn hc-btn-secondary"
                onClick={() => share('whatsapp')}
              >
                <i className="fab fa-whatsapp"></i> WhatsApp
              </button>

              <button
                className="hc-btn hc-btn-secondary"
                onClick={() => share('facebook')}
              >
                <i className="fab fa-facebook"></i> Facebook
              </button>

              <button
                className="hc-btn hc-btn-secondary"
                onClick={() => share('x')}
              >
                <i className="fab fa-x-twitter"></i> X
              </button>

              <button
                className="hc-btn hc-btn-ghost"
                onClick={() => share('copy')}
              >
                <i className={`fas ${copied ? 'fa-check' : 'fa-link'}`}></i>{' '}
                {copied ? 'Copied!' : 'Copy link'}
              </button>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <div style={{ marginTop: '3rem' }}>
            <h2 className="hc-section-title" style={{ marginBottom: '1.5rem' }}>
              More {song.genre} songs
            </h2>
            <div className="hc-track-grid">
              {related.map((r) => (
                <Link
                  key={r.id}
                  to={`/song/${r.slug || r.id}`}
                  className="hc-track-card"
                >
                  <div className="hc-track-art">
                    {r.cover_url ? (
                      <img src={r.cover_url} alt={r.title} />
                    ) : (
                      <i
                        className="fas fa-music"
                        style={{ fontSize: '2.5rem', color: 'var(--hc-text-subtle)' }}
                      ></i>
                    )}
                  </div>
                  <div className="hc-track-info">
                    <p className="hc-track-title">{r.title}</p>
                    <p className="hc-track-meta">{getArtistName(r)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}