// Lightweight fuzzy search — no dependencies
export function fuzzyMatch(text, query) {
  if (!query) return true
  const t = text.toLowerCase()
  const q = query.toLowerCase().trim()
  if (t.includes(q)) return true

  // Character-by-character fuzzy match
  let ti = 0
  let qi = 0
  while (ti < t.length && qi < q.length) {
    if (t[ti] === q[qi]) qi++
    ti++
  }
  return qi === q.length
}

export function searchSongs(songs, query, getArtistName) {
  if (!query || !query.trim()) return songs
  const q = query.toLowerCase().trim()

  return songs.filter((song) => {
    const title = song.title || ''
    const genre = song.genre || ''
    const artist = getArtistName ? getArtistName(song) : song.artist_name || ''

    return (
      fuzzyMatch(title, q) ||
      fuzzyMatch(genre, q) ||
      fuzzyMatch(artist, q) ||
      fuzzyMatch(song.slug || '', q)
    )
  })
}