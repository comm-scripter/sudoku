import { useState, useEffect } from 'react'

const DEFAULTS = {
  difficulty: 'easy',
  highlightErrors: true,
  highContrast: false,
}

function load() {
  try {
    const raw = localStorage.getItem('sudoku-settings')
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS }
  } catch {
    return { ...DEFAULTS }
  }
}

export function useSettings() {
  const [settings, setSettings] = useState(load)

  // Persist to localStorage on every change
  useEffect(() => {
    try { localStorage.setItem('sudoku-settings', JSON.stringify(settings)) } catch {}
  }, [settings])

  // Apply / remove high-contrast CSS class on the document root
  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', settings.highContrast)
  }, [settings.highContrast])

  const update = (key, value) => setSettings(prev => ({ ...prev, [key]: value }))

  return { settings, update }
}
