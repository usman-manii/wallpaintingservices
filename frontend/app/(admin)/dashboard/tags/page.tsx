'use client';

import logger from '@/lib/logger';

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
import { getErrorMessage } from '@/lib/error-utils';

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
  synonyms?: string[];
  linkedTagIds?: string[];
  locked?: boolean;
  mergeCount?: number;
  synonymHits?: number;
};

type TagFormData = {
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
  parentId: string;
  featured: boolean;
  synonymsText: string;
  linkedTagIds: string[];
  locked: boolean;
};

type DuplicateTagSummary = {
  id: string;
  name: string;
};

type DuplicateTagPair = {
  a: DuplicateTagSummary;
  b: DuplicateTagSummary;
  score: number;
};

const DEFAULT_TAG_FORM: TagFormData = {
  name: '',
  slug: '',
  description: '',
  color: '#3b82f6',
  icon: '',
  parentId: '',
  featured: false,
  synonymsText: '',
  linkedTagIds: [],
  locked: false,
};

const isRecord = (value: unknown): value is Record<string, unknown> => (
  value !== null && typeof value === 'object' && !Array.isArray(value)
);

const parseString = (value: unknown, fallback = ''): string => (
  typeof value === 'string' ? value : fallback
);

const parseOptionalString = (value: unknown): string | undefined => {
  const parsed = parseString(value).trim();
  return parsed ? parsed : undefined;
};

const parseBoolean = (value: unknown, fallback = false): boolean => (
  typeof value === 'boolean' ? value : fallback
);

const parseNumber = (value: unknown, fallback = 0): number => (
  typeof value === 'number' && Number.isFinite(value) ? value : fallback
);

const parseStringArray = (value: unknown): string[] => (
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
);

const slugFromName = (name: string): string => (
  name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
);

const parseTagSummary = (value: unknown): DuplicateTagSummary | null => {
  if (!isRecord(value)) {
    return null;
  }
  const id = parseString(value.id);
  if (!id) {
    return null;
  }
  return {
    id,
    name: parseString(value.name, 'Unknown tag'),
  };
};

const parseTag = (value: unknown): Tag | null => {
  if (!isRecord(value)) {
    return null;
  }
  const id = parseString(value.id);
  const name = parseString(value.name);
  if (!id || !name) {
    return null;
  }
  const slug = parseString(value.slug) || slugFromName(name);
  const parentRaw = isRecord(value.parent) ? value.parent : null;
  const parentId = parentRaw ? parseString(parentRaw.id) : '';
  const parentName = parentRaw ? parseString(parentRaw.name) : '';
  const parent = parentId ? { id: parentId, name: parentName || parentId } : undefined;
  const children = Array.isArray(value.children)
    ? value.children.map(parseTag).filter((child): child is Tag => !!child)
    : undefined;
  const posts = Array.isArray(value.posts)
    ? value.posts
        .map((post) => {
          if (!isRecord(post)) {
            return null;
          }
          const postId = parseString(post.id);
          return postId ? { id: postId } : null;
        })
        .filter((post): post is { id: string } => !!post)
    : undefined;
  const synonyms = parseStringArray(value.synonyms);
  const linkedTagIds = parseStringArray(value.linkedTagIds);
  return {
    id,
    name,
    slug,
    description: parseOptionalString(value.description),
    color: parseOptionalString(value.color),
    icon: parseOptionalString(value.icon),
    usageCount: parseNumber(value.usageCount),
    trending: parseBoolean(value.trending),
    featured: parseBoolean(value.featured),
    parent,
    children,
    posts,
    synonyms: synonyms.length > 0 ? synonyms : undefined,
    linkedTagIds: linkedTagIds.length > 0 ? linkedTagIds : undefined,
    locked: parseBoolean(value.locked),
    mergeCount: parseNumber(value.mergeCount),
    synonymHits: parseNumber(value.synonymHits),
  };
};

const parseTagsList = (value: unknown): Tag[] => (
  Array.isArray(value) ? value.map(parseTag).filter((tag): tag is Tag => !!tag) : []
);

const parseDuplicatePair = (value: unknown): DuplicateTagPair | null => {
  if (!isRecord(value)) {
    return null;
  }
  const a = parseTagSummary(value.a);
  const b = parseTagSummary(value.b);
  if (!a || !b) {
    return null;
  }
  return {
    a,
    b,
    score: parseNumber(value.score),
  };
};

