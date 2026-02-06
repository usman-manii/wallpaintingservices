'use client';

import logger from '@/lib/logger';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useConfirmDialog } from '@/components/ui/ConfirmDialog';
import { fetchAPI } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Plus, Edit, Trash2, Folder, ChevronRight, ChevronDown, Layers } from 'lucide-react';
import { getErrorMessage } from '@/lib/error-utils';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  parentId?: string;
  parent?: {
    id: string;
    name: string;
    slug: string;
  };
  children?: Category[];
  _count?: {
    posts: number;
  };
}

type CategoryFormData = {
  name: string;
  slug: string;
  description: string;
  color: string;
  parentId: string;
};

const DEFAULT_FORM: CategoryFormData = {
  name: '',
  slug: '',
  description: '',
  color: '#3B82F6',
  parentId: '',
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

const parseNumber = (value: unknown, fallback = 0): number => (
  typeof value === 'number' && Number.isFinite(value) ? value : fallback
);

const parseCategory = (value: unknown): Category | null => {
  if (!isRecord(value)) {
    return null;
  }
  const id = parseString(value.id);
  const name = parseString(value.name);
  const slug = parseString(value.slug);
  if (!id || !name || !slug) {
    return null;
  }
  const parentRaw = isRecord(value.parent) ? value.parent : null;
  const parentId = parentRaw ? parseString(parentRaw.id) : '';
  const parent = parentId
    ? {
        id: parentId,
        name: parseString(parentRaw?.name, parentId),
        slug: parseString(parentRaw?.slug),
      }
    : undefined;
  const children = Array.isArray(value.children)
    ? value.children.map(parseCategory).filter((child): child is Category => !!child)
    : undefined;
  const countRaw = isRecord(value._count) ? value._count : null;
  const count = countRaw ? { posts: parseNumber(countRaw.posts) } : undefined;
  return {
    id,
    name,
    slug,
    description: parseOptionalString(value.description),
    color: parseOptionalString(value.color),
    parentId: parseOptionalString(value.parentId),
    parent,
    children,
    _count: count,
  };
};

const parseCategoryList = (value: unknown): Category[] => (
  Array.isArray(value)
    ? value.map(parseCategory).filter((category): category is Category => !!category)
    : []
);

export default function CategoriesPage() {
  const { success, error: showError } = useToast();
  const { dialog, confirm } = useConfirmDialog();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(DEFAULT_FORM);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [hasInitializedTree, setHasInitializedTree] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await fetchAPI('/categories', { redirectOn401: false, cache: 'no-store' });
      setCategories(parseCategoryList(data));
    } catch (error: unknown) {
      logger.error('Error fetching categories:', error);
      showError(getErrorMessage(error, 'Failed to fetch categories'));
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (hasInitializedTree || categories.length === 0) return;
    setExpandedIds(new Set(categories.map((cat) => cat.id)));
    setHasInitializedTree(true);
  }, [categories, hasInitializedTree]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingCategory ? `/categories/${editingCategory.id}` : '/categories';
      const payload = {
        ...formData,
        parentId: formData.parentId || undefined, // Send undefined instead of empty string
      };
      await fetchAPI(url, {
        method: editingCategory ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
        redirectOn401: false,
        cache: 'no-store',
      });

      success(editingCategory ? 'Category updated successfully' : 'Category created successfully');
      setShowForm(false);
      setEditingCategory(null);
      setFormData(DEFAULT_FORM);
      fetchCategories();
    } catch (error: unknown) {
      logger.error('Error saving category:', error);
      showError(getErrorMessage(error, 'Failed to save category'));
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      color: category.color || '#3B82F6',
      parentId: category.parentId || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string, name: string) => {
    confirm(
      'Delete Category',
      `Are you sure you want to delete "${name}"? Posts with this category will be uncategorized.`,
      async () => {
        try {
          await fetchAPI(`/categories/${id}`, {
            method: 'DELETE',
            redirectOn401: false,
            cache: 'no-store',
          });
          success('Category deleted successfully');
          fetchCategories();
        } catch (error) {
          logger.error('Error deleting category:', error);
          showError(getErrorMessage(error, 'An error occurred'));
        }
      },
      'danger'
    );
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    });
  };

  const childrenByParent = useMemo(() => {
    const map = new Map<string, Category[]>();
    categories.forEach((cat) => {
      const key = cat.parentId || 'root';
      const list = map.get(key) || [];
      list.push(cat);
      map.set(key, list);
    });
    map.forEach((list) => list.sort((a, b) => a.name.localeCompare(b.name)));
    return map;
  }, [categories]);

  const rootCategories = (childrenByParent.get('root') || (categories.length > 0 ? categories : []));

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedIds(new Set(categories.map((cat) => cat.id)));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  const renderCategoryRow = (category: Category, level: number = 0) => {
    const children = childrenByParent.get(category.id) || [];
    const hasChildren = children.length > 0;
    const isExpanded = expandedIds.has(category.id);

    return (
      <div key={category.id} className="space-y-2">
        <div
          className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3"
          style={{ paddingLeft: `${level * 24 + 16}px` }}
        >
          <button
            type="button"
            onClick={() => hasChildren && toggleExpand(category.id)}
            className={`flex items-center justify-center w-6 h-6 rounded-md border border-slate-200 dark:border-slate-700 ${
              hasChildren ? 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800' : 'text-slate-300 dark:text-slate-600'
            }`}
            disabled={!hasChildren}
            aria-label={hasChildren ? (isExpanded ? 'Collapse category' : 'Expand category') : 'No subcategories'}
          >
            {hasChildren ? (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <Layers size={12} />}
          </button>

          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: category.color || '#3B82F6' }}
          />

          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{category.name}</h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">/{category.slug}</span>
            </div>
            {category.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                {category.description}
              </p>
            )}
          </div>

          <Badge variant="info" className="text-xs">
            {category._count?.posts || 0} posts
          </Badge>

          {hasChildren && (
            <Badge variant="outline" className="text-xs">
              {children.length} subcategories
            </Badge>
          )}

          <div className="flex gap-2 ml-auto">
            <Button
              size="sm"
              onClick={() => handleEdit(category)}
              className="flex items-center gap-1"
            >
              <Edit className="w-3 h-3" />
              Edit
            </Button>
            <Button
              size="sm"
              onClick={() => handleDelete(category.id, category.name)}
              className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </Button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="space-y-2">
            {children.map((child) => renderCategoryRow(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-8">Categories</h1>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {dialog}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <Folder className="w-8 h-8 text-purple-600" />
            Categories
            <Badge variant="info">{categories.length}</Badge>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Organize your content by categories</p>
        </div>
        <Button
          onClick={() => {
            setShowForm(!showForm);
            setEditingCategory(null);
            setFormData(DEFAULT_FORM);
          }}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {showForm ? 'Cancel' : 'Add Category'}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{editingCategory ? 'Edit Category' : 'New Category'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Name *
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Enter category name..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Slug *
                </label>
                <Input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="category-slug"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg 
                           bg-white dark:bg-slate-800 text-slate-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Color
                </label>
                <Input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="h-10 w-20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Parent Category (Optional)
                </label>
                <select
                  value={formData.parentId}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg 
                           bg-white dark:bg-slate-800 text-slate-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">None (Root Category)</option>
                  {categories
                    .filter(cat => !cat.parentId && (!editingCategory || cat.id !== editingCategory.id))
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingCategory(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {categories.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-12 text-center">
              <Folder className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No categories yet</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Create your first category to organize your content
              </p>
              <Button onClick={() => setShowForm(true)} className="flex items-center gap-2 mx-auto">
                <Plus className="w-4 h-4" />
                Add First Category
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-0">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <CardTitle>Category Tree</CardTitle>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Expand, collapse, and manage nested categories with enterprise clarity.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={expandAll}>
                    Expand All
                  </Button>
                  <Button size="sm" variant="outline" onClick={collapseAll}>
                    Collapse All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2">
                {rootCategories.map((category) => renderCategoryRow(category, 0))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}


