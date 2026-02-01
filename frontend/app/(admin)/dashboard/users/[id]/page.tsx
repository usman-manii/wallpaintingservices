'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { USER_ROLES } from '@/lib/roles';
import { fetchAPI } from '@/lib/api';

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
}

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
      setUser(data);
    } catch (error: any) {
      console.error('Error fetching user:', error);
      setMessage(error.message || 'Failed to fetch user');
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
    } catch (error: any) {
      setMessage(error.message || 'Failed to update user');
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
      console.error('Error updating role:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-gray-600">Loading user...</div>
    </div>;
  }

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-red-600">User not found</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-normal text-gray-900">Edit User</h1>
          <p className="text-sm text-gray-600 mt-1">Update user profile and settings</p>
        </div>

        {message && (
          <div className={`mb-4 p-4 rounded ${message.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>
            
            {/* Username - READ ONLY */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username (unchangeable)
              </label>
              <input
                type="text"
                value={user.username}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded bg-gray-100 cursor-not-allowed"
              />
            </div>

            {/* Email - READ ONLY (requires verification to change) */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email (requires verification to change)
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="flex-1 px-4 py-2 border border-gray-300 rounded bg-gray-100 cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => router.push(`/dashboard/users/${user.id}/change-email`)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Change Email
                </button>
              </div>
            </div>

            {/* First Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <input
                type="text"
                value={user.firstName || ''}
                onChange={(e) => setUser({ ...user, firstName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Last Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <input
                type="text"
                value={user.lastName || ''}
                onChange={(e) => setUser({ ...user, lastName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Nickname */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nickname
              </label>
              <input
                type="text"
                value={user.nickname || ''}
                onChange={(e) => setUser({ ...user, nickname: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Display Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display name publicly as
              </label>
              <select
                value={user.displayName || 'username'}
                onChange={(e) => setUser({ ...user, displayName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {displayNameOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Language */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <select
                value={user.language || 'en'}
                onChange={(e) => setUser({ ...user, language: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {languages.map(lang => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-white rounded shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Info</h2>

            {/* Phone Number & Country Code */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country Code
                </label>
                <input
                  type="text"
                  value={user.countryCode || ''}
                  onChange={(e) => setUser({ ...user, countryCode: e.target.value })}
                  placeholder="+1"
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={user.phoneNumber || ''}
                  onChange={(e) => setUser({ ...user, phoneNumber: e.target.value })}
                  placeholder="(555) 123-4567"
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Website */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website
              </label>
              <input
                type="url"
                value={user.website || ''}
                onChange={(e) => setUser({ ...user, website: e.target.value })}
                placeholder="https://yourwebsite.com"
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Social Media Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Facebook
                </label>
                <input
                  type="url"
                  value={user.facebook || ''}
                  onChange={(e) => setUser({ ...user, facebook: e.target.value })}
                  placeholder="https://facebook.com/username"
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Twitter
                </label>
                <input
                  type="url"
                  value={user.twitter || ''}
                  onChange={(e) => setUser({ ...user, twitter: e.target.value })}
                  placeholder="https://twitter.com/username"
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instagram
                </label>
                <input
                  type="url"
                  value={user.instagram || ''}
                  onChange={(e) => setUser({ ...user, instagram: e.target.value })}
                  placeholder="https://instagram.com/username"
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LinkedIn
                </label>
                <input
                  type="url"
                  value={user.linkedin || ''}
                  onChange={(e) => setUser({ ...user, linkedin: e.target.value })}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  YouTube
                </label>
                <input
                  type="url"
                  value={user.youtube || ''}
                  onChange={(e) => setUser({ ...user, youtube: e.target.value })}
                  placeholder="https://youtube.com/@username"
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Role Management */}
          <div className="bg-white rounded shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Role</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User Role
              </label>
              <select
                value={user.role}
                onChange={(e) => handleRoleUpdate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {Object.entries(USER_ROLES).map(([key, roleInfo]) => (
                  <option key={key} value={key}>
                    {roleInfo.name} - {roleInfo.description}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard/users')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Update User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
