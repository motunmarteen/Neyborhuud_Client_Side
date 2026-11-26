'use client';

/**
 * Edit profile (2026-11-26, new): photo, name, bio, gender and birthday in one place. Before,
 * "Edit bio" on your profile opened Settings, which had no place to write a bio.
 */

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera } from 'lucide-react';
import { toast } from 'sonner';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import { AvatarAdjusterModal } from '@/components/profile/AvatarAdjusterModal';
import { RowAvatar } from '@/components/friendship/PeopleRows';
import { Button } from '@/components/ui/Button';
import { FilterChip } from '@/components/ui/Chip';
import { useClientAuthUser } from '@/hooks/useClientAuthUser';
import { glassField, glassLabel } from '@/lib/glass-form-styles';
import { resolveUserAvatarUrl } from '@/lib/userAvatar';

const BIO_MAX = 500;
const GENDERS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'other', label: 'Prefer not to say' },
] as const;

export default function EditProfilePage() {
  const router = useRouter();
  const { user, mounted, updateProfile, uploadProfilePicture } = useClientAuthUser();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState('');
  const [birthday, setBirthday] = useState('');
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [adjusting, setAdjusting] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Fill the form once, from your account.
  useEffect(() => {
    if (!user || ready) return;
    setFirstName(user.firstName ?? '');
    setLastName(user.lastName ?? '');
    setBio((user as { bio?: string }).bio ?? '');
    setGender((user as { gender?: string }).gender ?? '');
    const dob = (user as { dateOfBirth?: string }).dateOfBirth;
    setBirthday(dob ? String(dob).slice(0, 10) : '');
    setReady(true);
  }, [user, ready]);

  useEffect(() => {
    if (mounted && !user) router.replace('/login?redirect=/settings/profile');
  }, [mounted, user, router]);

  const avatar = user ? resolveUserAvatarUrl({ profilePicture: (user as { profilePicture?: string }).profilePicture, avatarUrl: user.avatarUrl }) : null;
  const nameError = firstName.trim().length > 0 && firstName.trim().length < 2 ? 'At least 2 letters' : null;
  const lastError = lastName.trim().length > 0 && lastName.trim().length < 2 ? 'At least 2 letters' : null;

  const pickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return void toast.error('Choose a photo');
    if (file.size > 5 * 1024 * 1024) return void toast.error('Photo must be under 5 MB');
    setAdjusting(file);
  };

  const savePhoto = async (cropped: File) => {
    setAdjusting(null);
    setUploading(true);
    try {
      await uploadProfilePicture({ file: cropped });
      toast.success('Photo updated');
    } catch {
      /* the upload shows its own error */
    } finally {
      setUploading(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nameError || lastError || !firstName.trim()) return;
    setSaving(true);
    try {
      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
        bio: bio.trim(),
        ...(gender ? { gender } : {}),
        ...(birthday ? { dateOfBirth: new Date(birthday).toISOString() } : {}),
      } as never);
      toast.success('Profile saved');
      if (user?.username) router.push(`/profile/${user.username}`);
    } catch {
      toast.error('Could not save. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!mounted || !user) {
    return (
      <AppBrowseLayout>
        <div className="h-64 animate-pulse rounded-[22px] bg-white motion-reduce:animate-none" aria-hidden />
      </AppBrowseLayout>
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <AppBrowseLayout>
      <form onSubmit={save} className="flex flex-col gap-5 rounded-[22px] bg-white p-4 shadow-[0_2px_10px_rgba(29,36,51,0.06)]" noValidate>
        <div className="flex items-center gap-4">
          <span className="relative">
            <span className="block scale-[1.35] origin-left">
              <RowAvatar src={avatar} name={firstName || user.username || '?'} />
            </span>
          </span>
          <div className="ml-4 min-w-0">
            <Button type="button" variant="soft" size="sm" loading={uploading} leftIcon={<Camera size={16} aria-hidden />} onClick={() => fileRef.current?.click()}>
              Change photo
            </Button>
            <p className="mt-1 text-[13px] text-muted">A clear face helps neighbours trust you.</p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={pickPhoto} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="pf-first" className={glassLabel}>First name</label>
            <input id="pf-first" className={glassField} value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" maxLength={40} />
            {nameError ? <p role="alert" className="mt-1 text-[13px] font-bold text-brand-red">{nameError}</p> : null}
          </div>
          <div>
            <label htmlFor="pf-last" className={glassLabel}>Last name</label>
            <input id="pf-last" className={glassField} value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" maxLength={40} />
            {lastError ? <p role="alert" className="mt-1 text-[13px] font-bold text-brand-red">{lastError}</p> : null}
          </div>
        </div>

        <div>
          <label htmlFor="pf-bio" className={glassLabel}>About you</label>
          <textarea
            id="pf-bio"
            className={`${glassField} min-h-[110px] resize-y`}
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
            placeholder="e.g. Mum of two. I run the provisions shop by the junction."
          />
          <p className="mt-1 text-right text-[12px] text-muted">{bio.length}/{BIO_MAX}</p>
        </div>

        <div>
          <p className={glassLabel}>Gender</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Gender">
            {GENDERS.map((g) => (
              <FilterChip key={g.value} active={gender === g.value} onClick={() => setGender(gender === g.value ? '' : g.value)}>
                {g.label}
              </FilterChip>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="pf-dob" className={glassLabel}>Birthday</label>
          <input id="pf-dob" type="date" max={today} className={glassField} value={birthday} onChange={(e) => setBirthday(e.target.value)} />
          <p className="mt-1 text-[13px] text-muted">Shown on your profile unless you hide it in Privacy.</p>
        </div>

        <div className="flex gap-3 border-t border-line/70 pt-4">
          <Button type="button" variant="secondary" className="flex-1" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" className="flex-[2]" loading={saving} disabled={!firstName.trim() || !!nameError || !!lastError}>
            Save
          </Button>
        </div>
      </form>

      {adjusting ? <AvatarAdjusterModal file={adjusting} onCancel={() => setAdjusting(null)} onSave={savePhoto} /> : null}
    </AppBrowseLayout>
  );
}
