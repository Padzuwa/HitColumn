import { Link } from 'react-router-dom'

export default function About() {
  return (
    <div className="hc-container">
      <section className="hc-section" style={{ maxWidth: '900px', margin: '0 auto' }}>
        <span className="hc-eyebrow">About HitColumn</span>
        <h1 className="hc-display" style={{ marginTop: '0.5rem' }}>Where Hits Are Uploaded</h1>
        <p className="hc-muted" style={{ fontSize: '1.1rem', marginTop: '1rem' }}>
          HitColumn is a music platform built for artists — upcoming and established — 
          to upload, share, and monetize their sound. Fans can stream and download 
          free tracks from artists across Malawi, Africa, and beyond.
        </p>

        {/* Mission */}
        <div className="hc-card hc-card-pad" style={{ marginTop: '2.5rem' }}>
          <span className="hc-eyebrow">Our Mission</span>
          <h2 className="hc-section-title" style={{ marginTop: '0.5rem' }}>
            Give every artist a stage
          </h2>
          <p className="hc-muted">
            We believe talent should never be limited by geography or budget. 
            HitColumn gives emerging artists a free space to upload their first tracks, 
            reach new listeners, and grow — while established artists get a platform 
            to release and promote their catalog.
          </p>
        </div>

        {/* For Artists */}
        <div className="hc-grid hc-grid-2" style={{ marginTop: '2rem' }}>
          <div className="hc-card hc-card-pad">
            <i className="fas fa-microphone-alt" style={{ fontSize: '2rem', color: 'var(--hc-brand)' }}></i>
            <h3 className="hc-section-title" style={{ fontSize: '1.3rem', marginTop: '0.75rem' }}>For Artists</h3>
            <ul className="hc-checklist" style={{ marginTop: '1rem' }}>
              <li className="hc-check"><span className="hc-check-dot">✓</span> Upload your first 3 songs free</li>
              <li className="hc-check"><span className="hc-check-dot">✓</span> Add cover art and details</li>
              <li className="hc-check"><span className="hc-check-dot">✓</span> Get discovered by new fans</li>
              <li className="hc-check"><span className="hc-check-dot">✓</span> Track plays and downloads</li>
              <li className="hc-check"><span className="hc-check-dot">✓</span> Upgrade for more uploads</li>
            </ul>
            <Link to="/login" className="hc-btn hc-btn-primary" style={{ marginTop: '1.5rem' }}>
              <i className="fas fa-user-plus"></i> Create Artist Account
            </Link>
          </div>

          <div className="hc-card hc-card-pad">
            <i className="fas fa-headphones" style={{ fontSize: '2rem', color: 'var(--hc-brand)' }}></i>
            <h3 className="hc-section-title" style={{ fontSize: '1.3rem', marginTop: '0.75rem' }}>For Fans</h3>
            <ul className="hc-checklist" style={{ marginTop: '1rem' }}>
              <li className="hc-check"><span className="hc-check-dot">✓</span> Stream free tracks anytime</li>
              <li className="hc-check"><span className="hc-check-dot">✓</span> Download songs for offline listening</li>
              <li className="hc-check"><span className="hc-check-dot">✓</span> Discover new artists</li>
              <li className="hc-check"><span className="hc-check-dot">✓</span> Support artists directly</li>
              <li className="hc-check"><span className="hc-check-dot">✓</span> No account needed to listen</li>
            </ul>
            <Link to="/songs" className="hc-btn hc-btn-secondary" style={{ marginTop: '1.5rem' }}>
              <i className="fas fa-compact-disc"></i> Browse Songs
            </Link>
          </div>
        </div>

        {/* Behind HitColumn */}
        <div className="hc-card hc-card-pad" style={{ marginTop: '2rem' }}>
          <span className="hc-eyebrow">Behind HitColumn</span>
          <h2 className="hc-section-title" style={{ marginTop: '0.5rem' }}>
            Built by Peazy De Sun
          </h2>
          <p className="hc-muted">
            HitColumn is built and managed by <strong>Peazy De Sun</strong> — 
            Malawian Afrobeats artist, producer, sound engineer, and founder of 
            <strong> Lecto Holdings</strong>. Every part of the platform is crafted 
            with the interest for artists in mind, from the sound to the code.
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '1.5rem' }}>
            <a href="mailto:peazydesun@gmail.com" className="hc-btn hc-btn-secondary">
              <i className="fas fa-envelope"></i> Contact
            </a>
            <a href="https://wa.me/265992404606" target="_blank" rel="noopener noreferrer" className="hc-btn hc-btn-secondary">
              <i className="fab fa-whatsapp"></i> WhatsApp
            </a>
          </div>
        </div>

        {/* Mission tag */}
        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <p className="hc-eyebrow">Malawi → Africa → The World</p>
        </div>
      </section>
    </div>
  )
}