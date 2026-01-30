'use client';

import { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { useToast } from '@/components/ui/Toast';
import { useConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Save, ArrowLeft, Globe, Type, AlertCircle, Image as ImageIcon, Shield, ShieldCheck, FileText, Trash2, RefreshCw, Info, ExternalLink, Upload } from 'lucide-react';

type VerificationFile = {
  platform: string;
  filename: string;
  description: string;
  uploadedAt: string;
  size: number;
  publicUrl: string;
};

export default function SettingsPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [settings, setSettings] = useState({ 
    siteName: '', 
    description: '', 
    seoKeywords: '', 
    footerText: '',
    homePageId: '',
    blogPageId: '',
    topBarEnabled: false,
    logo: '',
    favicon: '',
    captchaType: 'recaptcha-v2',
    recaptchaV2SiteKey: '',
    recaptchaV2SecretKey: '',
    recaptchaV3SiteKey: '',
    recaptchaV3SecretKey: '',
    recaptchaSiteKey: '',
    recaptchaSecretKey: '',
    forceHttps: false,
    googleSiteVerification: '',
    bingSiteVerification: '',
    yandexSiteVerification: '',
    pinterestVerification: '',
    facebookDomainVerification: '',
    customVerificationTag: '',
  });
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  // File Upload State
  const [verificationFiles, setVerificationFiles] = useState<VerificationFile[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadPlatform, setUploadPlatform] = useState('google');
  const [uploadFilename, setUploadFilename] = useState('');
  const [uploadContent, setUploadContent] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');

  useEffect(() => {
    loadSettings();
    loadPages();
    loadVerificationFiles();
  }, [router]);

  async function loadPages() {
    try {
      const params = new URLSearchParams({ status: 'PUBLISHED' });
      const data = await fetchAPI(`/pages?${params.toString()}`);

      let pagesList: any[] = [];
      if (Array.isArray(data)) {
        pagesList = data;
      } else if (data?.items && Array.isArray(data.items)) {
        pagesList = data.items;
      } else if (data?.pages && Array.isArray(data.pages)) {
        pagesList = data.pages;
      }

      const publishedPages = pagesList.filter((page: any) => page?.status === 'PUBLISHED');
      setPages(publishedPages);
    } catch (e: any) {
      console.error('❌ Unexpected error loading pages:', e);
      setPages([]);
    }
  }

  async function loadSettings() {
    try {
      const data = await fetchAPI('/settings');
      if (data) {
        setSettings({
          siteName: data.siteName || '',
          description: data.description || '',
          seoKeywords: data.seoKeywords || '',
          footerText: data.footerText || '',
          homePageId: data.homePageId || '',
          blogPageId: data.blogPageId || '',
          topBarEnabled: data.topBarEnabled || false,
          logo: data.logo || '',
          favicon: data.favicon || '',
          captchaType: data.captchaType || 'recaptcha-v2',
          recaptchaV2SiteKey: data.recaptchaV2SiteKey || data.recaptchaSiteKey || '',
          recaptchaV2SecretKey: data.recaptchaV2SecretKey || data.recaptchaSecretKey || '',
          recaptchaV3SiteKey: data.recaptchaV3SiteKey || '',
          recaptchaV3SecretKey: data.recaptchaV3SecretKey || '',
          recaptchaSiteKey: data.recaptchaSiteKey || '',
          recaptchaSecretKey: data.recaptchaSecretKey || '',
          forceHttps: data.forceHttps || false,
          googleSiteVerification: data.googleSiteVerification || '',
          bingSiteVerification: data.bingSiteVerification || '',
          yandexSiteVerification: data.yandexSiteVerification || '',
          pinterestVerification: data.pinterestVerification || '',
          facebookDomainVerification: data.facebookDomainVerification || '',
          customVerificationTag: data.customVerificationTag || '',
        });
      }
    } catch (e) {
      console.error(e);
      showError('Failed to load settings. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }

  async function loadVerificationFiles() {
    try {
      const data = await fetchAPI('/settings/verification-files');
      if (Array.isArray(data)) {
        setVerificationFiles(data);
      }
    } catch (error) {
      console.error('Failed to load verification files:', error);
    }
  }

  async function handleSave() {
    setMessage('');
    setSaving(true);
    try {
      const settingsToSave: any = {
        siteName: settings.siteName,
        description: settings.description,
        seoKeywords: settings.seoKeywords,
        footerText: settings.footerText,
        logo: settings.logo || null,
        favicon: settings.favicon || null,
        topBarEnabled: settings.topBarEnabled,
        captchaType: settings.captchaType,
        recaptchaV2SiteKey: settings.recaptchaV2SiteKey || null,
        recaptchaV2SecretKey: settings.recaptchaV2SecretKey || null,
        recaptchaV3SiteKey: settings.recaptchaV3SiteKey || null,
        recaptchaV3SecretKey: settings.recaptchaV3SecretKey || null,
        recaptchaSiteKey: settings.recaptchaSiteKey || null,
        recaptchaSecretKey: settings.recaptchaSecretKey || null,
        forceHttps: settings.forceHttps,
        googleSiteVerification: settings.googleSiteVerification || null,
        bingSiteVerification: settings.bingSiteVerification || null,
        yandexSiteVerification: settings.yandexSiteVerification || null,
        pinterestVerification: settings.pinterestVerification || null,
        facebookDomainVerification: settings.facebookDomainVerification || null,
        customVerificationTag: settings.customVerificationTag || null,
      };
      
      settingsToSave.homePageId = settings.homePageId && settings.homePageId.trim() !== '' 
        ? settings.homePageId 
        : null;
      settingsToSave.blogPageId = settings.blogPageId && settings.blogPageId.trim() !== '' 
        ? settings.blogPageId 
        : null;
      
      const response = await fetchAPI('/settings', {
        method: 'PUT',
        body: JSON.stringify(settingsToSave)
      });
      
      setMessage('✅ Settings saved successfully!');
      success('Settings saved successfully!');
    } catch (e: any) {
      console.error('Error saving settings - Full error:', e);
      let errorMsg = 'Failed to save settings';
      if (e.message) {
        errorMsg = e.message;
        if (e.message.includes('API Error:')) {
          errorMsg = e.message.replace('API Error: ', '');
        }
      } else if (typeof e === 'string') {
        errorMsg = e;
      }
      setMessage(`❌ ${errorMsg}`);
      showError(errorMsg);
    } finally {
      setSaving(false);
    }
  }

  async function handleUploadFile(e: React.FormEvent) {
    e.preventDefault();
    
    if (!uploadFilename || !uploadContent) {
      showError('Please fill in all required fields');
      return;
    }

    try {
      setUploadingFile(true);
      await fetchAPI('/settings/verification-files', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: uploadPlatform,
          filename: uploadFilename,
          content: uploadContent,
          description: uploadDescription,
        }),
      });

      success('Verification file uploaded successfully!');
      setUploadFilename('');
      setUploadContent('');
      setUploadDescription('');
      await loadVerificationFiles();
    } catch (error: any) {
      showError('Upload failed: ' + error.message);
    } finally {
      setUploadingFile(false);
    }
  }

  const { dialog, confirm } = useConfirmDialog();

  async function handleDeleteFile(platform: string) {
    confirm(
      'Delete Verification File',
      `Delete verification file for ${platform}?`,
      async () => {
        try {
          await fetchAPI(`/settings/verification-files/${platform}`, { method: 'DELETE' });
          success('Verification file deleted successfully!');
          await loadVerificationFiles();
        } catch (error: any) {
          showError('Delete failed: ' + error.message);
        }
      },
      'danger'
    );
  }

  if (loading) return <div className="p-8 text-center text-slate-500">Loading settings...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-6">
      {dialog}
      <div className="flex items-center gap-4 mb-4">
        <Button variant="ghost" onClick={() => router.push('/dashboard')}>
            <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
        </Button>
      </div>

      <div className="flex justify-between items-center mb-6 px-1">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Site Settings</h1>
            <p className="text-slate-500 dark:text-slate-400">Configure global site metadata and SEO preferences.</p>
          </div>
      </div>

      {/* General Information - Full Width */}
      <Card>
          <CardHeader>
              <CardTitle>General Information</CardTitle>
              <CardDescription>This information will appear on the homepage and in search results.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Site Name</label>
                    <div className="relative">
                        <Input 
                          value={settings.siteName} 
                          onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                          className="pl-10"
                          placeholder="e.g. Acme Painting Services"
                        />
                        <Type className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    </div>
                 </div>

                 <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Site Tagline</label>
                    <Input 
                      type="text"
                      value={settings.description} 
                      onChange={(e) => setSettings({...settings, description: e.target.value})} 
                      placeholder="Your site tagline or brief description..."
                      maxLength={200}
                    />
                    <p className="text-xs text-slate-400">A short tagline that describes your site (single line text).</p>
                 </div>

                 <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">SEO Keywords</label>
                    <div className="relative">
                        <Input 
                          value={settings.seoKeywords} 
                          onChange={(e) => setSettings({...settings, seoKeywords: e.target.value})} 
                          className="pl-10"
                          placeholder="painting, renovation, color theory..."
                        />
                        <Globe className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    </div>
                 </div>

                 <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Footer Text</label>
                    <Input 
                      value={settings.footerText} 
                      onChange={(e) => setSettings({...settings, footerText: e.target.value})} 
                      placeholder="© 2024 Wall Painting Services. All rights reserved."
                    />
                 </div>
            </CardContent>
      </Card>

      {/* Page Selection - Full Width */}
      <Card>
          <CardHeader>
              <CardTitle>Page Selection</CardTitle>
              <CardDescription>Select which pages to use for homepage and blog listing.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Homepage Layout</label>
                    <select
                      value={settings.homePageId}
                      onChange={(e) => setSettings({...settings, homePageId: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="">Select a page...</option>
                      {pages.map((page) => (
                        <option key={page.id} value={page.id}>
                          {page.title}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-400">Select the page to use as your homepage.</p>
                 </div>

                 <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Blog Page</label>
                    <select
                      value={settings.blogPageId}
                      onChange={(e) => setSettings({...settings, blogPageId: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="">Select a page...</option>
                      {pages.map((page) => (
                        <option key={page.id} value={page.id}>
                          {page.title}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-400">Select the page to display blog posts.</p>
                 </div>
            </CardContent>
      </Card>

      <Card>
          <CardHeader>
              <CardTitle>Branding</CardTitle>
              <CardDescription>Upload your site logo and favicon.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Site Logo</label>
                  <ImageUpload
                    onImageSelect={(url) => setSettings({...settings, logo: url})}
                    currentImage={settings.logo}
                    label="Upload Logo"
                    folder="logos"
                  />
               </div>

               <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Favicon</label>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <ImageUpload
                        onImageSelect={(url) => setSettings({...settings, favicon: url})}
                        currentImage={settings.favicon}
                        label="Upload Favicon"
                        folder="favicons"
                      />
                    </div>
                    {settings.favicon && (
                      <div className="flex-shrink-0 p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                        <img src={settings.favicon} alt="Favicon preview" className="w-12 h-12 object-contain" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">Recommended size: 32x32 or 16x16 pixels. ICO, PNG, or SVG format.</p>
               </div>
          </CardContent>
      </Card>

      <Card>
          <CardHeader>
              <CardTitle>Top Bar</CardTitle>
              <CardDescription>Enable or disable the top bar that displays contact information and social media links.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
               <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Enable Top Bar</label>
                    <p className="text-xs text-slate-400 mt-1">Show contact information and social media links at the top of every page.</p>
                  </div>
                  <Switch
                    checked={settings.topBarEnabled}
                    onCheckedChange={(checked) => setSettings({...settings, topBarEnabled: checked})}
                  />
               </div>
          </CardContent>
      </Card>

      {/* Security & Access */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security & Access
          </CardTitle>
          <CardDescription>Configure CAPTCHA, HTTPS, and other security settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded border">
            <div>
              <div className="font-medium">Force HTTPS</div>
              <div className="text-sm text-slate-500">Redirect all traffic to secure HTTPS connection</div>
            </div>
            <Switch 
              checked={settings.forceHttps} 
              onCheckedChange={(checked) => setSettings({...settings, forceHttps: checked})}
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium">CAPTCHA Provider</label>
            <select 
              value={settings.captchaType}
              onChange={(e) => setSettings({...settings, captchaType: e.target.value})}
              className="w-full p-2 border rounded-md dark:bg-slate-800 dark:border-slate-700"
            >
              <option value="recaptcha-v2">Google reCAPTCHA v2 (Checkbox)</option>
              <option value="recaptcha-v3">Google reCAPTCHA v3 (Invisible)</option>
              <option value="cloudflare">Cloudflare Turnstile</option>
            </select>
          </div>

          {settings.captchaType === 'recaptcha-v2' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
              <div>
                <label className="block text-sm font-medium mb-1">Site Key (v2)</label>
                <Input 
                  value={settings.recaptchaV2SiteKey} 
                  onChange={(e) => setSettings({...settings, recaptchaV2SiteKey: e.target.value})}
                  type="text"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Secret Key (v2)</label>
                <Input 
                  value={settings.recaptchaV2SecretKey} 
                  onChange={(e) => setSettings({...settings, recaptchaV2SecretKey: e.target.value})}
                  type="password"
                />
              </div>
            </div>
          )}

          {settings.captchaType === 'recaptcha-v3' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
              <div>
                <label className="block text-sm font-medium mb-1">Site Key (v3)</label>
                <Input 
                  value={settings.recaptchaV3SiteKey} 
                  onChange={(e) => setSettings({...settings, recaptchaV3SiteKey: e.target.value})}
                  type="text"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Secret Key (v3)</label>
                <Input 
                  value={settings.recaptchaV3SecretKey} 
                  onChange={(e) => setSettings({...settings, recaptchaV3SecretKey: e.target.value})}
                  type="password"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Meta Tag Verification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            Site Ownership Verification (Meta Tags)
          </CardTitle>
          <CardDescription>Add meta tags to verify ownership with search engines</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Google Search Console</label>
            <Input 
              value={settings.googleSiteVerification} 
              onChange={(e) => setSettings({...settings, googleSiteVerification: e.target.value})}
              placeholder="content='...'" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bing Webmaster Tools</label>
            <Input 
              value={settings.bingSiteVerification} 
              onChange={(e) => setSettings({...settings, bingSiteVerification: e.target.value})}
              placeholder="content='...'" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Yandex verification</label>
            <Input 
              value={settings.yandexSiteVerification} 
              onChange={(e) => setSettings({...settings, yandexSiteVerification: e.target.value})}
              placeholder="content='...'" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Pinterest</label>
            <Input 
              value={settings.pinterestVerification} 
              onChange={(e) => setSettings({...settings, pinterestVerification: e.target.value})}
              placeholder="content='...'" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Facebook Domain Verification</label>
            <Input 
              value={settings.facebookDomainVerification} 
              onChange={(e) => setSettings({...settings, facebookDomainVerification: e.target.value})}
              placeholder="content='...'" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Custom Tag</label>
            <Input 
              value={settings.customVerificationTag} 
              onChange={(e) => setSettings({...settings, customVerificationTag: e.target.value})}
              placeholder="<meta name='...' content='...'>" 
            />
          </div>
        </CardContent>
      </Card>

      {/* File Upload Verification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            File Upload Verification
          </CardTitle>
          <CardDescription>Upload root verification files (HTML, TXT, JSON)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
            <div className="flex gap-2">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <div>
                <div className="font-medium text-blue-900 dark:text-blue-100 mb-1">About File Verification</div>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  Some platforms require you to upload a verification file to your root directory.
                  Files will be automatically served at: <code className="bg-white dark:bg-slate-800 px-1 rounded">example.com/filename.html</code>
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                  <strong>Supported formats:</strong> .html, .txt, .json, .xml • <strong>Maximum size:</strong> 10KB
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleUploadFile} className="space-y-4 border p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Platform
                </label>
                <select
                  value={uploadPlatform}
                  onChange={(e) => setUploadPlatform(e.target.value)}
                  className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="google">Google Search Console</option>
                  <option value="bing">Bing Webmaster Tools</option>
                  <option value="yandex">Yandex Webmaster</option>
                  <option value="pinterest">Pinterest</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Filename *
                </label>
                <input
                  type="text"
                  value={uploadFilename}
                  onChange={(e) => setUploadFilename(e.target.value)}
                  placeholder="google123abc.html"
                  className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                File Content *
              </label>
              <textarea
                value={uploadContent}
                onChange={(e) => setUploadContent(e.target.value)}
                placeholder="Paste your verification file content here..."
                rows={4}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Description (Optional)
              </label>
              <input
                type="text"
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                placeholder="e.g., Main site verification"
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <Button type="submit" disabled={uploadingFile} className="gap-2 w-full md:w-auto">
              {uploadingFile ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Uploading...</>
              ) : (
                <><Upload className="w-4 h-4" /> Upload File</>
              )}
            </Button>
          </form>

          {/* File List */}
          <div>
            <h3 className="font-semibold mb-3">Uploaded Files</h3>
            {verificationFiles.length === 0 ? (
              <div className="text-center py-6 border rounded-lg border-dashed text-slate-500">
                No verification files uploaded yet
              </div>
            ) : (
              <div className="space-y-3">
                {verificationFiles.map((file) => (
                  <div
                    key={file.platform}
                    className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900 dark:text-white capitalize">
                          {file.platform}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300 font-mono">
                          {file.filename}
                        </span>
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                        {(file.size / 1024).toFixed(2)} KB • Uploaded {new Date(file.uploadedAt).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <a 
                        href={`/${file.filename}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                        title="View File"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => handleDeleteFile(file.platform)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                        title="Delete File"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
          <CardFooter className="flex justify-between items-center border-t border-slate-100 dark:border-slate-700 pt-6 bg-slate-50 dark:bg-slate-800 rounded-b-lg">
              <span className={`text-sm flex items-center ${message.includes('❌') ? 'text-red-600' : message.includes('✅') ? 'text-green-600' : ''}`}>
                  {message && <AlertCircle size={14} className="mr-2" />}
                  {message}
              </span>
              <Button onClick={handleSave} disabled={saving}>
                  <Save size={16} className="mr-2" /> Save Changes
              </Button>
          </CardFooter>
      </Card>
    </div>
  );
}
