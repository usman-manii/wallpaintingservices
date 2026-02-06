'use client';

import logger from '@/lib/logger';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, X, Tag, Folder } from 'lucide-react';
import RichTextEditor from '@/components/editor/RichTextEditor';
import { useToast } from '@/components/ui/Toast';
import { fetchAPI } from '@/lib/api';
import { getErrorMessage } from '@/lib/error-utils';

type PostStatus = 'DRAFT' | 'PUBLISHED' | 'SCHEDULED';

type EditPostFormData = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  status: PostStatus;
  scheduledFor: string;
  categories: string[];
  tags: string[];
};

type OptionItem = {
  id: string;
  name: string;
};

type SeoPreview = {
  title: string;
  description: string;
  readingTime: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> => (
  value !== null && typeof value === 'object' && !Array.isArray(value)
);

const parseString = (value: unknown, fallback = ''): string => (
  typeof value === 'string' ? value : fallback
);

const parseOptionItem = (value: unknown): OptionItem | null => {
  if (!isRecord(value)) {
    return null;
  }
  const id = parseString(value.id);
  const name = parseString(value.name);
  if (!id || !name) {
    return null;
  }
  return { id, name };
};

const parseOptionList = (value: unknown): OptionItem[] => (
  Array.isArray(value)
    ? value.map(parseOptionItem).filter((item): item is OptionItem => !!item)
    : []
);

const parseIdList = (value: unknown): string[] => (
  Array.isArray(value)
    ? value
        .map((entry) => (isRecord(entry) ? parseString(entry.id) : ''))
        .filter((id) => id.length > 0)
    : []
);

const parseStatus = (value: unknown): PostStatus => (
  value === 'PUBLISHED' || value === 'SCHEDULED' ? value : 'DRAFT'
);

const parseScheduledFor = (value: unknown): string => {
  const dateString = parseString(value);
  if (!dateString) {
    return '';
  }
  const parsedDate = new Date(dateString);
  return Number.isNaN(parsedDate.getTime()) ? '' : parsedDate.toISOString().slice(0, 16);
};

const parseUploadUrl = (value: unknown): string => {
  if (!isRecord(value)) {
    return '';
  }
  return parseString(value.url) || parseString(value.path);
};

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingPost, setLoadingPost] = useState(true);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const [formData, setFormData] = useState<EditPostFormData>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featuredImage: '',
    status: 'DRAFT',
    scheduledFor: '',
    categories: [],
    tags: [],
  });

  const [availableCategories, setAvailableCategories] = useState<OptionItem[]>([]);
  const [availableTags, setAvailableTags] = useState<OptionItem[]>([]);
  const [seoPreview, setSeoPreview] = useState<SeoPreview>({
    title: '',
    description: '',
    readingTime: 0,
  });
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [showNewTag, setShowNewTag] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newTagName, setNewTagName] = useState('');

  const fetchPost = useCallback(async () => {
    try {
      setLoadingPost(true);
      const post = await fetchAPI(`/blog/admin/posts/${postId}`, { redirectOn401: false, cache: 'no-store' });

      if (!isRecord(post)) {
        throw new Error('Post not found.');
      }
      const postKey = parseString(post.id);
      if (!postKey) {
        throw new Error('Post not found.');
      }
      const content = parseString(post.content);
      setFormData({
        title: parseString(post.title),
        slug: parseString(post.slug),
        excerpt: parseString(post.excerpt),
        content,
        featuredImage: parseString(post.featuredImage),
        status: parseStatus(post.status),
        scheduledFor: parseScheduledFor(post.scheduledFor),
        categories: parseIdList(post.categories),
        tags: parseIdList(post.tags),
      });
      setSeoPreview({
        title: parseString(post.title).substring(0, 60),
        description: parseString(post.excerpt).substring(0, 155),
        readingTime: Math.ceil((content.split(/\s+/).filter(Boolean).length || 0) / 200),
      });
    } catch (error: unknown) {
      logger.error('Error fetching post:', error);
      showError(getErrorMessage(error, 'Failed to load post for editing.'));
    } finally {
      setLoadingPost(false);
    }
  }, [postId, showError]);

  const fetchCategoriesAndTags = useCallback(async () => {
    try {
      const [categories, tags] = await Promise.all([
        fetchAPI('/categories', { redirectOn401: false, cache: 'no-store' }).catch(() => []),
        fetchAPI('/blog/admin/tags', { redirectOn401: false, cache: 'no-store' }).catch(() => []),
      ]);
      setAvailableCategories(parseOptionList(categories));
      setAvailableTags(parseOptionList(tags));
    } catch (error: unknown) {
      logger.error('Error fetching categories/tags:', error);
      showError(getErrorMessage(error, 'Failed to load categories or tags'));
    }
  }, [showError]);

  // Fetch post data
  useEffect(() => {
    if (postId) {
      fetchPost();
      fetchCategoriesAndTags();
    }
  }, [postId, fetchPost, fetchCategoriesAndTags]);

  const createNewCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const newCat = await fetchAPI('/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: newCategoryName,
          slug: newCategoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        }),
        redirectOn401: false,
        cache: 'no-store',
      });
      const parsedCategory = parseOptionItem(newCat);
      if (parsedCategory) {
        setAvailableCategories([...availableCategories, parsedCategory]);
        setFormData(prev => ({ ...prev, categories: [...prev.categories, parsedCategory.id] }));
        setNewCategoryName('');
        setShowNewCategory(false);
        success('Category created successfully');
      } else {
        showError('Category created, but the response was missing required data.');
      }
    } catch (error: unknown) {
      logger.error('Error creating category:', error);
      showError(getErrorMessage(error, 'Failed to create category'));
    }
  };

  const createNewTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const newTag = await fetchAPI('/blog/admin/tags', {
        method: 'POST',
        body: JSON.stringify({
          name: newTagName,
          slug: newTagName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        }),
        redirectOn401: false,
        cache: 'no-store',
      });
      const parsedTag = parseOptionItem(newTag);
      if (parsedTag) {
        setAvailableTags([...availableTags, parsedTag]);
        setFormData(prev => ({ ...prev, tags: [...prev.tags, parsedTag.id] }));
        setNewTagName('');
        setShowNewTag(false);
        success('Tag created successfully');
      } else {
        showError('Tag created, but the response was missing required data.');
      }
    } catch (error: unknown) {
      logger.error('Error creating tag:', error);
      showError(getErrorMessage(error, 'Failed to create tag'));
    }
  };

  const toggleCategory = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...prev.categories, categoryId]
    }));
  };

  const toggleTag = (tagId: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter(id => id !== tagId)
        : [...prev.tags, tagId]
    }));
  };

  // Handle editor content changes
  const handleEditorChange = (html: string, text: string, wordCount: number) => {
    setFormData(prev => ({ ...prev, content: html }));
    
    // Calculate reading time
    const readingTime = Math.ceil(wordCount / 200);
    
    // Generate SEO description from first 155 chars
    const plainText = text.substring(0, 155);
    
    setSeoPreview(prev => ({
      ...prev,
      readingTime,
      description: plainText,
    }));
  };

  // Handle image upload for editor
  const handleImageUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const data = await fetchAPI('/media/upload', {
        method: 'POST',
        body: formData,
        redirectOn401: false,
      });

      const uploadedUrl = parseUploadUrl(data);
      if (!uploadedUrl) {
        throw new Error('Upload succeeded but no URL was returned');
      }
      const baseUrl = origin || (typeof window !== 'undefined' ? window.location.origin : '');
      return uploadedUrl.startsWith('http') ? uploadedUrl : `${baseUrl}${uploadedUrl}`;
    } catch (error: unknown) {
      logger.error('Image upload error:', error);
      throw new Error(getErrorMessage(error, 'Upload failed'));
    }
  };

  // Auto-generate slug from title
  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    }));
    
    // Update SEO preview
    setSeoPreview(prev => ({
      ...prev,
      title: title.substring(0, 60),
    }));
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await fetchAPI(`/blog/${postId}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: formData.title,
          slug: formData.slug,
          excerpt: formData.excerpt,
          content: formData.content,
          featuredImage: formData.featuredImage,
          status: formData.status,
          scheduledFor: formData.scheduledFor ? new Date(formData.scheduledFor).toISOString() : null,
          categoryIds: formData.categories,
          tagIds: formData.tags,
        }),
        redirectOn401: false,
      });

      success('Post updated successfully!');
      router.push('/dashboard/posts');
    } catch (error: unknown) {
      logger.error('Error updating post:', error);
      showError(getErrorMessage(error, 'Failed to update post. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  if (loadingPost) {
    return (
      <div className="p-8">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-lg text-slate-600 dark:text-slate-400">Loading post...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Edit Post</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Update your blog post with enhanced SEO and AI features
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Post Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Title *
                </label>
                <Input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Enter post title..."
                  required
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Slug (URL) *
                </label>
                <Input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="post-slug-here"
                  required
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  URL: /blog/{formData.slug || 'post-slug-here'}
                </p>
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Excerpt
                </label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="Brief summary of the post..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg 
                           bg-white dark:bg-slate-800 text-slate-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Content Editor */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Content *
                </label>
                
                <RichTextEditor
                  content={formData.content}
                  onChange={handleEditorChange}
                  onImageUpload={handleImageUpload}
                  placeholder="Write your blog post content here..."
                  minHeight="400px"
                  className="border-slate-300 dark:border-slate-600"
                />
              </div>

              {/* Featured Image */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Featured Image URL
                </label>
                <Input
                  type="url"
                  value={formData.featuredImage}
                  onChange={(e) => setFormData(prev => ({ ...prev, featuredImage: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                />
                {formData.featuredImage && (
                  <img 
                    src={formData.featuredImage} 
                    alt="Preview" 
                    className="mt-2 max-h-48 rounded-lg border border-slate-300 dark:border-slate-600"
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Categories & Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Categories & Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Categories */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    <Folder className="inline mr-1" size={16} />
                    Categories
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setShowNewCategory(!showNewCategory)}
                  >
                    <Plus size={14} className="mr-1" />
                    New Category
                  </Button>
                </div>

                {showNewCategory && (
                  <div className="mb-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Category name..."
                        className="flex-1"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), createNewCategory())}
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={createNewCategory}
                        disabled={!newCategoryName.trim()}
                      >
                        Add
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setShowNewCategory(false);
                          setNewCategoryName('');
                        }}
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Category Selection */}
                <div className="flex flex-wrap gap-2">
                  {availableCategories.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      No categories yet. Create your first category above.
                    </p>
                  ) : (
                    <>
                      {availableCategories.map((category) => (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => toggleCategory(category.id)}
                          className={`px-3 py-1.5 rounded-lg border-2 text-sm transition-all ${
                            formData.categories.includes(category.id)
                              ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                              : 'border-slate-300 dark:border-slate-600 hover:border-purple-400'
                          }`}
                        >
                          {category.name}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    <Tag className="inline mr-1" size={16} />
                    Tags
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setShowNewTag(!showNewTag)}
                  >
                    <Plus size={14} className="mr-1" />
                    New Tag
                  </Button>
                </div>

                {showNewTag && (
                  <div className="mb-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        placeholder="Tag name..."
                        className="flex-1"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), createNewTag())}
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={createNewTag}
                        disabled={!newTagName.trim()}
                      >
                        Add
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setShowNewTag(false);
                          setNewTagName('');
                        }}
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Tag Selection */}
                <div className="flex flex-wrap gap-2">
                  {availableTags.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      No tags yet. Create your first tag above.
                    </p>
                  ) : (
                    <>
                      {availableTags.map((tag) => (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleTag(tag.id)}
                          className={`px-3 py-1.5 rounded-full border-2 text-sm transition-all ${
                            formData.tags.includes(tag.id)
                              ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                              : 'border-slate-300 dark:border-slate-600 hover:border-blue-400'
                          }`}
                        >
                          {tag.name}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SEO Preview */}
          <Card>
            <CardHeader>
              <CardTitle>SEO Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800">
                <div className="text-blue-600 dark:text-blue-400 text-sm mb-1">
                  {origin}/blog/{formData.slug || 'post-slug-here'}
                </div>
                <div className="text-lg text-blue-800 dark:text-blue-300 font-semibold mb-1">
                  {seoPreview.title || formData.title || 'Your Post Title Here'}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {seoPreview.description || formData.excerpt || 'Your post excerpt or first 155 characters of content will appear here...'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Publishing Options */}
          <Card>
            <CardHeader>
              <CardTitle>Publishing Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Publish Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    Publishing Type
                  </label>
                  <div className="grid md:grid-cols-3 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, status: 'DRAFT', scheduledFor: '' }))}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        formData.status === 'DRAFT' && !formData.scheduledFor
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-slate-300 dark:border-slate-600 hover:border-blue-400'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-2">Draft</div>
                        <div className="font-semibold text-slate-900 dark:text-white">Save as Draft</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Save for later</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, status: 'PUBLISHED', scheduledFor: '' }))}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        formData.status === 'PUBLISHED'
                          ? 'border-green-600 bg-green-50 dark:bg-green-900/20'
                          : 'border-slate-300 dark:border-slate-600 hover:border-green-400'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-2">Publish</div>
                        <div className="font-semibold text-slate-900 dark:text-white">Publish Immediately</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Go live now</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        tomorrow.setHours(9, 0, 0, 0);
                        setFormData(prev => ({ 
                          ...prev, 
                          status: 'SCHEDULED',
                          scheduledFor: tomorrow.toISOString().slice(0, 16)
                        }));
                      }}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        formData.scheduledFor
                          ? 'border-orange-600 bg-orange-50 dark:bg-orange-900/20'
                          : 'border-slate-300 dark:border-slate-600 hover:border-orange-400'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-2">Schedule</div>
                        <div className="font-semibold text-slate-900 dark:text-white">Schedule for Later</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Pick date & time</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Scheduled Publishing DateTime Picker */}
                {formData.scheduledFor && (
                  <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Schedule Date & Time
                    </label>
                    <Input
                      type="datetime-local"
                      value={formData.scheduledFor}
                      onChange={(e) => setFormData(prev => ({ ...prev, scheduledFor: e.target.value, status: 'SCHEDULED' }))}
                      className="mb-2"
                    />
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      This post will be automatically published on: <strong>{new Date(formData.scheduledFor).toLocaleString()}</strong>
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setFormData(prev => ({ ...prev, scheduledFor: '', status: 'DRAFT' }))}
                      className="mt-2"
                    >
                      Clear Schedule
                    </Button>
                  </div>
                )}

                {/* Status Info */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-slate-700 dark:text-slate-300">Current Status:</span>
                    {formData.scheduledFor ? (
                      <span className="text-orange-600 dark:text-orange-400 font-semibold">
                        Scheduled
                      </span>
                    ) : formData.status === 'PUBLISHED' ? (
                      <span className="text-green-600 dark:text-green-400 font-semibold">
                        Will Publish Immediately
                      </span>
                    ) : (
                      <span className="text-slate-600 dark:text-slate-400 font-semibold">
                        Draft
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/posts')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className={
                formData.scheduledFor
                  ? 'bg-orange-600 hover:bg-orange-700'
                  : formData.status === 'PUBLISHED'
                  ? 'bg-green-600 hover:bg-green-700'
                  : ''
              }
            >
              {loading ? (
                'Updating...'
              ) : formData.scheduledFor ? (
                <>Update & Schedule</>
              ) : formData.status === 'PUBLISHED' ? (
                <>Update & Publish</>
              ) : (
                <>Update Draft</>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}








