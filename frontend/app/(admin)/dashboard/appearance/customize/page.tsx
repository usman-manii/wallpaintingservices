'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { Save, ArrowLeft, Palette, Type } from 'lucide-react';

export default function CustomizePage() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [appearance, setAppearance] = useState({
    colors: {
      primary: '#3B82F6',
      secondary: '#8B5CF6',
      accent: '#10B981',
      background: '#FFFFFF',
      text: '#1F2937'
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter'
    },
    typography: {
      headingSize: '2rem',
      bodySize: '1rem',
      lineHeight: '1.6'
    }
  });
  const [loading, setLoading] = useState(true);

  const loadAppearance = useCallback(async () => {
    try {
      const data = await fetchAPI('/settings', { redirectOn401: false, cache: 'no-store' });
      if (data?.appearanceSettings) {
        setAppearance({
          colors: { ...appearance.colors, ...data.appearanceSettings.colors },
          fonts: { ...appearance.fonts, ...data.appearanceSettings.fonts },
          typography: { ...appearance.typography, ...data.appearanceSettings.typography }
        });
      }
    } catch (e: any) {
      showError(e.message || 'Failed to load appearance settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAppearance();
  }, [loadAppearance]);

  async function handleSave() {
    try {
      await fetchAPI('/settings', {
        method: 'PUT',
        body: JSON.stringify({ appearanceSettings: appearance }),
        redirectOn401: false,
        cache: 'no-store',
      });
      success('Appearance settings saved successfully!');
    } catch (e: any) {
      showError(e.message || 'Failed to save appearance settings');
    }
  }

  if (loading) return <div className="p-8 text-center text-slate-500">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-6">
      <div className="flex items-center gap-4 mb-4">
        <Button variant="ghost" onClick={() => router.push('/dashboard')}>
            <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
        </Button>
      </div>

      <div className="flex justify-between items-center mb-6 px-1">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Customize Appearance</h1>
            <p className="text-slate-500 dark:text-slate-400">Control site color scheme, fonts, and typography.</p>
          </div>
          <Button onClick={handleSave}>
            <Save size={16} className="mr-2" /> Save Changes
          </Button>
      </div>

      <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette size={20} /> Color Scheme
              </CardTitle>
              <CardDescription>Customize your site's color palette.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
               <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Primary Color</label>
                    <div className="flex gap-2">
                      <Input 
                        type="color"
                        value={appearance.colors.primary}
                        onChange={(e) => setAppearance({...appearance, colors: {...appearance.colors, primary: e.target.value}})}
                        className="w-20 h-10"
                      />
                      <Input 
                        value={appearance.colors.primary}
                        onChange={(e) => setAppearance({...appearance, colors: {...appearance.colors, primary: e.target.value}})}
                        placeholder="#3B82F6"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Secondary Color</label>
                    <div className="flex gap-2">
                      <Input 
                        type="color"
                        value={appearance.colors.secondary}
                        onChange={(e) => setAppearance({...appearance, colors: {...appearance.colors, secondary: e.target.value}})}
                        className="w-20 h-10"
                      />
                      <Input 
                        value={appearance.colors.secondary}
                        onChange={(e) => setAppearance({...appearance, colors: {...appearance.colors, secondary: e.target.value}})}
                        placeholder="#8B5CF6"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Accent Color</label>
                    <div className="flex gap-2">
                      <Input 
                        type="color"
                        value={appearance.colors.accent}
                        onChange={(e) => setAppearance({...appearance, colors: {...appearance.colors, accent: e.target.value}})}
                        className="w-20 h-10"
                      />
                      <Input 
                        value={appearance.colors.accent}
                        onChange={(e) => setAppearance({...appearance, colors: {...appearance.colors, accent: e.target.value}})}
                        placeholder="#10B981"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Background Color</label>
                    <div className="flex gap-2">
                      <Input 
                        type="color"
                        value={appearance.colors.background}
                        onChange={(e) => setAppearance({...appearance, colors: {...appearance.colors, background: e.target.value}})}
                        className="w-20 h-10"
                      />
                      <Input 
                        value={appearance.colors.background}
                        onChange={(e) => setAppearance({...appearance, colors: {...appearance.colors, background: e.target.value}})}
                        placeholder="#FFFFFF"
                      />
                    </div>
                  </div>
               </div>
          </CardContent>
      </Card>

      <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type size={20} /> Fonts & Typography
              </CardTitle>
              <CardDescription>Configure font families and typography settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
               <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Heading Font</label>
                    <select
                      value={appearance.fonts.heading}
                      onChange={(e) => setAppearance({...appearance, fonts: {...appearance.fonts, heading: e.target.value}})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800"
                    >
                      <option value="Inter">Inter</option>
                      <option value="Roboto">Roboto</option>
                      <option value="Open Sans">Open Sans</option>
                      <option value="Lato">Lato</option>
                      <option value="Montserrat">Montserrat</option>
                      <option value="Poppins">Poppins</option>
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Body Font</label>
                    <select
                      value={appearance.fonts.body}
                      onChange={(e) => setAppearance({...appearance, fonts: {...appearance.fonts, body: e.target.value}})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800"
                    >
                      <option value="Inter">Inter</option>
                      <option value="Roboto">Roboto</option>
                      <option value="Open Sans">Open Sans</option>
                      <option value="Lato">Lato</option>
                      <option value="Montserrat">Montserrat</option>
                      <option value="Poppins">Poppins</option>
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Heading Size</label>
                    <Input 
                      value={appearance.typography.headingSize}
                      onChange={(e) => setAppearance({...appearance, typography: {...appearance.typography, headingSize: e.target.value}})}
                      placeholder="2rem"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Body Size</label>
                    <Input 
                      value={appearance.typography.bodySize}
                      onChange={(e) => setAppearance({...appearance, typography: {...appearance.typography, bodySize: e.target.value}})}
                      placeholder="1rem"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Line Height</label>
                    <Input 
                      value={appearance.typography.lineHeight}
                      onChange={(e) => setAppearance({...appearance, typography: {...appearance.typography, lineHeight: e.target.value}})}
                      placeholder="1.6"
                    />
                  </div>
               </div>
          </CardContent>
      </Card>
    </div>
  );
}
