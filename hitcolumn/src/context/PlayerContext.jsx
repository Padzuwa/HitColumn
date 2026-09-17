import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react'

const PlayerContext = createContext(null)

export function PlayerProvider({ children }) {
  const audioRef = useRef(null)
  const loadingTimerRef = useRef(null)
  const nextRef = useRef(() => {})

  const [currentSong, setCurrentSong] = useState(null)
  const [queue, setQueue] = useState([])
  const [queueIndex, setQueueIndex] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  // ---- Attach event listeners once ----
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const stopLoading = () => {
      setLoading(false)
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current)
        loadingTimerRef.current = null
      }
    }

    const onPlay = () => setIsPlaying(true)
    const onPlaying = () => stopLoading()
    const onCanPlay = () => stopLoading()
    const onPause = () => setIsPlaying(false)
    const onEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
      nextRef.current?.()
    }
    const onWaiting = () => setLoading(true)
    const onError = () => {
      stopLoading()
      setIsPlaying(false)
    }
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration)
      }
    }
    const onLoadedMetadata = () => {
      if (audio.duration && isFinite(audio.duration)) {
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
  }, [])

  // ---- Load + play whenever currentSong changes ----
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentSong) return

    // If the same URL is already loaded, don't reload
    if (audio.src && audio.src.endsWith(currentSong.audio_url)) {
      if (audio.paused) audio.play().catch(() => {})
      return
    }

    audio.src = currentSong.audio_url
    audio.load()
    setCurrentTime(0)
    setDuration(0)
    setLoading(true)

    if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current)
    loadingTimerRef.current = setTimeout(() => setLoading(false), 20000)

    audio.play().catch((err) => {
      console.error('Play failed:', err)
      setLoading(false)
    })
  }, [currentSong])

  // ---- Body class for reserving space at the bottom ----
  useEffect(() => {
    if (currentSong) document.body.classList.add('has-player')
    else document.body.classList.remove('has-player')

    return () => document.body.classList.remove('has-player')
  }, [currentSong])

  // ---- Keep next() fresh for the auto-advance ----
  useEffect(() => {
    nextRef.current = () => {
      if (queueIndex >= 0 && queueIndex < queue.length - 1) {
        const nextSong = queue[queueIndex + 1]
        setCurrentSong(nextSong)
        setQueueIndex(queueIndex + 1)
      }
    }
  }, [queue, queueIndex])

  const play = useCallback(
    (song, playlist = []) => {
      if (!song?.audio_url) return

      // Same song → toggle
      if (currentSong?.id === song.id) {
        const audio = audioRef.current
        if (!audio) return
        if (audio.paused) audio.play().catch(() => {})
        else audio.pause()
        return
      }

      setCurrentSong(song)

      if (playlist.length > 0) {
        const idx = playlist.findIndex((s) => s.id === song.id)
        setQueue(playlist)
        setQueueIndex(idx >= 0 ? idx : 0)
      } else {
        setQueue([song])
        setQueueIndex(0)
      }
    },
    [currentSong]
  )

  const toggle = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !currentSong) return
    if (audio.paused) audio.play().catch(() => {})
    else audio.pause()
  }, [currentSong])

  const pause = useCallback(() => {
    audioRef.current?.pause()
  }, [])

  const resume = useCallback(() => {
    audioRef.current?.play().catch(() => {})
  }, [])

  const seek = useCallback((time) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = time
    setCurrentTime(time)
  }, [])

  const next = useCallback(() => {
    if (queueIndex >= 0 && queueIndex < queue.length - 1) {
      setCurrentSong(queue[queueIndex + 1])
      setQueueIndex(queueIndex + 1)
    }
  }, [queue, queueIndex])

  const prev = useCallback(() => {
    if (queueIndex > 0) {
      setCurrentSong(queue[queueIndex - 1])
      setQueueIndex(queueIndex - 1)
    }
  }, [queue, queueIndex])

  const close = useCallback(() => {
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
    }
    setCurrentSong(null)
    setQueue([])
    setQueueIndex(-1)
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
  }, [])

  const value = {
    currentSong,
    queue,
    queueIndex,
    isPlaying,
    loading,
    currentTime,
    duration,
    hasNext: queueIndex >= 0 && queueIndex < queue.length - 1,
    hasPrev: queueIndex > 0,
    play,
    pause,
    resume,
    toggle,
    seek,
    next,
    prev,
    close
  }

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio ref={audioRef} preload="metadata" crossOrigin="anonymous" />
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be used inside PlayerProvider')
  return ctx
}