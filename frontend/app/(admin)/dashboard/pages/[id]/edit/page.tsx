'use client';

import logger from '@/lib/logger';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Save, ArrowLeft, Eye } from 'lucide-react';
import RichTextEditor from '@/components/editor/RichTextEditor';
import { FieldLabel } from '@/components/ui/HelpText';
import { useToast } from '@/components/ui/Toast';
import { fetchAPI } from '@/lib/api';
import { getErrorMessage } from '@/lib/error-utils';

type PageStatus = 'DRAFT' | 'PUBLISHED';

type PageFormData = {
  title: string;
  slug: string;
  content: string;
  status: PageStatus;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
};

const isRecord = (value: unknown): value is Record<string, unknown> => (
  value !== null && typeof value === 'object' && !Array.isArray(value)
);

const parseString = (value: unknown, fallback = ''): string => (
  typeof value === 'string' ? value : fallback
);

const parseStringArray = (value: unknown): string[] => (
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
);

const parseStatus = (value: unknown): PageStatus => (
  value === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT'
);

const parsePageContent = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }
  if (isRecord(value) && Array.isArray(value.sections)) {
    return value.sections
      .map((section) => {
        if (!isRecord(section)) {
          return '';
        }
        const type = parseString(section.type);
        if (type === 'text' && isRecord(section.content)) {
          return parseString(section.content.html);
        }
        return '';
      })
      .join('');
  }
  return '';
};

const parsePageResponse = (value: unknown): PageFormData | null => {
  if (!isRecord(value)) {
    return null;
  }
  return {
    title: parseString(value.title),
    slug: parseString(value.slug),
    content: parsePageContent(value.content),
    status: parseStatus(value.status),
    seoTitle: parseString(value.seoTitle),
    seoDescription: parseString(value.seoDescription),
    seoKeywords: parseStringArray(value.seoKeywords),
  };
};

export default function PageEditPage() {
  const router = useRouter();
  const params = useParams();
  const pageId = params?.id as string;
  const isNew = pageId === 'new';
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

  const [formData, setFormData] = useState<PageFormData>({
    title: '',
    slug: '',
    content: '',
    status: 'DRAFT',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: [],
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

  const fetchPage = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchAPI(`/pages/${pageId}`, { redirectOn401: false, cache: 'no-store' });
      const parsed = parsePageResponse(data);
      if (parsed) {
        setFormData(parsed);
        setCustomSlug(false);
      } else {
        showError('Failed to load page data.');
      }
    } catch (error: unknown) {
      logger.error('Error fetching page:', error);
      showError(getErrorMessage(error, 'Failed to load page'));
    } finally {
      setLoading(false);
    }
  }, [pageId, showError]);

  useEffect(() => {
    if (!isNew) {
      fetchPage();
    }
  }, [pageId, isNew, fetchPage]);

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
        redirectOn401: false,
        cache: 'no-store',
      });
      if (isRecord(response)) {
        const url = parseString(response.url) || parseString(response.path);
        if (url) {
          return url;
        }
      }
      throw new Error('Upload completed but no URL returned');
    } catch (error: unknown) {
      showError(getErrorMessage(error, 'Failed to upload image'));
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
          redirectOn401: false,
          cache: 'no-store',
        });
        success(publish ? 'Page published successfully!' : 'Page saved as draft');
        const newPageId = isRecord(newPage) ? parseString(newPage.id) : '';
        if (!newPageId) {
          showError('Page saved, but the response was missing the page ID.');
          return;
        }
        router.push(`/dashboard/pages/${newPageId}/edit`);
      } else {
        await fetchAPI(`/pages/${pageId}`, {
          method: 'PUT',
          body: JSON.stringify(pageData),
          redirectOn401: false,
          cache: 'no-store',
        });
        success(publish ? 'Page published successfully!' : 'Page saved');
        fetchPage();
      }
    } catch (error: unknown) {
      logger.error('Error saving page:', error);
      showError(getErrorMessage(error, 'Failed to save page'));
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


