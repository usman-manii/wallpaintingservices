'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, X, Tag, Folder } from 'lucide-react';
import RichTextEditor from '@/components/editor/RichTextEditor';
import { useToast } from '@/components/ui/Toast';
import { fetchAPI } from '@/lib/api';

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

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featuredImage: '',
    status: 'DRAFT',
    scheduledFor: '',
    categories: [] as string[],
    tags: [] as string[],
  });

  const [availableCategories, setAvailableCategories] = useState<any[]>([]);
  const [availableTags, setAvailableTags] = useState<any[]>([]);
  const [seoPreview, setSeoPreview] = useState({
    title: '',
    description: '',
    readingTime: 0,
  });
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [showNewTag, setShowNewTag] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newTagName, setNewTagName] = useState('');

  // Fetch post data
  useEffect(() => {
    if (postId) {
      fetchPost();
      fetchCategoriesAndTags();
    }
  }, [postId]);

  const fetchPost = async () => {
    try {
      setLoadingPost(true);
      const post = await fetchAPI(`/blog/admin/posts/${postId}`);

      if (!post || !post.id) {
        throw new Error('Post not found.');
      }
      setFormData({
        title: post.title || '',
        slug: post.slug || '',
        excerpt: post.excerpt || '',
        content: post.content || '',
        featuredImage: post.featuredImage || '',
        status: post.status || 'DRAFT',
        scheduledFor: post.scheduledFor ? new Date(post.scheduledFor).toISOString().slice(0, 16) : '',
        categories: post.categories?.map((c: any) => c.id) || [],
        tags: post.tags?.map((t: any) => t.id) || [],
      });
      setSeoPreview({
        title: post.title?.substring(0, 60) || '',
        description: post.excerpt?.substring(0, 155) || '',
        readingTime: Math.ceil((post.content?.split(/\s+/).length || 0) / 200),
      });
    } catch (error: any) {
      console.error('Error fetching post:', error);
      showError(error.message || 'Failed to load post for editing.');
    } finally {
      setLoadingPost(false);
    }
  };

  const fetchCategoriesAndTags = async () => {
    try {
      // Temporarily using mock data - replace with actual API calls
      setAvailableCategories([
        { id: '1', name: 'Technology', slug: 'technology' },
        { id: '2', name: 'Design', slug: 'design' },
        { id: '3', name: 'Business', slug: 'business' },
      ]);
      
      setAvailableTags([
        { id: '1', name: 'Tutorial', slug: 'tutorial' },
        { id: '2', name: 'Guide', slug: 'guide' },
        { id: '3', name: 'Tips', slug: 'tips' },
      ]);
      
      // Uncomment when backend endpoints are ready:
      // const catRes = await fetch('http://localhost:3001/categories', {
      //   headers: { 'Authorization': `Bearer ${token}` }
      // });
      // const categories = await catRes.json();
      // setAvailableCategories(categories);

      // const tagRes = await fetch('http://localhost:3001/blog/admin/tags', {
      //   headers: { 'Authorization': `Bearer ${token}` }
      // });
      // const tags = await tagRes.json();
      // setAvailableTags(tags);
    } catch (error) {
      console.error('Error fetching categories/tags:', error);
    }
  };

  const createNewCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const newCat = await fetchAPI('/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: newCategoryName,
          slug: newCategoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        }),
      });
      if (newCat && newCat.id) {
        setAvailableCategories([...availableCategories, newCat]);
        setFormData(prev => ({ ...prev, categories: [...prev.categories, newCat.id] }));
        setNewCategoryName('');
        setShowNewCategory(false);
        success('Category created successfully');
      }
    } catch (error: any) {
      console.error('Error creating category:', error);
      showError(error.message || 'Failed to create category');
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
      });
      if (newTag && newTag.id) {
        setAvailableTags([...availableTags, newTag]);
        setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag.id] }));
        setNewTagName('');
        setShowNewTag(false);
        success('Tag created successfully');
      }
    } catch (error: any) {
      console.error('Error creating tag:', error);
      showError(error.message || 'Failed to create tag');
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
      });

      // Return full URL if relative, or use as-is if absolute
      return data.url?.startsWith('http') ? data.url : `${typeof window !== 'undefined' ? window.location.origin : ''}${data.url}`;
    } catch (error: any) {
      console.error('Image upload error:', error);
      throw new Error(error.message || 'Upload failed');
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
      });

      success('Post updated successfully!');
      router.push('/dashboard/posts');
    } catch (error: any) {
      console.error('Error updating post:', error);
      showError(error.message || 'Failed to update post. Please try again.');
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
                      <div className="text-2xl mb-2">📝</div>
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
                      <div className="text-2xl mb-2">🚀</div>
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
                      <div className="text-2xl mb-2">⏰</div>
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
                    📅 Schedule Date & Time
                  </label>
                  <Input
                    type="datetime-local"
                    value={formData.scheduledFor}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledFor: e.target.value, status: 'SCHEDULED' }))}
                    className="mb-2"
                  />
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    ⏰ This post will be automatically published on: <strong>{new Date(formData.scheduledFor).toLocaleString()}</strong>
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
                      ⏰ Scheduled
                    </span>
                  ) : formData.status === 'PUBLISHED' ? (
                    <span className="text-green-600 dark:text-green-400 font-semibold">
                      ✅ Will Publish Immediately
                    </span>
                  ) : (
                    <span className="text-slate-600 dark:text-slate-400 font-semibold">
                      📝 Draft
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
                <>⏰ Update & Schedule</>
              ) : formData.status === 'PUBLISHED' ? (
                <>🚀 Update & Publish</>
              ) : (
                <>📝 Update Draft</>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
