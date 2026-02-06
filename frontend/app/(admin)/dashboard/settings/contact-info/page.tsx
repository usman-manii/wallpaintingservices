'use client';

import logger from '@/lib/logger';

import { useState, useEffect, useCallback } from 'react';
import { fetchAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { Save, ArrowLeft, Phone, Mail, MapPin, Facebook, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react';

type SettingsResponse = {
  contactInfo?: Record<string, unknown> | string | null;
};

export default function ContactInfoPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [contactInfo, setContactInfo] = useState({
    phone: '',
    email: '',
    address: '',
    facebook: '',
    twitter: '',
    instagram: '',
    linkedin: '',
    youtube: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadContactInfo = useCallback(async () => {
    try {
      const data = await fetchAPI<SettingsResponse>('/settings', { redirectOn401: false, cache: 'no-store' });
      const contactData = data?.contactInfo; // Can be null, string, or object
      
      if (contactData) {
        // Handle cases where contactInfo might be stored as a string (e.g., from initial migration)
        const parsedContactInfo = typeof contactData === 'string' ? JSON.parse(contactData) : contactData;
        setContactInfo({
          phone: parsedContactInfo?.phone || '',
          email: parsedContactInfo?.email || '',
          address: parsedContactInfo?.address || '',
          facebook: parsedContactInfo?.facebook || '',
          twitter: parsedContactInfo?.twitter || '',
          instagram: parsedContactInfo?.instagram || '',
          linkedin: parsedContactInfo?.linkedin || '',
          youtube: parsedContactInfo?.youtube || ''
        });
      }
    } catch (e: unknown) {
      logger.error('Error loading contact info:', e);
      showError(e instanceof Error && e.message ? e.message : 'Failed to load contact information');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContactInfo();
  }, [router, loadContactInfo]);

  async function handleSave() {
    setSaving(true);
    try {
      await fetchAPI('/settings', {
        method: 'PUT',
        body: JSON.stringify({ contactInfo }),
        redirectOn401: false // Send as nested object
      });
      success('Contact information saved successfully!');
    } catch (e: unknown) {
      showError(e instanceof Error && e.message ? e.message : 'Failed to save contact information');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-6">
      <div className="flex items-center gap-4 mb-4">
        <Button variant="ghost" onClick={() => router.push('/dashboard')}>
            <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
        </Button>
      </div>

      <div className="flex justify-between items-center mb-6 px-1">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Contact Information</h1>
            <p className="text-muted-foreground">Manage owner contact details and social media accounts.</p>
          </div>
      </div>

      <Card>
          <CardHeader>
              <CardTitle>Contact Details</CardTitle>
              <CardDescription>This information will be displayed in the top bar when enabled.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
               <div className="grid gap-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Phone size={16} /> Phone Number
                  </label>
                  <Input 
                    value={contactInfo.phone} 
                    onChange={(e) => setContactInfo({...contactInfo, phone: e.target.value})}
                    placeholder="+1 (555) 123-4567"
                  />
               </div>

               <div className="grid gap-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Mail size={16} /> Email Address
                  </label>
                  <Input 
                    type="email"
                    value={contactInfo.email} 
                    onChange={(e) => setContactInfo({...contactInfo, email: e.target.value})}
                    placeholder="contact@example.com"
                  />
               </div>

               <div className="grid gap-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <MapPin size={16} /> Address
                  </label>
                  <Input 
                    value={contactInfo.address} 
                    onChange={(e) => setContactInfo({...contactInfo, address: e.target.value})}
                    placeholder="123 Main St, City, State 12345"
                  />
               </div>
          </CardContent>
      </Card>

      <Card>
          <CardHeader>
              <CardTitle>Social Media</CardTitle>
              <CardDescription>Add your social media profile URLs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
               <div className="grid gap-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Facebook size={16} className="text-blue-600" /> Facebook
                  </label>
                  <Input 
                    value={contactInfo.facebook} 
                    onChange={(e) => setContactInfo({...contactInfo, facebook: e.target.value})}
                    placeholder="https://facebook.com/yourpage"
                  />
               </div>

               <div className="grid gap-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Twitter size={16} className="text-blue-400" /> Twitter
                  </label>
                  <Input 
                    value={contactInfo.twitter} 
                    onChange={(e) => setContactInfo({...contactInfo, twitter: e.target.value})}
                    placeholder="https://twitter.com/yourhandle"
                  />
               </div>

               <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Instagram size={16} className="text-pink-600" /> Instagram
                  </label>
                  <Input 
                    value={contactInfo.instagram} 
                    onChange={(e) => setContactInfo({...contactInfo, instagram: e.target.value})}
                    placeholder="https://instagram.com/yourhandle"
                  />
               </div>

               <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Linkedin size={16} className="text-blue-700" /> LinkedIn
                  </label>
                  <Input 
                    value={contactInfo.linkedin} 
                    onChange={(e) => setContactInfo({...contactInfo, linkedin: e.target.value})}
                    placeholder="https://linkedin.com/company/yourcompany"
                  />
               </div>

               <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Youtube size={16} className="text-red-600" /> YouTube
                  </label>
                  <Input 
                    value={contactInfo.youtube} 
                    onChange={(e) => setContactInfo({...contactInfo, youtube: e.target.value})}
                    placeholder="https://youtube.com/@yourchannel"
                  />
               </div>
          </CardContent>
          <CardFooter className="flex justify-end border-t border-slate-100 dark:border-slate-700 pt-6 bg-slate-50 dark:bg-slate-800 rounded-b-lg">
              <Button onClick={handleSave} disabled={saving}>
                  <Save size={16} className="mr-2" /> Save Changes
              </Button>
          </CardFooter>
      </Card>
    </div>
  );
}


