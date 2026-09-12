import { supabase } from '../supabaseClient'

const pendingRpc = new Map()

// Prevents spamming the same RPC multiple times in a short window
function fireOnce(key, fn) {
  if (pendingRpc.has(key)) return
  pendingRpc.set(key, true)
  fn().finally(() => {
    // Allow next fire after 3 seconds
    setTimeout(() => pendingRpc.delete(key), 3000)
  })
}

export function trackPlay(song, onOptimistic) {
  const next = (song.play_count || 0) + 1
  onOptimistic?.(next)

  const key = `${song.id}-play`
  fireOnce(key, () =>
    supabase.rpc('increment_play_count', { song_id: song.id }).then(({ error }) => {
      if (error) console.error('Play count failed:', error.message)
    })
  )

  return next
}

export function trackDownload(song, onOptimistic) {
  const next = (song.download_count || 0) + 1
  onOptimistic?.(next)

  const key = `${song.id}-download`
  fireOnce(key, () =>
    supabase.rpc('increment_download_count', { song_id: song.id }).then(({ error }) => {
      if (error) console.error('Download count failed:', error.message)
    })
  )

  return next
}