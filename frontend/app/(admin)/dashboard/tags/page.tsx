'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useConfirmDialog } from '@/components/ui/ConfirmDialog';
import { fetchAPI } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner, LoadingSkeleton } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Tooltip, InfoTooltip } from '@/components/ui/Tooltip';
import { InlineMessage } from '@/components/ui/InlineMessage';
import { Tag as TagIcon, Plus, Edit, Trash2, Merge, TrendingUp, Star, Hash, Search, X } from 'lucide-react';

type Tag = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  usageCount: number;
  trending: boolean;
  featured: boolean;
  parent?: { id: string; name: string };
  children?: Tag[];
  posts?: { id: string }[];
};

export default function TagManagementPage() {
  const { success, error: showError, warning, info } = useToast();
  const { dialog, confirm } = useConfirmDialog();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#3b82f6',
    icon: '',
    parentId: '',
  });

  const fetchTags = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAPI('/blog/admin/tags', { redirectOn401: false, cache: 'no-store' });
      setTags(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Error fetching tags:', error);
      showError(error.message || 'Failed to fetch tags');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchAPI('/blog/admin/tags', {
        method: 'POST',
        body: JSON.stringify(formData),
        redirectOn401: false,
        cache: 'no-store',
      });
      success('Tag created successfully!');
      setShowCreateModal(false);
      resetForm();
      fetchTags();
    } catch (error: any) {
      console.error('Error creating tag:', error);
      showError(error.message || 'Failed to create tag');
    }
  };

  const handleUpdateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTag) return;

    try {
      await fetchAPI(`/blog/admin/tags/${editingTag.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
        redirectOn401: false,
        cache: 'no-store',
      });
      success('Tag updated successfully!');
      setEditingTag(null);
      resetForm();
      fetchTags();
    } catch (error: any) {
      console.error('Error updating tag:', error);
      showError(error.message || 'Failed to update tag');
    }
  };

  const handleDeleteTag = async (id: string, name: string, usageCount: number) => {
    confirm(
      'Delete Tag',
      <>
        <p className="mb-2">Are you sure you want to delete tag <strong>{name}</strong>?</p>
        {usageCount > 0 && (
          <InlineMessage type="warning">
            This tag is used in {usageCount} post{usageCount !== 1 ? 's' : ''}. It will be removed from all posts.
          </InlineMessage>
        )}
      </>,
      async () => {
        try {
              try {
            await fetchAPI(`/blog/admin/tags/${id}`, { method: 'DELETE', redirectOn401: false, cache: 'no-store' });
            success('Tag deleted successfully!');
            fetchTags();
          } catch (error: any) {
            console.error('Error deleting tag:', error);
            showError(error.message || 'Failed to delete tag');
          }
        } catch (error) {
          console.error('Error deleting tag:', error);
          showError('Failed to delete tag');
        }
      },
      'danger'
    );
  };

  const [mergeTargetId, setMergeTargetId] = useState('');

  const handleMergeTags = async () => {
    if (selectedTags.size < 2) {
      warning('Please select at least 2 tags to merge');
      return;
    }

    // Show a confirm dialog with an inline input for target ID
    confirm(
      'Merge Tags',
      (
        <div>
          <p className="mb-2">Enter the ID of the target tag (the one to keep):</p>
          <input
            type="text"
            value={mergeTargetId}
            onChange={(e) => setMergeTargetId(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Target tag ID"
          />
        </div>
      ),
      async () => {
        if (!mergeTargetId.trim()) {
          warning('Please enter a valid target tag ID');
          return;
        }

        const sourceIds = Array.from(selectedTags).filter(id => id !== mergeTargetId);

        try {
          await fetchAPI('/blog/admin/tags/merge', {
            method: 'POST',
            body: JSON.stringify({ sourceIds, targetId: mergeTargetId }),
            redirectOn401: false,
            cache: 'no-store',
          });
          success('Tags merged successfully!');
          setSelectedTags(new Set());
          setShowMergeModal(false);
          setMergeTargetId('');
          fetchTags();
        } catch (error: any) {
          console.error('Error merging tags:', error);
          showError(error.message || 'Failed to merge tags');
        }
      },
      'danger'
    );
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      color: '#3b82f6',
      icon: '',
      parentId: '',
    });
  };

  const openEditModal = (tag: Tag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      slug: tag.slug,
      description: tag.description || '',
      color: tag.color || '#3b82f6',
      icon: tag.icon || '',
      parentId: tag.parent?.id || '',
    });
  };

  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tag.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const rootTags = filteredTags.filter(tag => !tag.parent);

  const renderTagTree = (tag: Tag, level: number = 0) => (
    <div key={tag.id} className={`${level > 0 ? 'ml-8 border-l-2 border-slate-200 dark:border-slate-700 pl-4' : ''}`}>
      <div className="flex items-center gap-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 px-4 rounded">
        <input
          type="checkbox"
          checked={selectedTags.has(tag.id)}
          onChange={() => {
            const newSelected = new Set(selectedTags);
            if (newSelected.has(tag.id)) {
              newSelected.delete(tag.id);
            } else {
              newSelected.add(tag.id);
            }
            setSelectedTags(newSelected);
          }}
        />

        <div
          className="w-4 h-4 rounded"
          style={{ backgroundColor: tag.color || '#3b82f6' }}
        />

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-900 dark:text-white">{tag.name}</span>
            {tag.trending && (
              <Tooltip content="This tag is currently trending">
                <Badge variant="error" size="sm">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Trending
                </Badge>
              </Tooltip>
            )}
            {tag.featured && (
              <Tooltip content="Featured tag">
                <Badge variant="warning" size="sm">
                  <Star className="w-3 h-3 mr-1" />
                  Featured
                </Badge>
              </Tooltip>
            )}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {tag.slug} • {tag.usageCount} posts
            {tag.description && ` • ${tag.description}`}
          </div>
        </div>

        <div className="flex gap-2">
          <Tooltip content="Edit tag">
            <Button size="sm" variant="secondary" onClick={() => openEditModal(tag)}>
              <Edit className="w-4 h-4" />
            </Button>
          </Tooltip>
          <Tooltip content="Delete tag">
            <Button size="sm" variant="danger" onClick={() => handleDeleteTag(tag.id, tag.name, tag.usageCount || 0)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </Tooltip>
        </div>
      </div>

      {tag.children && tag.children.length > 0 && (
        <div className="ml-4">
          {tag.children.map(child => renderTagTree(child, level + 1))}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Tag Management</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Manage hierarchical tags with usage analytics
          </p>
        </div>
        <div className="flex gap-3">
          {selectedTags.size >= 2 && (
            <Tooltip content="Merge selected tags into one">
              <Button variant="secondary" onClick={() => setShowMergeModal(true)}>
                <Merge className="w-4 h-4 mr-2" />
                Merge {selectedTags.size} Tags
              </Button>
            </Tooltip>
          )}
          <Tooltip content="Create a new tag">
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Tag
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          type="search"
          placeholder="Search tags by name or slug..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tags List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6">
              <LoadingSkeleton lines={5} />
            </div>
          ) : rootTags.length === 0 ? (
            <EmptyState
              icon={searchQuery ? <Search className="w-16 h-16" /> : <TagIcon className="w-16 h-16" />}
              title={searchQuery ? 'No tags found' : 'No tags yet'}
              description={searchQuery ? 'Try a different search term' : 'Create your first tag to get started organizing your content'}
              actionLabel={searchQuery ? undefined : 'Create Tag'}
              onAction={searchQuery ? undefined : () => setShowCreateModal(true)}
              variant={searchQuery ? 'search' : 'default'}
            />
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {rootTags.map(tag => renderTagTree(tag))}
            </div>
          )}
        </CardContent>
      </Card>
      {dialog}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingTag) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>{editingTag ? 'Edit Tag' : 'Create New Tag'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={editingTag ? handleUpdateTag : handleCreateTag} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-2">
                      Name *
                      <InfoTooltip content="The display name for this tag" />
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        name: e.target.value,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                      }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-2">
                      Slug *
                      <InfoTooltip content="URL-friendly identifier (auto-generated from name)" />
                    </label>
                    <Input
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2">
                    Description
                    <InfoTooltip content="Optional description shown in tag listings" />
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-600"
                    rows={3}
                    placeholder="Brief description of this tag..."
                  />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium mb-2">
                        Color
                        <InfoTooltip content="Visual color for this tag" />
                      </label>
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                        className="w-full h-10 rounded cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium mb-2">
                        Icon
                        <InfoTooltip content="Emoji or icon name to display with tag" />
                      </label>
                      <Input
                        value={formData.icon}
                        onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                        placeholder="🏷️ or icon-name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-2">
                       Parent Tag
                       <InfoTooltip content="Create tag hierarchies by selecting a parent tag" />
                    </label>
                    <select
                      value={formData.parentId}
                      onChange={(e) => setFormData(prev => ({ ...prev, parentId: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-600"
                    >
                      <option value="">None (Root Tag)</option>
                      {tags.filter(t => t.id !== editingTag?.id).map(tag => (
                        <option key={tag.id} value={tag.id}>{tag.name}</option>
                      ))}
                    </select>
                  </div>

                <div className="flex gap-3 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingTag(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingTag ? 'Update Tag' : 'Create Tag'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Merge Modal */}
      {showMergeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Merge Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Selected {selectedTags.size} tags. Choose which tag to keep:
              </p>
              <div className="space-y-2 mb-6">
                {Array.from(selectedTags).map(id => {
                  const tag = tags.find(t => t.id === id);
                  return tag ? (
                    <div key={id} className="p-2 border rounded dark:border-slate-600">
                      {tag.name} ({tag.usageCount} posts)
                    </div>
                  ) : null;
                })}
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowMergeModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleMergeTags}>
                  Merge Tags
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
