import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Upload() {
  const [title, setTitle] = useState('')
  const [genre, setGenre] = useState('Afrobeat')
  const [audioFile, setAudioFile] = useState(null)
  const [coverFile, setCoverFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [checkingAuth, setCheckingAuth] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        navigate('/login')
      } else {
        setCheckingAuth(false)
      }
    })
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

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    setErrorMsg('Please log in first.')
    setUploading(false)
    return
  }

  const user = userData.user

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

  const audioName = `${user.id}/${Date.now()}-${audioFile.name}`
  const { data: audioData, error: audioError } = await supabase.storage
    .from('songs')
    .upload(audioName, audioFile)

  if (audioError) {
    setErrorMsg('Audio upload failed: ' + audioError.message)
    setUploading(false)
    return
  }

  let coverUrl = null
  if (coverFile) {
    const coverName = `${user.id}/${Date.now()}-${coverFile.name}`
    const { data: coverData, error: coverError } = await supabase.storage
      .from('songs')
      .upload(coverName, coverFile)
    if (!coverError) {
      coverUrl = supabase.storage.from('songs').getPublicUrl(coverData.path).data.publicUrl
    }
  }

  const audioUrl = supabase.storage.from('songs').getPublicUrl(audioData.path).data.publicUrl

  // ✅ Generate slug from title
  const slugBase = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const uniqueSlug = `${slugBase}-${Date.now().toString(36).slice(-6)}`

  const { error: insertError } = await supabase.from('songs').insert({
    artist_id: user.id,
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
    await supabase
      .from('upload_limits')
      .update({ uploads_used: limitData.uploads_used + 1 })
      .eq('artist_id', user.id)

    setMessage('Song uploaded successfully!')
    setTitle('')
    setGenre('Afrobeat')
    setAudioFile(null)
    setCoverFile(null)
  }
  setUploading(false)
}

  return (
    <div className="hc-container">
      <section className="hc-section" style={{ maxWidth: '680px' }}>
        <h1 className="hc-section-title">Upload Song</h1>
        <p className="hc-muted">You get 3 free uploads. Use them wisely.</p>

        {message && <div className="hc-badge hc-badge-success" style={{ marginTop: '1rem' }}>{message}</div>}
        {errorMsg && <div className="hc-badge hc-badge-live" style={{ marginTop: '1rem' }}>{errorMsg}</div>}

        <form onSubmit={handleUpload} className="hc-card hc-card-pad" style={{ marginTop: '1.5rem' }}>
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

            <div className="hc-field">
              <label className="hc-label">Genre</label>
              <select className="hc-select" value={genre} onChange={(e) => setGenre(e.target.value)}>
                <option>Afrobeat</option>
                <option>Dancehall</option>
                <option>Amapiano</option>
                <option>Trap</option>
                <option>RnB</option>
                <option>Other</option>
              </select>
            </div>

            <div className="hc-field">
              <label className="hc-label">Audio File (MP3)</label>
              <p className="hc-small hc-muted" style={{ marginTop: '4px' }}>
  Max 20 MB. MP3 or WAV.
</p>
              
              <input
  key={uploading ? 'uploading' : 'idle'}
  className="hc-input"
  type="file"
  accept="audio/*"
  onChange={(e) => setAudioFile(e.target.files[0])}
  required
    />
            </div>

            <div className="hc-field hc-field-full">
              <label className="hc-label">Cover Art (optional)</label>
              <input
                className="hc-input"
                type="file"
                accept="image/*"
                onChange={(e) => setCoverFile(e.target.files[0])}
              />
            </div>
          </div>

          <button type="submit" className="hc-btn hc-btn-primary" disabled={uploading} style={{ marginTop: '1.5rem' }}>
            {uploading ? 'Uploading...' : 'Upload Song'}
          </button>
        </form>
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
      <a
     href="https://wa.me/265992404606"
    target="_blank"
       rel="noopener noreferrer"
       className="hc-btn hc-btn-secondary"
        >
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