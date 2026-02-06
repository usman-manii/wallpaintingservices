'use client';

import logger from '@/lib/logger';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { USER_ROLES, getRoleName, getRoleColor } from '@/lib/roles';
import { fetchAPI } from '@/lib/api';
import { getErrorMessage } from '@/lib/error-utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { InlineMessage } from '@/components/ui/InlineMessage';
import { Mail, Calendar, FileText } from 'lucide-react';

interface UserData {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  countryCode?: string;
  nickname?: string;
  displayName?: string;
  language?: string;
  website?: string;
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  role: string;
  postsCount: number;
  createdAt?: string;
  updatedAt?: string;
  isEmailVerified?: boolean;
  emailVerifiedAt?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> => (
  value !== null && typeof value === 'object' && !Array.isArray(value)
);

const parseString = (value: unknown, fallback = ''): string => (
  typeof value === 'string' ? value : fallback
);

const parseNumber = (value: unknown, fallback = 0): number => (
  typeof value === 'number' && Number.isFinite(value) ? value : fallback
);

const parseUserData = (value: unknown): UserData | null => {
  if (!isRecord(value)) {
    return null;
  }
  const id = parseString(value.id);
  const username = parseString(value.username);
  const email = parseString(value.email);
  if (!id || !username || !email) {
    return null;
  }
  return {
    id,
    username,
    email,
    firstName: parseString(value.firstName) || undefined,
    lastName: parseString(value.lastName) || undefined,
    phoneNumber: parseString(value.phoneNumber) || undefined,
    countryCode: parseString(value.countryCode) || undefined,
    nickname: parseString(value.nickname) || undefined,
    displayName: parseString(value.displayName) || undefined,
    language: parseString(value.language) || undefined,
    website: parseString(value.website) || undefined,
    facebook: parseString(value.facebook) || undefined,
    twitter: parseString(value.twitter) || undefined,
    instagram: parseString(value.instagram) || undefined,
    linkedin: parseString(value.linkedin) || undefined,
    youtube: parseString(value.youtube) || undefined,
    role: parseString(value.role, 'user'),
    postsCount: parseNumber(value.postsCount),
    createdAt: parseString(value.createdAt) || undefined,
    updatedAt: parseString(value.updatedAt) || undefined,
    isEmailVerified: typeof value.isEmailVerified === 'boolean' ? value.isEmailVerified : undefined,
    emailVerifiedAt: parseString(value.emailVerifiedAt) || undefined,
  };
};

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const displayNameOptions = [
    { value: 'username', label: 'Username' },
    { value: 'firstName', label: 'First Name' },
    { value: 'lastName', label: 'Last Name' },
    { value: 'nickname', label: 'Nickname' },
    { value: 'email', label: 'Email' },
  ];

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'it', label: 'Italian' },
    { value: 'pt', label: 'Portuguese' },
    { value: 'ar', label: 'Arabic' },
    { value: 'zh', label: 'Chinese' },
  ];

  useEffect(() => {
    fetchUser();
  }, [params.id]);

  const fetchUser = async () => {
    try {
      const data = await fetchAPI(`/auth/users/${params.id}`, { redirectOn401: false });
      const parsed = parseUserData(data);
      if (!parsed) {
        setMessage('User not found');
        setUser(null);
        return;
      }
      setUser(parsed);
    } catch (error: unknown) {
      logger.error('Error fetching user:', error);
      setMessage(getErrorMessage(error, 'Failed to fetch user'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      await fetchAPI(`/auth/users/${params.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          firstName: user?.firstName,
          lastName: user?.lastName,
          phoneNumber: user?.phoneNumber,
          countryCode: user?.countryCode,
          nickname: user?.nickname,
          displayName: user?.displayName,
          language: user?.language,
          website: user?.website,
          facebook: user?.facebook,
          twitter: user?.twitter,
          instagram: user?.instagram,
          linkedin: user?.linkedin,
          youtube: user?.youtube,
        }),
        redirectOn401: false,
      });

      setMessage('User updated successfully!');
      setTimeout(() => router.push('/dashboard/users'), 1500);
    } catch (error: unknown) {
      setMessage(getErrorMessage(error, 'Failed to update user'));
    } finally {
      setSaving(false);
    }
  };

  const handleRoleUpdate = async (newRole: string) => {
    try {
      await fetchAPI(`/auth/users/${params.id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole }),
        redirectOn401: false,
      });

      setUser(prev => (prev ? { ...prev, role: newRole } : null));
      setMessage('Role updated successfully!');
    } catch (error) {
      logger.error('Error updating role:', error);
      setMessage(getErrorMessage(error, 'Failed to update role'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-muted-foreground">Loading user...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-red-500">User not found</div>
      </div>
    );
  }

  const resolvedDisplayName = (() => {
    if (!user.displayName || user.displayName === 'username') return user.username;
    if (user.displayName === 'firstName') return user.firstName || user.username;
    if (user.displayName === 'lastName') return user.lastName || user.username;
    if (user.displayName === 'nickname') return user.nickname || user.username;
    if (user.displayName === 'email') return user.email;
    return user.displayName || user.username;
  })();

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">User Profile</h1>
            <p className="text-sm text-muted-foreground">Update account data, visibility, and role access.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/dashboard/users')}>
              Back to users
            </Button>
          </div>
        </div>

        {message && (
          <InlineMessage type={message.toLowerCase().includes('success') ? 'success' : 'error'}>
            {message}
          </InlineMessage>
        )}

        <Card>
          <CardContent className="p-6 flex flex-col md:flex-row md:items-center gap-6">
            <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-semibold">
              {resolvedDisplayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-semibold text-foreground">{resolvedDisplayName}</h2>
                <Badge className={getRoleColor(user.role)}>{getRoleName(user.role)}</Badge>
                {user.isEmailVerified ? (
                  <Badge variant="success">Email verified</Badge>
                ) : (
                  <Badge variant="warning">Email pending</Badge>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4" /> {user.email}
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-4 h-4" /> {user.postsCount} posts
                </span>
                {user.createdAt && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" /> Joined {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Username (unchangeable)
                </label>
                <Input value={user.username} disabled />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email (requires verification to change)
                </label>
                <div className="flex flex-col md:flex-row gap-2">
                  <Input type="email" value={user.email} disabled />
                  <Button type="button" variant="outline" onClick={() => router.push(`/dashboard/users/${user.id}/change-email`)}>
                    Change Email
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    First Name
                  </label>
                  <Input
                    type="text"
                    value={user.firstName || ''}
                    onChange={(e) => setUser({ ...user, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Last Name
                  </label>
                  <Input
                    type="text"
                    value={user.lastName || ''}
                    onChange={(e) => setUser({ ...user, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Nickname
                  </label>
                  <Input
                    type="text"
                    value={user.nickname || ''}
                    onChange={(e) => setUser({ ...user, nickname: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Display name publicly as
                  </label>
                  <select
                    value={user.displayName || 'username'}
                    onChange={(e) => setUser({ ...user, displayName: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                  >
                    {displayNameOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Language
                </label>
                <select
                  value={user.language || 'en'}
                  onChange={(e) => setUser({ ...user, language: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                >
                  {languages.map(lang => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Country Code
                  </label>
                  <Input
                    type="text"
                    value={user.countryCode || ''}
                    onChange={(e) => setUser({ ...user, countryCode: e.target.value })}
                    placeholder="+1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Phone Number
                  </label>
                  <Input
                    type="tel"
                    value={user.phoneNumber || ''}
                    onChange={(e) => setUser({ ...user, phoneNumber: e.target.value })}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Website
                </label>
                <Input
                  type="url"
                  value={user.website || ''}
                  onChange={(e) => setUser({ ...user, website: e.target.value })}
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Social Profiles</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="url"
                placeholder="Facebook URL"
                value={user.facebook || ''}
                onChange={(e) => setUser({ ...user, facebook: e.target.value })}
              />
              <Input
                type="url"
                placeholder="Twitter / X URL"
                value={user.twitter || ''}
                onChange={(e) => setUser({ ...user, twitter: e.target.value })}
              />
              <Input
                type="url"
                placeholder="Instagram URL"
                value={user.instagram || ''}
                onChange={(e) => setUser({ ...user, instagram: e.target.value })}
              />
              <Input
                type="url"
                placeholder="LinkedIn URL"
                value={user.linkedin || ''}
                onChange={(e) => setUser({ ...user, linkedin: e.target.value })}
              />
              <Input
                type="url"
                placeholder="YouTube URL"
                value={user.youtube || ''}
                onChange={(e) => setUser({ ...user, youtube: e.target.value })}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Role & Access</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="block text-sm font-medium text-foreground">
                User Role
              </label>
              <select
                value={user.role}
                onChange={(e) => handleRoleUpdate(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
              >
                {Object.entries(USER_ROLES).map(([key, roleInfo]) => (
                  <option key={key} value={key}>
                    {roleInfo.name} - {roleInfo.description}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>

          <div className="flex flex-wrap justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/users')}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={saving}>
              Update User
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}