export default function TagManagementPage() {
  const { success, error: showError, warning, info } = useToast();
  const { dialog, confirm } = useConfirmDialog();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [usageBands, setUsageBands] = useState<{low: number; high: number}>({ low: 0, high: 0 });
  const [loadingDuplicates, setLoadingDuplicates] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateTagPair[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState<TagFormData>(DEFAULT_TAG_FORM);

  const fetchTags = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAPI('/blog/admin/tags', { redirectOn401: false, cache: 'no-store' });
      const list = parseTagsList(data);
      setTags(list);
      // precompute usage bands for legend
      if (list.length > 0) {
        const usage = list.map((tag) => tag.usageCount || 0).sort((a, b) => a - b);
        const p75 = usage[Math.floor(usage.length * 0.75)] || 0;
        const p50 = usage[Math.floor(usage.length * 0.5)] || 0;
        setUsageBands({ low: p50, high: p75 });
      } else {
        setUsageBands({ low: 0, high: 0 });
      }
    } catch (error: unknown) {
      logger.error('Error fetching tags:', error);
      showError(getErrorMessage(error, 'Failed to fetch tags'));
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const buildPayload = () => {
    const synonyms = formData.synonymsText
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);

    return {
      name: formData.name,
      slug: formData.slug,
      description: formData.description || undefined,
      color: formData.color,
      icon: formData.icon || undefined,
      parentId: formData.parentId || undefined,
      featured: formData.featured,
      synonyms,
      linkedTagIds: formData.linkedTagIds,
      locked: formData.locked,
    };
  };

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchAPI('/blog/admin/tags', {
        method: 'POST',
        body: JSON.stringify(buildPayload()),
        redirectOn401: false,
        cache: 'no-store',
      });
      success('Tag created successfully!');
      setShowCreateModal(false);
      resetForm();
      fetchTags();
    } catch (error: unknown) {
      logger.error('Error creating tag:', error);
      showError(getErrorMessage(error, 'Failed to create tag'));
    }
  };

  const handleUpdateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTag) return;

    try {
      await fetchAPI(`/blog/admin/tags/${editingTag.id}`, {
        method: 'PUT',
        body: JSON.stringify(buildPayload()),
        redirectOn401: false,
        cache: 'no-store',
      });
      success('Tag updated successfully!');
      setEditingTag(null);
      resetForm();
      fetchTags();
    } catch (error: unknown) {
      logger.error('Error updating tag:', error);
      showError(getErrorMessage(error, 'Failed to update tag'));
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
          await fetchAPI(`/blog/admin/tags/${id}`, { method: 'DELETE', redirectOn401: false, cache: 'no-store' });
          success('Tag deleted successfully!');
          fetchTags();
        } catch (error: unknown) {
          logger.error('Error deleting tag:', error);
          showError(getErrorMessage(error, 'Failed to delete tag'));
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
        } catch (error: unknown) {
          logger.error('Error merging tags:', error);
          showError(getErrorMessage(error, 'Failed to merge tags'));
        }
      },
      'danger'
    );
  };

  const handleBulkParentPrompt = async () => {
    if (selectedTags.size === 0) return;
    const parentId = prompt('Enter parent tag ID (leave blank to set as root):') || '';
    try {
      await fetchAPI('/blog/admin/tags/bulk/parent', {
        method: 'POST',
        body: JSON.stringify({ ids: Array.from(selectedTags), parentId: parentId || null }),
        redirectOn401: false,
        cache: 'no-store',
      });
      success('Parent updated for selected tags');
      fetchTags();
    } catch (error: unknown) {
      logger.error('Bulk parent update error:', error);
      showError(getErrorMessage(error, 'Failed to update parent'));
    }
  };

  const handleBulkStylePrompt = async () => {
    if (selectedTags.size === 0) return;
    const color = prompt('Hex color (leave blank to keep current):', '#3b82f6') || undefined;
    const icon = prompt('Icon/emoji (leave blank to keep current):', '') || undefined;
    try {
      await fetchAPI('/blog/admin/tags/bulk/style', {
        method: 'POST',
        body: JSON.stringify({ ids: Array.from(selectedTags), color: color || undefined, icon: icon || undefined }),
        redirectOn401: false,
        cache: 'no-store',
      });
      success('Style updated');
      fetchTags();
    } catch (error: unknown) {
      logger.error('Bulk style update error:', error);
      showError(getErrorMessage(error, 'Failed to update style'));
    }
  };

  const handleBulkLock = async (locked: boolean) => {
    if (selectedTags.size === 0) return;
    try {
      await fetchAPI('/blog/admin/tags/lock', {
        method: 'POST',
        body: JSON.stringify({ ids: Array.from(selectedTags), locked }),
        redirectOn401: false,
        cache: 'no-store',
      });
      success(locked ? 'Tags locked' : 'Tags unlocked');
      fetchTags();
    } catch (error: unknown) {
      logger.error('Bulk lock error:', error);
      showError(getErrorMessage(error, 'Failed to update lock state'));
    }
  };

  const handleConvertTags = async () => {
    if (selectedTags.size === 0) return;
    try {
      await fetchAPI('/blog/admin/tags/convert-to-category', {
        method: 'POST',
        body: JSON.stringify({ ids: Array.from(selectedTags) }),
        redirectOn401: false,
        cache: 'no-store',
      });
      success('Converted tags to categories');
      fetchTags();
    } catch (error: unknown) {
      logger.error('Convert tags error:', error);
      showError(getErrorMessage(error, 'Failed to convert tags'));
    }
  };

  const handleFetchDuplicates = async () => {
    setLoadingDuplicates(true);
    try {
      const data = await fetchAPI('/blog/admin/tags/duplicates', { redirectOn401: false, cache: 'no-store' });
      const list = Array.isArray(data)
        ? data.map(parseDuplicatePair).filter((item): item is DuplicateTagPair => !!item)
        : [];
      setDuplicates(list);
    } catch (error: unknown) {
      logger.error('Duplicates fetch error:', error);
      showError(getErrorMessage(error, 'Failed to fetch duplicates'));
    } finally {
      setLoadingDuplicates(false);
    }
  };

  const resetForm = () => {
    setFormData(DEFAULT_TAG_FORM);
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
      featured: tag.featured || false,
      synonymsText: tag.synonyms?.join(', ') || '',
      linkedTagIds: tag.linkedTagIds || [],
      locked: tag.locked || false,
    });
  };

  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tag.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const rootTags = filteredTags.filter(tag => !tag.parent);

  const getUsageLevel = (count: number) => {
    if (count >= usageBands.high) return 'high';
    if (count >= usageBands.low) return 'medium';
    return 'low';
  };

  const usageColor = (level: 'high' | 'medium' | 'low') => {
    switch (level) {
      case 'high': return '#ef4444'; // red
      case 'medium': return '#22c55e'; // green
      default: return '#94a3b8'; // slate
    }
  };

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

        <Tooltip content={`Tag color ${tag.color || '#3b82f6'} (used for chips & badges)`}>
          <div
            className="w-4 h-4 rounded border border-slate-200 dark:border-slate-700"
            style={{ backgroundColor: tag.color || '#3b82f6' }}
          />
        </Tooltip>

        <Tooltip content={`Usage heat: ${getUsageLevel(tag.usageCount || 0)} (${tag.usageCount || 0} uses)`}>
          <div
            className="w-3 h-3 rounded-full border border-slate-200 dark:border-slate-700 ml-1"
            style={{ backgroundColor: usageColor(getUsageLevel(tag.usageCount || 0)) }}
          />
        </Tooltip>

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
            {tag.locked && (
              <Badge variant="outline" size="sm">
                Locked
              </Badge>
            )}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {tag.slug} - {tag.usageCount} posts
            {tag.description && ` - ${tag.description}`}
            {tag.synonyms && tag.synonyms.length > 0 && ` - Synonyms: ${tag.synonyms.slice(0,3).join(', ')}${tag.synonyms.length>3?'...':''}`}
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
            Manage hierarchical tags with usage analytics. Left swatch = tag pill color; right dot = usage heat (low/med/high).
          </p>
        </div>
        <div className="flex gap-3">
          {selectedTags.size >= 2 && (
            <>
              <Tooltip content="Merge selected tags into one">
                <Button variant="secondary" onClick={() => setShowMergeModal(true)}>
                  <Merge className="w-4 h-4 mr-2" />
                  Merge {selectedTags.size} Tags
                </Button>
              </Tooltip>
              <Button variant="outline" onClick={handleBulkParentPrompt}>
                Set Parent
              </Button>
              <Button variant="outline" onClick={handleBulkStylePrompt}>
                Style
              </Button>
              <Button variant="outline" onClick={() => handleBulkLock(true)}>
                Lock
              </Button>
              <Button variant="outline" onClick={() => handleBulkLock(false)}>
                Unlock
              </Button>
              <Button variant="outline" onClick={handleConvertTags}>
                Convert to Category
              </Button>
            </>
          )}
          <Button variant="outline" onClick={handleFetchDuplicates}>
            Find Duplicates
          </Button>
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

      {/* Legend */}
      <Card className="mb-4">
        <CardContent className="flex flex-wrap gap-6 py-4 text-sm text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500 border border-slate-200 dark:border-slate-700" />
            <span>Tag color (customizable per tag)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-error border border-slate-200 dark:border-slate-700" />
            <span>Usage: High (top quartile)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success border border-slate-200 dark:border-slate-700" />
            <span>Usage: Medium (middle quartile)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-400 border border-slate-200 dark:border-slate-700" />
            <span>Usage: Low (bottom half)</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            <span>Featured tag</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-rose-500" />
            <span>Trending tag</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" size="sm">Locked</Badge>
            <span>Protected tag (no rename/delete)</span>
          </div>
        </CardContent>
      </Card>

      {/* Duplicate suggestions */}
      {duplicates.length > 0 && (
        <Card className="mb-6">
          <CardContent>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold">Possible Duplicates</h3>
                <p className="text-sm text-slate-500">Similarity score &gt;= 0.28</p>
              </div>
              {loadingDuplicates && <LoadingSpinner />}
            </div>
            <div className="space-y-2">
              {duplicates.map((item) => (
                <div key={`${item.a.id}-${item.b.id}`} className="flex items-center justify-between border rounded p-3">
                  <div className="text-sm">
                    <span className="font-semibold">{item.a.name}</span> to <span className="font-semibold">{item.b.name}</span>
                    <span className="text-slate-500 ml-2">score {item.score}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedTags(new Set([item.a.id, item.b.id]));
                      setShowMergeModal(true);
                    }}
                  >
                    Merge
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-2">
                      Synonyms
                      <InfoTooltip content="Comma-separated aliases that map to this tag" />
                    </label>
                    <Input
                      value={formData.synonymsText}
                      onChange={(e) => setFormData(prev => ({ ...prev, synonymsText: e.target.value }))}
                      placeholder="e.g. wall paint, wall colours"
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
                        placeholder="icon or emoji"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-2">
                      Featured
                      <InfoTooltip content="Featured tags get highlighted in listings" />
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        id="featured-toggle"
                        type="checkbox"
                        checked={formData.featured}
                        onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                        className="h-4 w-4"
                      />
                      <label htmlFor="featured-toggle" className="text-sm text-slate-700 dark:text-slate-300">
                        Mark as featured
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-2">
                      Linked Tags
                      <InfoTooltip content="Selecting this tag will also attach these companion tags" />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {tags
                        .filter(t => t.id !== editingTag?.id)
                        .map(tag => (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => {
                              setFormData(prev => {
                                const set = new Set(prev.linkedTagIds);
                                set.has(tag.id) ? set.delete(tag.id) : set.add(tag.id);
                                return { ...prev, linkedTagIds: Array.from(set) };
                              });
                            }}
                            className={`px-3 py-1.5 rounded-full border text-sm ${
                              formData.linkedTagIds.includes(tag.id)
                                ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-200'
                                : 'border-slate-300 dark:border-slate-600 hover:border-emerald-400'
                            }`}
                          >
                            {tag.name}
                          </button>
                        ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      id="locked-toggle"
                      type="checkbox"
                      checked={formData.locked}
                      onChange={(e) => setFormData(prev => ({ ...prev, locked: e.target.checked }))}
                      className="h-4 w-4"
                    />
                    <label htmlFor="locked-toggle" className="text-sm text-slate-700 dark:text-slate-300">
                      Lock tag (prevent rename/delete)
                    </label>
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



