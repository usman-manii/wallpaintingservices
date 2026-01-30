'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Save, ArrowLeft, Eye } from 'lucide-react';
import RichTextEditor from '@/components/editor/RichTextEditor';
import { FieldLabel } from '@/components/ui/HelpText';
import { useToast } from '@/components/ui/Toast';
import { fetchAPI } from '@/lib/api';

export default function PageEditPage() {
  const router = useRouter();
  const params = useParams();
  const pageId = params?.id as string;
  const isNew = pageId === 'new';
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: [] as string[],
  });
  const [customSlug, setCustomSlug] = useState(false);
  const seoTitleLength = formData.seoTitle.length;
  const seoDescriptionLength = formData.seoDescription.length;

  const fullPath = formData.slug === '(home)' ? '' : formData.slug;
  const fullUrl = `${siteUrl}/${fullPath || ''}`.replace(/\/$/, '');

  const getProgress = (length: number, max: number) => {
    if (!max) return 0;
    return Math.min(100, Math.round((length / max) * 100));
  };

  const getSeoColor = (length: number, min: number, max: number) => {
    if (length === 0) return 'bg-slate-300';
    if (length > max) return 'bg-red-500'; // alert
    if (length < min) return 'bg-amber-500'; // warning
    return 'bg-emerald-500'; // success
  };

  const handleUrlChange = (value: string) => {
    const normalizedSite = siteUrl.replace(/\/+$/, '');
    const cleaned = value
      .replace(normalizedSite, '')
      .replace(/^https?:\/\//, '')
      .replace(new RegExp(`^${normalizedSite.replace(/https?:\/\//, '')}`), '')
      .replace(/^\/+/, '');
    setFormData(prev => ({ ...prev, slug: cleaned }));
  };

  useEffect(() => {
    if (!isNew) {
      fetchPage();
    }
  }, [pageId, isNew]);

  const fetchPage = async () => {
    try {
      setLoading(true);
      const data = await fetchAPI(`/pages/${pageId}`);
      if (data) {
        // Extract content from page builder format or use simple content
        let content = '';
        if (typeof data.content === 'string') {
          content = data.content;
        } else if (data.content?.sections) {
          // Convert page builder sections to HTML (simplified)
          content = data.content.sections
            .map((section: any) => {
              if (section.type === 'text' && section.content?.html) {
                return section.content.html;
              }
              return '';
            })
            .join('');
        }

        setFormData({
          title: data.title || '',
          slug: data.slug || '',
          content: content,
          status: data.status || 'DRAFT',
          seoTitle: data.seoTitle || '',
          seoDescription: data.seoDescription || '',
          seoKeywords: data.seoKeywords || [],
        });
        setCustomSlug(false);
      }
    } catch (error: any) {
      console.error('Error fetching page:', error);
      showError(error.message || 'Failed to load page');
    } finally {
      setLoading(false);
    }
  };

  const handleEditorChange = (html: string, text: string) => {
    setFormData(prev => ({ ...prev, content: html }));
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetchAPI('/media/upload', {
        method: 'POST',
        body: formData,
      });
      return response.url || response.path || '';
    } catch (error: any) {
      showError(error.message || 'Failed to upload image');
      throw error;
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => {
      const newSlug = customSlug ? prev.slug : generateSlug(title);
      return { ...prev, title, slug: newSlug };
    });
  };

  const handleSave = async (publish: boolean = false) => {
    if (!formData.title.trim()) {
      showError('Page title is required');
      return;
    }

    if (!formData.slug.trim()) {
      showError('Page slug is required');
      return;
    }

    setSaving(true);
    try {
      const pageData = {
        title: formData.title,
        slug: formData.slug,
        content: formData.content,
        status: publish ? 'PUBLISHED' : formData.status,
        pageType: 'STATIC',
        usePageBuilder: false,
        seoTitle: formData.seoTitle || formData.title,
        seoDescription: formData.seoDescription || formData.title,
        seoKeywords: formData.seoKeywords,
        publishedAt: publish ? new Date().toISOString() : undefined,
      };

      if (isNew) {
        const newPage = await fetchAPI('/pages', {
          method: 'POST',
          body: JSON.stringify(pageData),
        });
        success(publish ? 'Page published successfully!' : 'Page saved as draft');
        router.push(`/dashboard/pages/${newPage.id}/edit`);
      } else {
        await fetchAPI(`/pages/${pageId}`, {
          method: 'PUT',
          body: JSON.stringify(pageData),
        });
        success(publish ? 'Page published successfully!' : 'Page saved');
        fetchPage();
      }
    } catch (error: any) {
      console.error('Error saving page:', error);
      showError(error.message || 'Failed to save page');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading page...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/dashboard/pages')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Pages
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isNew ? 'Create New Page' : 'Edit Page'}
            </h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={saving}
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Draft'}
          </Button>
          <Button
            onClick={() => handleSave(true)}
            disabled={saving}
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Publishing...' : 'Publish'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Page Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <FieldLabel label="Page Title" required htmlFor="title" />
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Enter page title"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-slate-700 break-all">
                  <span className="text-slate-600">URL:</span>
                  <span className="font-medium text-slate-900">
                    {fullUrl || `${siteUrl}/page-url-slug`}
                  </span>
                  {!customSlug && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCustomSlug(true)}
                    >
                      Edit
                    </Button>
                  )}
                </div>

                {customSlug && (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      id="slug"
                      value={fullUrl || `${siteUrl}/`}
                      onChange={(e) => handleUrlChange(e.target.value)}
                      placeholder={`${siteUrl}/page-url-slug`}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCustomSlug(false);
                        setFormData(prev => ({ ...prev, slug: generateSlug(prev.title) }));
                      }}
                    >
                      Auto
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <FieldLabel label="Page Content" htmlFor="content" />
                <div className="mt-2">
                  <RichTextEditor
                    content={formData.content}
                    onChange={handleEditorChange}
                    onImageUpload={handleImageUpload}
                    minHeight="500px"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SEO Settings */}
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <FieldLabel label="SEO Title" htmlFor="seoTitle" />
                <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                  <span>Characters</span>
                  <span className={`${seoTitleLength > 60 ? 'text-red-600' : seoTitleLength < 50 ? 'text-amber-600' : ''}`}>
                    {seoTitleLength}/60
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden mb-2">
                  <div
                    className={`h-full transition-all duration-200 ${getSeoColor(seoTitleLength, 50, 60)}`}
                    style={{ width: `${getProgress(seoTitleLength, 60)}%` }}
                  />
                </div>
                <Input
                  id="seoTitle"
                  value={formData.seoTitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, seoTitle: e.target.value }))}
                  placeholder={formData.title || 'SEO title (defaults to page title)'}
                />
              </div>

              <div>
                <FieldLabel label="SEO Description" htmlFor="seoDescription" />
                <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                  <span>Characters</span>
                  <span className={`${seoDescriptionLength > 160 ? 'text-red-600' : seoDescriptionLength < 50 ? 'text-amber-600' : ''}`}>
                    {seoDescriptionLength}/160
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden mb-2">
                  <div
                    className={`h-full transition-all duration-200 ${getSeoColor(seoDescriptionLength, 50, 160)}`}
                    style={{ width: `${getProgress(seoDescriptionLength, 160)}%` }}
                  />
                </div>
                <textarea
                  id="seoDescription"
                  value={formData.seoDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, seoDescription: e.target.value }))}
                  placeholder={formData.title || 'SEO description (defaults to page title)'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Page Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'DRAFT' | 'PUBLISHED' }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                </select>
              </div>

              {formData.status === 'PUBLISHED' && formData.slug && (
                <div>
                  <a
                    href={`/${formData.slug === '(home)' ? '' : formData.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                  >
                    <Eye className="w-4 h-4" />
                    View Page
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
