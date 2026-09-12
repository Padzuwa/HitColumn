import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [artistName, setArtistName] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error

        if (data.user) {
          const { error: artistError } = await supabase.from('artists').insert({
            id: data.user.id,
            artist_name: artistName
          })
          if (artistError) throw artistError

          const { error: limitError } = await supabase.from('upload_limits').insert({
            artist_id: data.user.id,
            uploads_used: 0,
            max_uploads: 3
          })
          if (limitError) throw limitError

          setSuccessMsg('Account created! You can now log in.')
          setIsSignUp(false)
          setEmail('')
          setPassword('')
          setArtistName('')
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        navigate('/songs')
      }
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="hc-container">
      <section className="hc-section" style={{ maxWidth: '520px' }}>
        <h1 className="hc-section-title">{isSignUp ? 'Create Artist Account' : 'Artist Login'}</h1>
        <p className="hc-muted">First 3 uploads are free on HitColumn.</p>

        {errorMsg && (
          <div className="hc-badge hc-badge-live" style={{ marginTop: '1rem' }}>
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="hc-badge hc-badge-success" style={{ marginTop: '1rem' }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="hc-card hc-card-pad" style={{ marginTop: '1.5rem' }}>
          {isSignUp && (
            <div className="hc-field" style={{ marginBottom: '1rem' }}>
              <label className="hc-label">Artist Name</label>
              <input
                className="hc-input"
                type="text"
                placeholder="Your artist name"
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="hc-field" style={{ marginBottom: '1rem' }}>
            <label className="hc-label">Email</label>
            <input
              className="hc-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="hc-field" style={{ marginBottom: '1.5rem' }}>
            <label className="hc-label">Password</label>
            <input
              className="hc-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="hc-btn hc-btn-primary" disabled={loading}>
            {loading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Login'}
          </button>
        </form>

        <button
          className="hc-btn hc-btn-ghost"
          style={{ marginTop: '1rem' }}
          onClick={() => setIsSignUp(!isSignUp)}
        >
          {isSignUp ? 'Already have an account? Login' : 'New artist? Sign up free'}
        </button>
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
      <a href="https://wa.me/265992404606" target="_blank" className="hc-btn hc-btn-secondary">
        <i className="fab fa-whatsapp"></i> WhatsApp
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