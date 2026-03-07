import React, { useState } from 'react';
import { User } from '../../types';
import { buildUrl, getToken, normalizeUser, updateMe } from '../../swr';
import Button from '../ui/Button';

export default function Profile({ user, onUpdated }: { user: User; onUpdated: (user: User) => void }) {
  const [name, setName] = useState(user.name || '');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const uploadProfile = async () => {
    if (!file) return undefined;
    const token = getToken();
    const form = new FormData();
    form.append('file', file);

    const res = await fetch(buildUrl('/api/files'), {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.message || 'Upload failed');
    }

    return data?.data?.id as string | undefined;
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const profileFileId = await uploadProfile();
      const res = await updateMe({
        name: name.trim() || undefined,
        ...(profileFileId ? { profileFileId } : {}),
      });

      const updated = normalizeUser((res as any).data) as User;
      onUpdated(updated);
      setFile(null);
      setPreview(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-sm">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-20 h-20 rounded-3xl bg-zinc-100 overflow-hidden flex items-center justify-center">
            {preview ? (
              <img src={preview} className="w-full h-full object-cover" alt="profile" />
            ) : user.profileFileId ? (
              <img src={buildUrl(`/uploads/${user.profileFileId}`)}  className="w-full h-full object-cover" alt="profile" />
            ) : (
              <span className="text-xl font-black text-zinc-400">{user.name?.charAt(0) || 'U'}</span>
            )}
          </div>
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tight">Profile</h3>
            <p className="text-sm text-zinc-500">Personal information</p>
          </div>
        </div>

        <form className="space-y-6" onSubmit={saveProfile}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Name</p>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mt-2 px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange"
              />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Email</p>
              <p className="text-lg font-bold mt-2">{user.email}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Role</p>
              <p className="text-lg font-bold mt-2">{user.role.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Business ID</p>
              <p className="text-sm font-mono break-all mt-2">{user.businessId ?? '—'}</p>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Profile Photo</p>
            <label className="mt-2 block border-2 border-dashed border-burger-black/10 rounded-2xl p-4 cursor-pointer hover:border-burger-orange transition">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setFile(f);
                  setPreview(f ? URL.createObjectURL(f) : null);
                }}
              />
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-zinc-100 overflow-hidden flex items-center justify-center">
                  {preview ? (
                    <img src={preview} className="w-full h-full object-cover" alt="preview" />
                  ) : user.profileFileId ? (
                    <img src={buildUrl(`/uploads/${user.profileFileId}`)} className="w-full h-full object-cover" alt="profile" />
                  ) : (
                    <span className="text-xs font-bold text-zinc-400">No Photo</span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold">Upload photo</p>
                  <p className="text-xs text-zinc-500">PNG, JPG up to 5MB</p>
                </div>
              </div>
            </label>
          </div>

          {error && <div className="px-4 py-3 rounded-2xl bg-red-50 text-red-600 text-xs font-bold">{error}</div>}

          <Button type="submit" variant="gold" className="w-full" disabled={saving}>
            {saving ? 'Saving...' : 'Save Profile'}
          </Button>
        </form>

        {user.businesses && user.businesses.length > 0 && (
          <div className="mt-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Businesses</p>
            <div className="space-y-2">
              {user.businesses.map((b) => (
                <div key={b.id} className="text-sm font-mono bg-zinc-50 px-3 py-2 rounded-xl border border-zinc-100">
                  {b.businessName} ({b.id})
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
