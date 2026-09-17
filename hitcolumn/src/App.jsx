import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useState, lazy, Suspense } from 'react'
import { supabase } from './supabaseClient'
import useThemes from './hooks/useThemes'
import Home from './pages/Home'
import Songs from './pages/Songs'
import Login from './pages/Login'
import Upload from './pages/Upload'
import About from './pages/About'
import Support from './pages/Support'
import Search from './pages/Search'
const Artist = lazy(() => import('./pages/Artist'))

import Genre from './pages/Genre'
import hitlogo from './img/hitlogo.png'

const Admin = lazy(() => import('./pages/Admin'))
const Subscription = lazy(() => import('./pages/Subscription'))
const SongDetail = lazy(() => import('./pages/SongDetail'))

export default function App() {
  const { theme, toggleTheme } = useThemes()
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [artist, setArtist] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    async function checkUser() {
      const { data: userData } = await supabase.auth.getUser()
      setUser(userData.user)

      if (userData.user) {
        const { data } = await supabase
          .from('artists')
          .select('artist_name, is_admin')
          .eq('id', userData.user.id)
          .single()
        setArtist(data)
        setIsAdmin(data?.is_admin === true)
      } else {
        setArtist(null)
        setIsAdmin(false)
      }
    }

    checkUser()

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      checkUser()
    })

    return () => authListener.subscription.unsubscribe()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
    setIsAdmin(false)
    setArtist(null)
    navigate('/')
  }

  return (
    <div className="hc-app">
      {/* ✅ SIDEBAR — closes before <main> */}
      <aside className="hc-sidebar">
        <NavLink to="/" className="hc-brand" end>
          <img src={hitlogo} alt="HitColumn" className="hc-brand-logo" />
        </NavLink>

     <nav className="hc-sidebar-nav">
  <NavLink to="/" end className="hc-sidebar-link">
    <i className="fas fa-compass"></i> Discover
  </NavLink>
  <NavLink to="/songs" className="hc-sidebar-link">
    <i className="fas fa-music"></i> Songs
  </NavLink>
  <NavLink to="/search" className="hc-sidebar-link">
    <i className="fas fa-search"></i> Search
  </NavLink>
  {user && (
    <NavLink to="/upload" className="hc-sidebar-link">
      <i className="fas fa-upload"></i> Upload
    </NavLink>
  )}
  {user && !isAdmin && (
    <NavLink to="/subscription" className="hc-sidebar-link">
      <i className="fas fa-crown"></i> Upgrade
    </NavLink>
  )}
  {isAdmin && (
    <NavLink to="/admin" className="hc-sidebar-link">
      <i className="fas fa-shield-halved"></i> Admin
    </NavLink>
  )}
  <NavLink to="/about" className="hc-sidebar-link hc-only-mobile">About</NavLink>
  <NavLink to="/support" className="hc-sidebar-link hc-only-mobile">Support</NavLink>
  {user ? (
    <button className="hc-sidebar-link" onClick={handleLogout}>
      <i className="fas fa-sign-out-alt"></i> Logout
    </button>
  ) : (
    <NavLink to="/login" className="hc-sidebar-link">
      <i className="fas fa-sign-in-alt"></i> Login
    </NavLink>
  )}
  <button className="hc-sidebar-link" onClick={toggleTheme}>
    <i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
    {theme === 'dark' ? ' Light Mode' : ' Dark Mode'}
  </button>
</nav>
      </aside>

      {/* ✅ MAIN — sibling of sidebar */}
      <main className="hc-main">
        <header className="hc-topbar">
          <div className="hc-topbar-left">
            <span className="hc-eyebrow">HitColumn</span>
            {user && artist && (
              <div className="hc-profile">
                <div className="hc-profile-avatar">
                  {artist.artist_name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="hc-profile-info">
                  <span className="hc-profile-name">{artist.artist_name}</span>
                  <span className="hc-profile-role">
                    {isAdmin ? 'Admin' : 'Artist'}
                  </span>
                </div>
              </div>
            )}
          </div>
          <nav className="hc-nav">
            <NavLink to="/about">About</NavLink>
            <NavLink to="/support">Support</NavLink>
          </nav>
        </header>

        <Suspense
          fallback={
            <div className="hc-loading-screen">
              <div className="hc-loader"></div>
              <p className="hc-muted">Loading...</p>
            </div>
          }
        >
          <Routes>
  <Route path="/" element={<Home />} />
  <Route path="/songs" element={<Songs />} />
  <Route path="/upload" element={<Upload />} />
  <Route path="/login" element={<Login />} />
  <Route path="/about" element={<About />} />
  <Route path="/support" element={<Support />} />
  <Route path="/subscription" element={<Subscription />} />
  <Route path="/admin" element={<Admin />} />
  <Route path="/song/:id" element={<SongDetail />} />
  <Route path="/search" element={<Search />} />
  <Route path="/genre/:slug" element={<Genre />} />
  <Route path="/artist/:id" element={<Artist />} />
</Routes>
        </Suspense>
      </main>
    </div>
  )
}