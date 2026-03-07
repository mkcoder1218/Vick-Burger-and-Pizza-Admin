import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import { User } from '../../types';
import Button from '../ui/Button';
import { buildUserFromToken, getErrorMessage, login, normalizeUser, setToken } from '../../swr';

export default function AdminLogin({ onLogin }: { onLogin: (user: User) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!email.trim() || !password.trim()) {
        setError('Email and password are required.');
        return;
      }

      const res = await login({ email: email.trim(), password });
      const token = res?.data?.token;
      if (!token) {
        setError('Invalid login response.');
        return;
      }

      setToken(token);

      if (res?.data?.user) {
        onLogin(normalizeUser(res.data.user) as User);
        return;
      }

      const user = buildUserFromToken(token, email.trim());
      if (!user) {
        setError('Unable to read login session.');
        return;
      }

      onLogin(user as User);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-burger-cream flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md p-12 rounded-[3rem] shadow-2xl shadow-burger-black/5 border border-burger-black/5">
        <div className="text-center mb-10">
          <div className="w-24 h-24 bg-burger-black rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-burger-black/20 rotate-3">
            <Settings size={48} className="text-burger-orange" />
          </div>
          <h1 className="font-black text-4xl text-burger-black uppercase tracking-tighter">Admin Portal</h1>
          <p className="text-burger-black/40 text-[10px] uppercase tracking-[0.3em] font-black mt-3">Management and Operations</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="name@company.com"
              className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange"
            />
          </div>

          {error && (
            <div className="px-4 py-3 rounded-2xl bg-red-50 text-red-600 text-xs font-bold">
              {error}
            </div>
          )}

          <Button type="submit" variant="gold" className="w-full" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>
      </div>
    </div>
  );
}
