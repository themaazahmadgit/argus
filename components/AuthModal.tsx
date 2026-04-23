'use client'
import { useState } from 'react'
import { useMapStore } from '@/stores/mapStore'
import { useAuth } from '@/lib/auth/AuthContext'
import { X } from 'lucide-react'

export default function AuthModal() {
  const { togglePanel } = useMapStore()
  const { signIn, signUp } = useAuth()
  const [tab, setTab] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    if (tab === 'signin') {
      const { error } = await signIn(email, password)
      if (error) setError(error)
      else togglePanel('authModal')
    } else {
      const { error } = await signUp(email, password, name)
      if (error) setError(error)
      else setSuccess('Check your email to confirm your account.')
    }
    setLoading(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', border: '1px solid #E2E8F0', borderRadius: 7, fontSize: 13,
    outline: 'none', background: '#F8F9FA', color: '#0F172A', transition: 'border-color 120ms',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={() => togglePanel('authModal')}
    >
      <div style={{ background: 'white', borderRadius: 12, width: '92vw', maxWidth: 400, boxShadow: '0 24px 64px rgba(0,0,0,0.2)', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>ARGUS</div>
            <div style={{ fontSize: 11, color: '#94A3B8' }}>by Weiss & Hirsch</div>
          </div>
          <button onClick={() => togglePanel('authModal')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={18} /></button>
        </div>

        <div style={{ padding: '20px 24px' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 2, marginBottom: 20, background: '#F1F3F5', borderRadius: 8, padding: 3 }}>
            {(['signin', 'signup'] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); setSuccess('') }}
                style={{ flex: 1, padding: '7px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: tab === t ? 'white' : 'transparent', color: tab === t ? '#0F172A' : '#94A3B8', boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all 120ms' }}
              >
                {t === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {success && <div style={{ padding: '10px 12px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 7, fontSize: 12, color: '#16A34A', marginBottom: 14 }}>{success}</div>}
          {error && <div style={{ padding: '10px 12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 7, fontSize: 12, color: '#DC2626', marginBottom: 14 }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {tab === 'signup' && (
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" style={inputStyle} required />
            )}
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Email address" style={inputStyle} required />
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Password" style={inputStyle} required />
            <button
              type="submit"
              disabled={loading}
              style={{ padding: '10px', background: loading ? '#93C5FD' : '#1D4ED8', color: 'white', border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 13, marginTop: 4 }}
            >
              {loading ? 'Working...' : tab === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div style={{ marginTop: 16, fontSize: 11, color: '#94A3B8', textAlign: 'center', lineHeight: 1.5 }}>
            {tab === 'signin' ? 'Sign in to save plots, workspace settings, and generate persistent intelligence briefs.' : 'Create your Weiss & Hirsch analyst account to access all platform features.'}
          </div>
        </div>
      </div>
    </div>
  )
}
