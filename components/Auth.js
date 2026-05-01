import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Auth() {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccessMsg('')

    if (!username.trim()) {
      setError('Username is required.')
      setLoading(false)
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: username.trim() },
      },
    })

    if (error) {
      setError(error.message)
    } else if (data.user) {
      // Insert user profile
      const { error: profileError } = await supabase.from('users').upsert({
        id: data.user.id,
        email: data.user.email,
        username: username.trim(),
        is_online: false,
      })
      if (profileError) {
        setError(profileError.message)
      } else {
        setSuccessMsg('Account created! Check your email to confirm, then log in.')
        setMode('login')
      }
    }
    setLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="neon-bg" />
      <div className="auth-card" style={{ position: 'relative', zIndex: 1 }}>
        <div className="auth-logo">
          <div className="auth-logo-mark">N</div>
          <div>
            <div className="auth-logo-text">
              Ne<span className="highlight">W</span> Chat
            </div>
            <div className="auth-logo-brand">BY NEW STUDIOS</div>
          </div>
        </div>

        <h1 className="auth-title">
          {mode === 'login' ? 'Bentornato 👋' : 'Crea account'}
        </h1>
        <p className="auth-subtitle">
          {mode === 'login'
            ? 'Accedi per continuare a chattare in tempo reale.'
            : 'Registrati per iniziare a comunicare.'}
        </p>

        {error && <div className="auth-error">{error}</div>}
        {successMsg && (
          <div
            className="auth-error"
            style={{
              background: 'rgba(0,255,204,0.1)',
              borderColor: 'rgba(0,255,204,0.3)',
              color: 'var(--accent-secondary)',
            }}
          >
            {successMsg}
          </div>
        )}

        <form onSubmit={mode === 'login' ? handleLogin : handleSignup}>
          {mode === 'signup' && (
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                className="form-input"
                type="text"
                placeholder="il_tuo_nome"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span className="spinner" /> {mode === 'login' ? 'Accesso...' : 'Registrazione...'}
              </span>
            ) : mode === 'login' ? 'Accedi' : 'Crea account'}
          </button>
        </form>

        <div className="auth-divider">o</div>

        <div className="auth-switch">
          {mode === 'login' ? (
            <>Non hai un account?{' '}
              <button type="button" onClick={() => { setMode('signup'); setError(''); setSuccessMsg('') }}>
                Registrati
              </button>
            </>
          ) : (
            <>Hai già un account?{' '}
              <button type="button" onClick={() => { setMode('login'); setError(''); setSuccessMsg('') }}>
                Accedi
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
