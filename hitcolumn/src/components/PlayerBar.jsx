import { Link } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext'

function formatTime(seconds) {
  if (!seconds || !isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default function PlayerBar() {
  const {
    currentSong,
    isPlaying,
    loading,
    currentTime,
    duration,
    hasNext,
    hasPrev,
    toggle,
    seek,
    next,
    prev,
    close
  } = usePlayer()

  if (!currentSong) return null

  const songUrl = `/song/${currentSong.slug || currentSong.id}`
  const artistName =
    currentSong.artist_name ||
    currentSong.artists?.artist_name ||
    'Unknown Artist'
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0
  const showSpinner = loading && !isPlaying

  function onSeekClick(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    if (duration > 0) seek(percent * duration)
  }

  return (
    <div className="hc-player-bar">
      <Link to={songUrl} className="hc-player-info">
        <div className="hc-player-art">
          {currentSong.cover_url ? (
            <img src={currentSong.cover_url} alt={currentSong.title} />
          ) : (
            <i className="fas fa-music"></i>
          )}
        </div>
        <div className="hc-player-meta">
          <span className="hc-player-title">{currentSong.title}</span>
          <span className="hc-player-artist">{artistName}</span>
        </div>
      </Link>

      <div className="hc-player-center">
        <div className="hc-player-buttons">
          <button
            className="hc-player-btn"
            onClick={prev}
            disabled={!hasPrev}
            aria-label="Previous"
          >
            <i className="fas fa-backward-step"></i>
          </button>

          <button
            className="hc-player-btn hc-player-btn-main"
            onClick={toggle}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {showSpinner ? (
              <span className="hc-play-spinner" aria-hidden="true"></span>
            ) : (
              <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
            )}
          </button>

          <button
            className="hc-player-btn"
            onClick={next}
            disabled={!hasNext}
            aria-label="Next"
          >
            <i className="fas fa-forward-step"></i>
          </button>
        </div>

        <div className="hc-player-progress-row">
          <span className="hc-player-time">{formatTime(currentTime)}</span>
          <div className="hc-player-track" onClick={onSeekClick}>
            <div
              className="hc-player-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <span className="hc-player-time">{formatTime(duration)}</span>
        </div>
      </div>

      <button
        className="hc-player-close"
        onClick={close}
        aria-label="Close player"
      >
        <i className="fas fa-times"></i>
      </button>
    </div>
  )
}