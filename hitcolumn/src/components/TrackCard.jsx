import { Link } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext'

const RADIUS = 26
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function TrackCard({
  song,
  onPlay,
  onDownload,
  songUrl,
  getArtistName,
  playlist
}) {
  const {
    currentSong,
    isPlaying,
    loading,
    currentTime,
    duration,
    play
  } = usePlayer()

  const isCurrent = currentSong?.id === song.id
  const isThisPlaying = isCurrent && isPlaying
  const isThisLoading = isCurrent && loading && !isPlaying

  const link = songUrl ? songUrl(song) : `/song/${song.slug || song.id}`
  const artistName = getArtistName
    ? getArtistName(song)
    : song.artist_name || song.artists?.artist_name || 'Unknown Artist'

  function handlePlayClick(e) {
    e.preventDefault()
    e.stopPropagation()
    if (!isCurrent) onPlay?.(song)
    play(song, playlist || [song])
  }

  // Ring shows progress only for the active song
  const progress =
    isCurrent && duration > 0 ? (currentTime / duration) * 100 : 0
  const strokeDashoffset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE

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
          <Link
            to={`/artist/${song.artist_id}`}
            className="hc-artist-link"
            onClick={(e) => e.stopPropagation()}
          >
            {artistName}
          </Link>
          {' • '}
          {song.genre}
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
            className={`hc-play-circle ${isThisPlaying ? 'is-playing' : ''} ${
              isThisLoading ? 'is-loading' : ''
            }`}
            onClick={handlePlayClick}
            aria-label={isThisPlaying ? 'Pause' : 'Play'}
          >
            <svg
              className="hc-play-ring"
              viewBox="0 0 60 60"
              aria-hidden="true"
            >
              <circle
                className="hc-play-ring-track"
                cx="30"
                cy="30"
                r={RADIUS}
              />
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

            {isThisLoading ? (
              <span className="hc-play-spinner" aria-hidden="true"></span>
            ) : (
              <i
                className={`fas ${isThisPlaying ? 'fa-pause' : 'fa-play'}`}
              ></i>
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
      </div>
    </div>
  )
}