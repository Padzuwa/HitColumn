import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import useThemes from './hooks/useThemes'
import Home from './pages/Home'
import Songs from './pages/Songs'
import Login from './pages/Login'
import Upload from './pages/Upload'
import About from './pages/About'
import Support from './pages/Support'
import hitlogo from './img/hitlogo.png'


export default function App() {
  const { theme, toggleTheme } = useThemes()
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => authListener.subscription.unsubscribe()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
    navigate('/')
  }

  return (
    <div className="hc-app">
      <aside className="hc-sidebar">
        <NavLink to="/" className="hc-brand" end>
          <img src={hitlogo} alt="HitColumn" className="hc-brand-logo" />
        </NavLink>

        <nav className="hc-sidebar-nav">
          <NavLink to="/" end className="hc-sidebar-link">Discover</NavLink>
          <NavLink to="/songs" className="hc-sidebar-link">Songs</NavLink>
          {user && <NavLink to="/upload" className="hc-sidebar-link">Upload</NavLink>}
          {user ? (
            <button className="hc-sidebar-link" onClick={handleLogout}>Logout</button>
          ) : (
            <NavLink to="/login" className="hc-sidebar-link">Login</NavLink>
          )}
          <button className="hc-sidebar-link" onClick={toggleTheme}>
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        </nav>
      </aside>

      <main className="hc-main">
        <header className="hc-topbar">
          <span className="hc-eyebrow">HitColumn</span>
          <nav className="hc-nav">
            <NavLink to="/songs">Songs</NavLink>
            <NavLink to="/about" className="hc-sidebar-link">About</NavLink>
            <NavLink to="/support" className="hc-sidebar-link">Support</NavLink>
          </nav>
        </header>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/songs" element={<Songs />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/login" element={<Login />} />
          <Route path="/about" element={<About />} />
          <Route path="/support" element={<Support />} />
        </Routes>
      </main>
    </div>
  )
}