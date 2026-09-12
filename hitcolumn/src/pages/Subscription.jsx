import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 1500,
    uploads: 1,
    features: ['1 extra upload', 'Standard placement']
  },
  {
    id: 'creator',
    name: 'Creator',
    price: 3000,
    uploads: 3,
    features: ['3 extra uploads', 'Priority review', 'Play & download analytics']
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 5000,
    uploads: 5,
    features: ['5 extra uploads', 'Featured in Latest Uploads', 'Verified badge']
  },
  {
    id: 'studio',
    name: 'Studio',
    price: 12000,
    uploads: 15,
    features: ['15 extra uploads', 'Featured on homepage', 'Direct WhatsApp support', 'Promoted on socials']
  }
]

export default function Subscription() {
  const [user, setUser] = useState(null)
  const [limit, setLimit] = useState(null)
  const [message, setMessage] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [selectedPlan, setSelectedPlan] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        navigate('/login')
        return
      }
      setUser(userData.user)

      const { data } = await supabase
        .from('upload_limits')
        .select('*')
        .eq('artist_id', userData.user.id)
        .single()
      setLimit(data)
    }
    load()
  }, [navigate])

  async function requestUpgrade(plan) {
    setMessage('')
    setErrorMsg('')
    setSelectedPlan(plan)

    const { error } = await supabase.from('subscriptions').insert({
      artist_id: user.id,
      plan: plan.id,
      amount_mwk: plan.price,
      status: 'pending'
    })

    if (error) {
      setErrorMsg('Could not save request: ' + error.message)
    } else {
      setMessage(`Upgrade to ${plan.name} requested. Send payment and contact us to activate.`)
    }
  }

  if (!limit) {
    return (
      <div className="hc-loading-screen">
        <div className="hc-loader"></div>
        <p className="hc-muted">Loading plan...</p>
      </div>
    )
  }

  const remainingUploads = Math.max(limit.max_uploads - limit.uploads_used, 0)

  return (
    <div className="hc-container">
      <section className="hc-section" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <span className="hc-eyebrow">Subscription</span>
        <h1 className="hc-display" style={{ marginTop: '0.5rem' }}>Upgrade Your Account</h1>

        <p className="hc-muted" style={{ fontSize: '1.05rem', marginTop: '1rem' }}>
          You have used <strong>{limit.uploads_used}</strong> of <strong>{limit.max_uploads}</strong> uploads.
          {' '}You have <strong>{remainingUploads}</strong> remaining on the{' '}
          <strong>{limit.plan || 'free'}</strong> plan.
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

        <div className="hc-plans">
          {PLANS.map((plan) => {
            const isFeatured = plan.id === 'pro'
            const isCurrent = limit.plan === plan.id

            const iconClass =
              plan.id === 'starter' ? 'fas fa-seedling'
              : plan.id === 'creator' ? 'fas fa-microphone-alt'
              : plan.id === 'pro' ? 'fas fa-bolt'
              : 'fas fa-crown'

            return (
              <div
                key={plan.id}
                className={`hc-plan ${isFeatured ? 'is-featured' : ''}`}
              >
                <div className="hc-plan-icon">
                  <i className={iconClass}></i>
                </div>

                <h3 className="hc-plan-name">{plan.name}</h3>
                <p className="hc-plan-subtitle">
                  {plan.uploads} extra upload{plan.uploads > 1 ? 's' : ''}
                </p>

                <div className="hc-plan-price">
                  MWK {plan.price.toLocaleString()}
                  <small>one-time</small>
                </div>

                <div className="hc-plan-divider"></div>

                <ul className="hc-plan-features">
                  {plan.features.map((f) => (
                    <li key={f}>
                      <i className="fas fa-check"></i> {f}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <button className="hc-btn hc-btn-secondary hc-plan-cta" disabled>
                    Current Plan
                  </button>
                ) : (
                  <button
                    className={`hc-btn ${isFeatured ? 'hc-btn-primary' : 'hc-btn-secondary'} hc-plan-cta`}
                    onClick={() => requestUpgrade(plan)}
                  >
                    Request Upgrade
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {selectedPlan && (
          <div className="hc-card hc-card-pad" style={{ marginTop: '2rem' }}>
            <h3 className="hc-section-title" style={{ fontSize: '1.2rem' }}>
              How to pay
            </h3>
            <ol style={{ paddingLeft: '1.2rem', color: 'var(--hc-text-muted)', lineHeight: 1.8 }}>
              <li>
                Send <strong>MWK {selectedPlan.price.toLocaleString()}</strong> via Airtel Money or TNM Mpamba
                to <strong>+265 992 404 606</strong>.
             <br /> OR <br />
                Send <strong>MWK {selectedPlan.price.toLocaleString()}</strong> via National Bank or any other bank transfer
                to <strong>NB Account Number : 1012-1983-12</strong>.
              </li>
              <li>Send proof of payment to the same number on WhatsApp.</li>
              <li>We will activate <strong>{selectedPlan.name}</strong> within 24 hours.</li>
            </ol>
            <a
              href={`https://wa.me/265992404606?text=Payment%20for%20${encodeURIComponent(selectedPlan.name)}%20plan%20(MWK%20${selectedPlan.price})`}
              target="_blank"
              rel="noopener noreferrer"
              className="hc-btn hc-btn-primary"
              style={{ marginTop: '1rem' }}
            >
              <i className="fab fa-whatsapp"></i> Contact via WhatsApp
            </a>
          </div>
        )}

        <p className="hc-muted" style={{ marginTop: '2rem' }}>
          Questions? Visit our{' '}
          <Link to="/support" style={{ color: 'var(--hc-brand)' }}>
            Support page
          </Link>.
        </p>
      </section>
    </div>
  )
}