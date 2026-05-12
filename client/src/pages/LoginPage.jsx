import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { login } from '../api/auth.api'

export default function LoginPage() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(email, password)
      signIn(data.token, data.user)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error ?? 'Identifiants incorrects')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-[45%] bg-dark flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              #b8860b 0px, #b8860b 1px,
              transparent 1px, transparent 40px
            )`,
          }}
        />

        <div className="relative">
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-2xl text-white tracking-wide">PLM</span>
            <span className="text-white/30 text-xs tracking-widest uppercase">Fashion</span>
          </div>
        </div>

        <div className="relative">
          <div className="w-10 h-0.5 bg-gold mb-8" />
          <h1 className="font-serif text-[2.75rem] text-white leading-[1.15] mb-6">
            Pilotez vos<br />
            collections<br />
            <span className="text-gold italic">avec précision.</span>
          </h1>
          <p className="text-white/40 text-sm leading-relaxed max-w-xs">
            Gestion de cycle de vie produit pour les marques de mode et maroquinerie.
            Du concept au showroom.
          </p>

          <div className="flex gap-6 mt-10">
            {[
              { n: '360°', label: 'Vision produit' },
              { n: 'Live', label: 'Costing temps réel' },
              { n: 'Multi', label: 'Rôles collaboratifs' },
            ].map(({ n, label }) => (
              <div key={label}>
                <p className="font-serif text-xl text-gold">{n}</p>
                <p className="text-white/30 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-white/20 text-xs">PLM Fashion © 2026</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center bg-cream px-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-10 flex items-baseline gap-2">
            <span className="font-serif text-2xl text-dark tracking-wide">PLM</span>
            <span className="text-dark/30 text-xs tracking-widest uppercase">Fashion</span>
          </div>

          <div className="mb-8">
            <h2 className="font-serif text-3xl text-dark mb-2">Connexion</h2>
            <p className="text-dark/40 text-sm">Bienvenue. Entrez vos identifiants.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Adresse email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
                className="input-field"
                placeholder="admin@plm-fashion.com"
              />
            </div>

            <div>
              <label className="label">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="input-field"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-xs tracking-widest uppercase"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Connexion en cours…
                </span>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
