'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useConfirmDialog } from '@/components/ui/ConfirmDialog';
import { fetchAPI } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Plus, Edit, Trash2, Folder } from 'lucide-react';

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

export default function CategoriesPage() {
  const { success, error: showError } = useToast();
  const { dialog, confirm } = useConfirmDialog();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#3B82F6',
    parentId: '',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await fetchAPI('/categories');
      setCategories(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      showError(error.message || 'Failed to fetch categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

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
      });

      success(editingCategory ? 'Category updated successfully' : 'Category created successfully');
      setShowForm(false);
      setEditingCategory(null);
      setFormData({ name: '', slug: '', description: '', color: '#3B82F6', parentId: '' });
      fetchCategories();
    } catch (error: any) {
      console.error('Error saving category:', error);
      showError(error.message || 'Failed to save category');
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
          });
          success('Category deleted successfully');
          fetchCategories();
        } catch (error) {
          console.error('Error deleting category:', error);
          showError('An error occurred');
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
            setFormData({ name: '', slug: '', description: '', color: '#3B82F6', parentId: '' });
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
          (() => {
            // Separate root categories (no parent) from child categories
            const rootCategories = categories.filter(cat => !cat.parentId);
            
            const renderCategoryTree = (category: Category, level: number = 0) => (
              <div key={category.id} className={level > 0 ? 'ml-8 border-l-2 border-slate-200 dark:border-slate-700 pl-4 mt-2' : ''}>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: category.color || '#3B82F6' }}
                        />
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                            {category.name}
                          </h3>
                          {category.parent && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              Parent: {category.parent.name}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant="info">
                        {category._count?.posts || 0} posts
                      </Badge>
                    </div>
                    {category.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        {category.description}
                      </p>
                    )}
                    {category.children && category.children.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                          Subcategories ({category.children.length}):
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {category.children.map((child) => (
                            <Badge key={child.id} variant="outline" className="text-xs">
                              {child.name} ({child._count?.posts || 0})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2">
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
                  </CardContent>
                </Card>
                {/* Render children recursively */}
                {category.children && category.children.length > 0 && (
                  <div className="mt-2">
                    {category.children.map((child) => {
                      const fullChild = categories.find(c => c.id === child.id);
                      return fullChild ? renderCategoryTree(fullChild, level + 1) : null;
                    })}
                  </div>
                )}
              </div>
            );
            
            return rootCategories.map(category => renderCategoryTree(category));
          })()
        )}
      </div>
    </div>
  );
}
