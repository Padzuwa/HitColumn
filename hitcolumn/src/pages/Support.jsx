import { useState } from 'react'
import { supabase } from '../supabaseClient'
import emailjs from '@emailjs/browser'

const EMAILJS_SERVICE_ID = 'service_2dar1yp'
const EMAILJS_TEMPLATE_ID = 'template_mmij4wo'
const EMAILJS_PUBLIC_KEY = 'FVnaUuhcXykfbcyXH'

export default function Support() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('General')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setSuccess('')
    setErrorMsg('')

    try {
      const { error } = await supabase.from('support_messages').insert({
        name,
        email,
        subject,
        message
      })
      if (error) throw error

      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        { name, email, subject, message },
        EMAILJS_PUBLIC_KEY
      )

      setSuccess('Message sent! We will get back to you soon.')
      setName('')
      setEmail('')
      setSubject('General')
      setMessage('')
    } catch (err) {
      setErrorMsg('Failed to send message: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="hc-container">
      <section className="hc-section" style={{ maxWidth: '900px', margin: '0 auto' }}>
        <span className="hc-eyebrow">Support</span>
        <h1 className="hc-display" style={{ marginTop: '0.5rem' }}>How can we help?</h1>
        <p className="hc-muted" style={{ fontSize: '1.05rem', marginTop: '1rem' }}>
          Find answers below, or send us a message. We usually reply within 24 hours.
        </p>

        <div className="hc-card hc-card-pad" style={{ marginTop: '2rem' }}>
          <h2 className="hc-section-title" style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>
            Frequently Asked Questions
          </h2>

          <div className="hc-faq">
            <details>
              <summary>How many songs can I upload for free?</summary>
              <p>Every new artist gets <strong>3 free uploads</strong>. After that, you can upgrade to upload more.</p>
            </details>
            <details>
              <summary>What file formats do you accept?</summary>
              <p>MP3 for audio. For cover art, JPG, PNG, or WEBP.</p>
            </details>
            <details>
              <summary>Can fans download songs?</summary>
              <p>Yes. All approved songs have a download button next to the player.</p>
            </details>
            <details>
              <summary>How do I delete my song?</summary>
              <p>Contact us via the form below with your song title and artist name.</p>
            </details>
            <details>
              <summary>My upload failed. What now?</summary>
              <p>Check your file size and internet connection. If it still fails, send us a message below.</p>
            </details>
            <details>
              <summary>I need to report copyright content</summary>
              <p>Send us a message with the song title, artist, and proof of ownership. We act fast.</p>
            </details>
          </div>
        </div>

        <div className="hc-card hc-card-pad" style={{ marginTop: '2rem' }}>
          <h2 className="hc-section-title" style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>
            Send us a message
          </h2>

          {success && (
            <div className="hc-badge hc-badge-success" style={{ marginBottom: '1rem' }}>
              {success}
            </div>
          )}
          {errorMsg && (
            <div className="hc-badge hc-badge-live" style={{ marginBottom: '1rem' }}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="hc-form-grid">
            <div className="hc-field">
              <label className="hc-label">Your Name</label>
              <input
                className="hc-input"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="hc-field">
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

            <div className="hc-field hc-field-full">
              <label className="hc-label">Subject</label>
              <select
                className="hc-select"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              >
                <option>General</option>
                <option>Upload problem</option>
                <option>Account issue</option>
                <option>Payment / upgrade</option>
                <option>Report content</option>
                <option>Partnership</option>
              </select>
            </div>

            <div className="hc-field hc-field-full">
              <label className="hc-label">Message</label>
              <textarea
                className="hc-textarea"
                placeholder="Describe your issue or question..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>

            <div className="hc-field hc-field-full">
              <button
                type="submit"
                className="hc-btn hc-btn-primary"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </form>
        </div>

        <div className="hc-card hc-card-pad" style={{ marginTop: '2rem', textAlign: 'center' }}>
          <h2 className="hc-section-title" style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>
            Or reach us directly
          </h2>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '1rem' }}>
            <a href="mailto:peazydesun@gmail.com" className="hc-btn hc-btn-secondary">
              <i className="fas fa-envelope"></i> peazydesun@gmail.com
            </a>
            <a href="tel:+265992404606" className="hc-btn hc-btn-secondary">
              <i className="fas fa-phone"></i> +265 992 404 606
            </a>
            <a href="https://wa.me/265992404606" target="_blank" rel="noopener noreferrer" className="hc-btn hc-btn-secondary">
              <i className="fab fa-whatsapp"></i> WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}