import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

const RADIUS = 26
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const LOADING_TIMEOUT_MS = 20000 // give up after 20s

function pauseAllOtherAudios(except) {
  document.querySelectorAll('audio').forEach((el) => {
    if (el !== except && !el.paused) {
      try {
        el.pause()
        el.currentTime = 0
      } catch (e) {
        /* ignore */
      }
    }
  })
}

export default function TrackCard({
  song,
  onPlay,
  onDownload,
  songUrl,
  getArtistName
}) {
  const audioRef = useRef(null)
  const loadingTimerRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [loadingAudio, setLoadingAudio] = useState(false)
  const [progress, setProgress] = useState(0)

  // ✅ Clear any pending timeout on unmount
  useEffect(() => {
    return () => {
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current)
    }
  }, [])

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

    const handlePlay = () => {
      pauseAllOtherAudios(audio)
      setPlaying(true)
      if (audio.currentTime < 1) onPlay?.(song)
    }

    const handlePlaying = () => {
      // Playback has actually started
      stopLoading()
    }

    const handleCanPlay = () => stopLoading()
    const handlePause = () => setPlaying(false)
    const handleEnded = () => {
      setPlaying(false)
      setProgress(0)
      stopLoading()
    }
    const handleWaiting = () => setLoadingAudio(true)
    const handleStalled = () => setLoadingAudio(true)
    const handleError = () => {
      stopLoading()
      setPlaying(false)
    }

    const handleTimeUpdate = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setProgress((audio.currentTime / audio.duration) * 100)
      }
    }

    audio.addEventListener('play', handlePlay)
    audio.addEventListener('playing', handlePlaying)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('waiting', handleWaiting)
    audio.addEventListener('stalled', handleStalled)
    audio.addEventListener('error', handleError)
    audio.addEventListener('timeupdate', handleTimeUpdate)

    return () => {
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('playing', handlePlaying)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('waiting', handleWaiting)
      audio.removeEventListener('stalled', handleStalled)
      audio.removeEventListener('error', handleError)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
    }
  }, [song, onPlay])

  async function togglePlay() {
    const audio = audioRef.current
    if (!audio) return

    if (audio.paused) {
      pauseAllOtherAudios(audio)

      // ✅ Show spinner instantly — don't wait for the browser
      setLoadingAudio(true)

      // Safety timeout: if it takes too long, release the spinner
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current)
      loadingTimerRef.current = setTimeout(() => {
        setLoadingAudio(false)
      }, LOADING_TIMEOUT_MS)

      try {
        // Set preload to auto so buffering starts early
        audio.preload = 'auto'
        await audio.play()
      } catch (err) {
        console.error('Play failed:', err)
        setLoadingAudio(false)
        if (loadingTimerRef.current) {
          clearTimeout(loadingTimerRef.current)
          loadingTimerRef.current = null
        }
      }
    } else {
      audio.pause()
    }
  }

  const strokeDashoffset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE
  const link = songUrl ? songUrl(song) : `/song/${song.slug || song.id}`
  const artistName = getArtistName
    ? getArtistName(song)
    : song.artist_name || song.artists?.artist_name || 'Unknown Artist'

  const showSpinner = loadingAudio && !playing

  return (
    <div className="hc-track-card">
      <Link to={link} className="hc-track-art">
        {song.cover_url ? (
          <img src={song.cover_url} alt={song.title} loading="lazy" />
        ) : (
          <i
            className="fas fa-music"
            style={{ fontSize: '2.5rem', color: 'var(--hc-text-subtle)' }}
          ></i>
        )}
      </Link>

      <div className="hc-track-info">
        <Link to={link} className="hc-track-title-link">
          <p className="hc-track-title">{song.title}</p>
        </Link>

        <p className="hc-track-meta">
          {artistName} • {song.genre}
        </p>

        <div className="hc-track-stats">
          <span>
            <i className="fas fa-play"></i> {song.play_count || 0}
          </span>
          <span>
            <i className="fas fa-download"></i> {song.download_count || 0}
          </span>
        </div>

        <div className="hc-track-controls">
          <button
            type="button"
            className={`hc-play-circle ${playing ? 'is-playing' : ''} ${
              showSpinner ? 'is-loading' : ''
            }`}
            onClick={togglePlay}
            aria-label={playing ? 'Pause' : showSpinner ? 'Loading' : 'Play'}
            aria-busy={showSpinner}
          >
            <svg className="hc-play-ring" viewBox="0 0 60 60" aria-hidden="true">
              <circle className="hc-play-ring-track" cx="30" cy="30" r={RADIUS} />
              <circle
                className="hc-play-ring-fill"
                cx="30"
                cy="30"
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

          <a
            href={song.audio_url}
            download
            className="hc-download-btn"
            onClick={() => onDownload?.(song)}
            aria-label="Download"
          >
            <i className="fas fa-download"></i>
          </a>
        </div>

        <audio
          ref={audioRef}
          src={song.audio_url}
          preload="metadata"
          crossOrigin="anonymous"
        />
      </div>
    </div>
  )
}