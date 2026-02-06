// frontend/app/(admin)/profile/page.tsx
'use client';

import logger from '@/lib/logger';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { User, Mail, Globe, Save } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useConfirmDialog } from '@/components/ui/ConfirmDialog';
import { getErrorMessage } from '@/lib/error-utils';

type Profile = {
    username?: string;
    role?: string;
    email?: string;
    isEmailVerified?: boolean;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    countryCode?: string;
    website?: string;
    description?: string;
};

function parseProfile(value: unknown): Profile | null {
    if (!value || typeof value !== 'object') return null;
    const obj = value as Record<string, unknown>;
    return {
        username: typeof obj.username === 'string' ? obj.username : undefined,
        role: typeof obj.role === 'string' ? obj.role : undefined,
        email: typeof obj.email === 'string' ? obj.email : undefined,
        isEmailVerified: typeof obj.isEmailVerified === 'boolean' ? obj.isEmailVerified : undefined,
        firstName: typeof obj.firstName === 'string' ? obj.firstName : undefined,
        lastName: typeof obj.lastName === 'string' ? obj.lastName : undefined,
        phoneNumber: typeof obj.phoneNumber === 'string' ? obj.phoneNumber : undefined,
        countryCode: typeof obj.countryCode === 'string' ? obj.countryCode : undefined,
        website: typeof obj.website === 'string' ? obj.website : undefined,
        description: typeof obj.description === 'string' ? obj.description : undefined,
    };
}

function extractRequestId(value: unknown): string | null {
    if (!value || typeof value !== 'object') return null;
    const obj = value as Record<string, unknown>;
    return typeof obj.requestId === 'string' ? obj.requestId : null;
}

export default function ProfilePage() {
    const router = useRouter();
    const { success, error: showError } = useToast();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [emailChangeStatus, setEmailChangeStatus] = useState<string>('');
    const [verificationSending, setVerificationSending] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    async function fetchProfile() {
        try {
            const data = await fetchAPI('/auth/profile', { redirectOn401: false });
            setProfile(parseProfile(data));
        } catch (err: unknown) {
            logger.error('Failed to load profile', err, { component: 'ProfilePage' });
        } finally {
            setLoading(false);
        }
    }

    async function handleUpdate(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setMessage('');

        try {
             // Removed mock, use real endpoint
             await fetchAPI('/auth/profile', { method: 'PUT', body: JSON.stringify(profile), redirectOn401: false });
             setMessage('Profile updated successfully');
             // Refresh profile to get updated data (e.g. formatting)
             fetchProfile();
        } catch (err: unknown) {
            setMessage(getErrorMessage(err, 'Error updating profile'));
        } finally {
            setSaving(false);
        }
    }

    const { dialog, confirm } = useConfirmDialog();
    const [newEmailInput, setNewEmailInput] = useState('');

    async function handleEmailChange() {
        if (!profile?.email) return;

        confirm(
          'Change Email',
          (
            <div>
              <p className="mb-2">Enter new email address:</p>
              <input
                type="email"
                value={newEmailInput}
                onChange={(e) => setNewEmailInput(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="new-email@example.com"
              />
            </div>
          ),
          async () => {
            const newEmail = newEmailInput.trim();
            if (!newEmail || newEmail === profile.email) return;
            try {
               const res = await fetchAPI('/auth/email-change/request', {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({ newEmail }),
                   redirectOn401: false
               });
               success('Email change requested. Please check your inbox for verification codes.');
               setNewEmailInput('');
               const requestId = extractRequestId(res);
               if (requestId) {
                  router.push(`/verify-email?requestId=${requestId}`);
               }
            } catch (err: unknown) {
                showError(getErrorMessage(err, 'Failed to request email change'));
            }
          },
          'info'
        );
    }

    async function handleResendVerification() {
        if (!profile?.email || profile.isEmailVerified) return;
        try {
            setVerificationSending(true);
            await fetchAPI('/auth/verify-email/request', { method: 'POST', redirectOn401: false });
            success('Verification email sent. Please check your inbox.');
        } catch (err: unknown) {
            showError(getErrorMessage(err, 'Failed to send verification email'));
        } finally {
            setVerificationSending(false);
        }
    }

    if (loading) return <div className="p-8">Loading profile...</div>;
    if (!profile) return <div className="p-8 text-red-500">Failed to load profile.</div>;

    

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {dialog}
            <h1 className="text-3xl font-bold mb-6">My Profile</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* User Card */}
                <Card className="md:col-span-1">
                    <CardContent className="pt-6 flex flex-col items-center text-center">
                        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                            <span className="text-4xl text-muted-foreground">
                                {(profile.username || 'U')[0].toUpperCase()}
                            </span>
                        </div>
                        <h2 className="text-xl font-bold">{profile.username}</h2>
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-2 uppercase">
                            {profile.role}
                        </span>
                        <p className="text-sm text-muted-foreground mt-4">
                            {profile.email} 
                            {profile.isEmailVerified && <span className="text-green-500 ml-1">*</span>}
                        </p>
                        {!profile.isEmailVerified && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-3 w-full"
                            isLoading={verificationSending}
                            disabled={verificationSending}
                            onClick={handleResendVerification}
                          >
                            Verify Email
                          </Button>
                        )}
                        <Button variant="outline" size="sm" className="mt-4 w-full" onClick={handleEmailChange}>
                            Change Email
                        </Button>
                    </CardContent>
                </Card>

                {/* Edit Form */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Edit Profile</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">First Name</label>
                                    <Input 
                                        value={profile.firstName || ''} 
                                        onChange={e => setProfile({...profile, firstName: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Last Name</label>
                                    <Input 
                                        value={profile.lastName || ''} 
                                        onChange={e => setProfile({...profile, lastName: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Phone Number</label>
                                    <Input 
                                        placeholder="+1234567890"
                                        value={profile.phoneNumber || ''} 
                                        onChange={e => setProfile({...profile, phoneNumber: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Country Code</label>
                                    <Input 
                                        placeholder="US"
                                        maxLength={2}
                                        value={profile.countryCode || ''} 
                                        onChange={e => setProfile({...profile, countryCode: e.target.value})}
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Website</label>
                                <div className="flex items-center gap-2">
                                    <Globe size={16} className="text-muted-foreground" />
                                    <Input 
                                        value={profile.website || ''} 
                                        onChange={e => setProfile({...profile, website: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Bio / About</label>
                                <Input 
                                    value={profile.description || ''} 
                                    onChange={e => setProfile({...profile, description: e.target.value})}
                                    placeholder="Tell us about yourself"
                                />
                            </div>

                            {message && (
                                <div className={`p-3 rounded-md text-sm ${message.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                    {message}
                                </div>
                            )}

                            <div className="flex justify-end">
                                <Button type="submit" disabled={saving} isLoading={saving}>
                                    <Save size={16} className="mr-2" />
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}


