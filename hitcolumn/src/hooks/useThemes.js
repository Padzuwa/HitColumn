import { useState, useEffect } from 'react'

export default function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem('hc-theme') || 'dark')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('hc-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')

  return { theme, toggleTheme }
}