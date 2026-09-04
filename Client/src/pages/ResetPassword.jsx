import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Wachtwoorden komen niet overeen.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error ?? 'Er ging iets mis.');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center bg-brand-lightest">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-brand-muted/30 w-full max-w-md ml-12">
          <p className="text-red-600">Ongeldige of ontbrekende reset-link.</p>
          <p className="text-slate-500 text-sm mt-2">
            Vraag een beheerder om een nieuwe reset-link te genereren via het server-script.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center bg-brand-lightest">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-brand-muted/30 w-full max-w-md ml-12">
        <h1 className="text-2xl font-semibold text-slate-800 mb-6">Nieuw wachtwoord instellen</h1>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg mb-4 text-sm">
            Wachtwoord gewijzigd! Je wordt doorgestuurd naar de login-pagina...
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Nieuw wachtwoord</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-3 py-2 rounded-lg bg-white text-slate-800 border border-brand-muted focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-600 mb-1">Bevestig wachtwoord</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-3 py-2 rounded-lg bg-white text-slate-800 border border-brand-muted focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-medium py-2 rounded-lg transition"
            >
              {loading ? 'Bezig...' : 'Wachtwoord wijzigen'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
