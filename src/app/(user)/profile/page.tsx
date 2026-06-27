'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Monitor, Save, Shield, Smartphone, Tablet, Trash2, Upload } from 'lucide-react';
import { useDevices, useProfile, useUpdateProfile, useUploadAvatar } from '@/hooks/useProfile';
import { updateProfileSchema } from '@/validations';
import type { UserProfile } from '@/types';

const tabs = ['Profile', 'Skills', 'Devices', 'Security'] as const;

const splitList = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);
const joinList = (value?: string[]) => value?.join(', ') ?? '';

export default function ProfilePage() {
  const { profile, loading, refetch } = useProfile();
  const { updateProfile, loading: saving, error } = useUpdateProfile();
  const { uploadAvatar, loading: uploading } = useUploadAvatar();
  const { devices, revokeDevice } = useDevices();
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('Profile');
  const [form, setForm] = useState<Partial<UserProfile>>({});
  const [skills, setSkills] = useState('');
  const [languages, setLanguages] = useState('');

  useEffect(() => {
    if (!profile?.profile) return;
    setForm(profile.profile);
    setSkills(joinList(profile.profile.skills));
    setLanguages(joinList(profile.profile.languages));
  }, [profile]);

  const completion = useMemo(() => profile?.completionPercentage ?? 0, [profile]);

  const handleSave = async () => {
    const payload = {
      ...form,
      skills: splitList(skills),
      languages: splitList(languages),
    };
    const validated = updateProfileSchema.safeParse(payload);
    if (!validated.success) {
      toast.error(validated.error.issues[0]?.message ?? 'Please check your profile details.');
      return;
    }
    const updated = await updateProfile(payload);
    if (updated) {
      toast.success('Profile updated.');
      refetch();
    }
  };

  const handleAvatar = async (file?: File) => {
    if (!file) return;
    const avatarUrl = await uploadAvatar(file);
    if (avatarUrl) {
      toast.success('Avatar uploaded.');
      refetch();
    }
  };

  if (loading) return <div className="skeleton h-96 w-full" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Profile</h1>
          <p className="text-zinc-400">Keep your resume source data sharp and current.</p>
        </div>
        <div className="min-w-52">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-zinc-400">Completion</span>
            <span className="font-semibold text-white">{completion}%</span>
          </div>
          <div className="progress-bar"><div className="progress-fill" style={{ width: `${completion}%` }} /></div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={activeTab === tab ? 'btn-primary py-2' : 'btn-secondary py-2'}
          >
            {tab}
          </button>
        ))}
      </div>

      {(activeTab === 'Profile' || activeTab === 'Skills') && (
        <div className="card p-6 space-y-5">
          {activeTab === 'Profile' ? (
            <>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-white/10 bg-cover bg-center" style={{ backgroundImage: form.avatarUrl ? `url(${form.avatarUrl})` : undefined }} />
                <label className="btn-secondary cursor-pointer">
                  <Upload size={16} /> {uploading ? 'Uploading...' : 'Avatar'}
                  <input type="file" accept="image/*" className="hidden" onChange={(event) => handleAvatar(event.target.files?.[0])} />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {(['firstName', 'lastName', 'phone', 'location', 'headline', 'website', 'linkedIn', 'github'] as const).map((field) => (
                  <label key={field}>
                    <span className="input-label capitalize">{field.replace(/([A-Z])/g, ' $1')}</span>
                    <input className="input-field" value={(form[field] as string) ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))} />
                  </label>
                ))}
              </div>
              <label>
                <span className="input-label">Bio</span>
                <textarea className="input-field min-h-32" value={form.bio ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))} />
              </label>
            </>
          ) : (
            <>
              <label>
                <span className="input-label">Skills</span>
                <textarea className="input-field min-h-28" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, Node.js, Product strategy" />
              </label>
              <label>
                <span className="input-label">Languages</span>
                <input className="input-field" value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder="English, Bangla" />
              </label>
            </>
          )}
          {error && <p className="input-error">{error}</p>}
          <button onClick={handleSave} disabled={saving} className="btn-primary"><Save size={16} /> {saving ? 'Saving...' : 'Save changes'}</button>
        </div>
      )}

      {activeTab === 'Devices' && (
        <div className="card divide-y divide-white/10">
          {devices.map((device) => {
            const Icon = device.deviceType === 'mobile' ? Smartphone : device.deviceType === 'tablet' ? Tablet : Monitor;
            return (
              <div key={device.id} className="flex items-center gap-4 p-5">
                <Icon className="text-purple-400" size={22} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white">{device.deviceName}</p>
                  <p className="text-sm text-zinc-500">{device.browser} on {device.os}</p>
                </div>
                {device.isCurrentDevice ? <span className="badge badge-success">Current</span> : (
                  <button onClick={() => revokeDevice(device.id)} className="btn-ghost text-red-400"><Trash2 size={16} /></button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'Security' && (
        <div className="card p-6 flex items-start gap-4">
          <Shield className="text-emerald-400" />
          <div>
            <h2 className="font-semibold text-white">Two-factor authentication</h2>
            <p className="mt-1 text-sm text-zinc-400">2FA endpoints are available through the auth API. The profile surface is ready for enable/disable controls.</p>
          </div>
        </div>
      )}
    </div>
  );
}
