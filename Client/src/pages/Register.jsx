import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/register', { name, email, password });
      login(res.d
    } catch (err) {ata.user, res.data.token);
      navigate('/dashboard');
      setError(err.response?.data?.error ?? 'Er ging iets mis bij het registreren.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center bg-bg">
      <div className="bg-card p-8 rounded-2xl shadow-[var(--shadow-border)] border border-brand-muted/30 w-full max-w-md ml-12">
        <h1 className="text-2xl font-semibold text-fg mb-6">Account aanmaken</h1>

        {error && (
          <div className="bg-destructive/10 border border-destructive/40 text-destructive px-4 py-2 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-fg-muted mb-1">Naam</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg bg-card text-fg border border-brand-muted focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
            />
          </div>

          <div>
            <label className="block text-sm text-fg-muted mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg bg-card text-fg border border-brand-muted focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
            />
          </div>

          <div>
            <label className="block text-sm text-fg-muted mb-1">Wachtwoord</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-3 py-2 rounded-lg bg-card text-fg border border-brand-muted focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
            />
            <p className="text-xs text-fg-subtle mt-1">Minstens 8 karakters</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="cursor-pointer w-full bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-medium py-2 rounded-lg transition"
          >
            {loading ? 'Bezig...' : 'Registreren'}
          </button>
        </form>

        <p className="text-fg-subtle text-sm mt-4 text-center">
          Al een account? <Link to="/login" className="text-brand hover:underline">Log hier in</Link>
        </p>
      </div>
    </div>
  );
}
