import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

const MAX_AUDIO_MB = 12
const MAX_COVER_MB = 2

function compressImage(file, maxSize = 800) {
  return new Promise((resolve) => {
    const img = new Image()
    const reader = new FileReader()

    reader.onload = (e) => {
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img

        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width)
          width = maxSize
        } else if (height > maxSize) {
          width = Math.round((width * maxSize) / height)
          height = maxSize
        }

        canvas.width = width
        canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => resolve(new File([blob], 'cover.jpg', { type: 'image/jpeg' })),
          'image/jpeg',
          0.78
        )
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

export default function Upload() {
  const [title, setTitle] = useState('')
  const [genre, setGenre] = useState('Afrobeat')
  const [artistNameOverride, setArtistNameOverride] = useState('')
  const [audioFile, setAudioFile] = useState(null)
  const [coverFile, setCoverFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [ownArtistName, setOwnArtistName] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    async function check() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        navigate('/login')
        return
      }

      const { data: artist } = await supabase
        .from('artists')
        .select('artist_name, is_admin')
        .eq('id', userData.user.id)
        .single()

      setOwnArtistName(artist?.artist_name || '')
      setIsAdmin(artist?.is_admin === true)
      setCheckingAuth(false)
    }
    check()
  }, [navigate])

  if (checkingAuth) {
    return (
      <div className="hc-loading-screen">
        <div className="hc-loader"></div>
        <p className="hc-muted">Checking access...</p>
      </div>
    )
  }

  async function handleUpload(e) {
    e.preventDefault()
    setUploading(true)
    setMessage('')
    setErrorMsg('')

    // Validate sizes
    if (!audioFile) {
      setErrorMsg('Please select an audio file.')
      setUploading(false)
      return
    }

    const audioMB = audioFile.size / (1024 * 1024)
    if (audioMB > MAX_AUDIO_MB) {
      setErrorMsg(
        `Audio is too large (${audioMB.toFixed(1)} MB). Max ${MAX_AUDIO_MB} MB. Please export as MP3.`
      )
      setUploading(false)
      return
    }

    if (coverFile) {
      const coverMB = coverFile.size / (1024 * 1024)
      if (coverMB > MAX_COVER_MB) {
        setErrorMsg(
          `Cover image is too large (${coverMB.toFixed(1)} MB). Max ${MAX_COVER_MB} MB.`
        )
        setUploading(false)
        return
      }
    }

    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
      setErrorMsg('Please log in first.')
      setUploading(false)
      return
    }

    const user = userData.user

    // ✅ Decide final artist name
    // Admins can override; regular artists use their own name
    const finalArtistName = isAdmin && artistNameOverride.trim()
      ? artistNameOverride.trim()
      : ownArtistName || 'Unknown Artist'

    // Check upload limit (skip for admins)
    if (!isAdmin) {
      const { data: limitData, error: limitError } = await supabase
        .from('upload_limits')
        .select('uploads_used, max_uploads')
        .eq('artist_id', user.id)
        .single()

      if (limitError || limitData.uploads_used >= limitData.max_uploads) {
        setErrorMsg('Upload limit reached. Contact admin to upgrade.')
        setUploading(false)
        return
      }
    }

    // Upload audio
    const audioName = `${user.id}/${Date.now()}-${audioFile.name}`
    const { data: audioData, error: audioError } = await supabase.storage
      .from('songs')
      .upload(audioName, audioFile)

    if (audioError) {
      setErrorMsg('Audio upload failed: ' + audioError.message)
      setUploading(false)
      return
    }

    // Compress + upload cover
    let coverUrl = null
    if (coverFile) {
      try {
        const compressed = await compressImage(coverFile)
        const coverName = `${user.id}/${Date.now()}-cover.jpg`
        const { data: coverData, error: coverError } = await supabase.storage
          .from('songs')
          .upload(coverName, compressed)

        if (!coverError) {
          coverUrl = supabase.storage.from('songs').getPublicUrl(coverData.path).data.publicUrl
        }
      } catch (err) {
        console.error('Cover compression failed:', err)
      }
    }

    const audioUrl = supabase.storage
      .from('songs')
      .getPublicUrl(audioData.path).data.publicUrl

    // Slug
    const slugBase = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    const uniqueSlug = `${slugBase}-${Date.now().toString(36).slice(-6)}`

    // ✅ Insert with the correct artist name
    const { error: insertError } = await supabase.from('songs').insert({
      artist_id: user.id,          // still links to the uploader
      artist_name: finalArtistName, // ✅ what shows on the card
      title,
      genre,
      audio_url: audioUrl,
      cover_url: coverUrl,
      status: 'approved',
      slug: uniqueSlug
    })

    if (insertError) {
      setErrorMsg('Failed to save song: ' + insertError.message)
    } else {
      // Only bump upload counter for non-admins
      if (!isAdmin) {
        const { data: limitData } = await supabase
          .from('upload_limits')
          .select('uploads_used')
          .eq('artist_id', user.id)
          .single()

        await supabase
          .from('upload_limits')
          .update({ uploads_used: (limitData?.uploads_used || 0) + 1 })
          .eq('artist_id', user.id)
      }

      setMessage(
        isAdmin
          ? `Song uploaded as "${finalArtistName}".`
          : 'Song uploaded successfully!'
      )
      setTitle('')
      setGenre('Afrobeat')
      setArtistNameOverride('')
      setAudioFile(null)
      setCoverFile(null)
    }

    setUploading(false)
  }

  return (
    <div className="hc-container">
      <section className="hc-section" style={{ maxWidth: '680px' }}>
        <h1 className="hc-section-title">Upload Song</h1>
        <p className="hc-muted">
          {isAdmin
            ? 'Admin mode — you can upload on behalf of any artist. No upload limit applies.'
            : 'You get 3 free uploads. Use them wisely.'}
        </p>

        {message && (
          <div className="hc-badge hc-badge-success" style={{ marginTop: '1rem' }}>
            {message}
          </div>
        )}
        {errorMsg && (
          <div className="hc-badge hc-badge-live" style={{ marginTop: '1rem' }}>
            {errorMsg}
          </div>
        )}

        <form
          onSubmit={handleUpload}
          className="hc-card hc-card-pad"
          style={{ marginTop: '1.5rem' }}
        >
          <div className="hc-form-grid">
            <div className="hc-field hc-field-full">
              <label className="hc-label">Song Title</label>
              <input
                className="hc-input"
                type="text"
                placeholder="Enter song title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* ✅ Admin-only artist name override */}
            {isAdmin && (
              <div className="hc-field hc-field-full">
                <label className="hc-label">
                  Artist Name{' '}
                  <span className="hc-small hc-muted">
                    (admin only — leave blank to use your own name: {ownArtistName})
                  </span>
                </label>
                <input
                  className="hc-input"
                  type="text"
                  placeholder={`e.g. John Leackson — blank = ${ownArtistName || 'your name'}`}
                  value={artistNameOverride}
                  onChange={(e) => setArtistNameOverride(e.target.value)}
                />
              </div>
            )}

            <div className="hc-field hc-field-full">
              <label className="hc-label">Genre</label>
              <select
                className="hc-select"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
              >
                <option>Afrobeat</option>
                <option>Dancehall</option>
                <option>Amapiano</option>
                <option>Trap</option>
                <option>RnB</option>
                <option>Other</option>
              </select>
            </div>

            <div className="hc-field hc-field-full">
              <label className="hc-label">Audio File (MP3)</label>
              <input
                key={uploading ? 'uploading' : 'idle'}
                className="hc-input"
                type="file"
                accept="audio/mpeg,audio/mp3,audio/*"
                onChange={(e) => setAudioFile(e.target.files[0])}
                required
              />
              <p className="hc-small hc-muted" style={{ marginTop: '4px' }}>
                Max {MAX_AUDIO_MB} MB. Export as MP3 (not WAV).
              </p>
            </div>

            <div className="hc-field hc-field-full">
              <label className="hc-label">Cover Art (optional)</label>
              <input
                key={uploading ? 'uploading-cover' : 'idle-cover'}
                className="hc-input"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/*"
                onChange={(e) => setCoverFile(e.target.files[0])}
              />
              <p className="hc-small hc-muted" style={{ marginTop: '4px' }}>
                JPG or PNG, max {MAX_COVER_MB} MB. Auto-compressed on upload.
              </p>
            </div>
          </div>

          <button
            type="submit"
            className="hc-btn hc-btn-primary"
            disabled={uploading}
            style={{ marginTop: '1.5rem' }}
          >
            {uploading ? 'Uploading...' : 'Upload Song'}
          </button>
        </form>
      </section>

      <footer className="hc-footer">
        <div className="hc-footer-content">
          <h3 className="hc-section-title" style={{ fontSize: '1.4rem' }}>
            Contact HitColumn
          </h3>
          <p className="hc-muted">For business inquiries, support, or partnerships.</p>
          <div className="hc-footer-links">
            <a href="mailto:peazydesun@gmail.com" className="hc-btn hc-btn-secondary">
              <i className="fas fa-envelope"></i> peazydesun@gmail.com
            </a>
            <a href="tel:+265992404606" className="hc-btn hc-btn-secondary">
              <i className="fas fa-phone"></i> +265 992 404 606
            </a>
            <a
              href="https://wa.me/265992404606"
              target="_blank"
              rel="noopener noreferrer"
              className="hc-btn hc-btn-secondary"
            >
              <i className="fab fa-whatsapp"></i> WhatsApp
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}