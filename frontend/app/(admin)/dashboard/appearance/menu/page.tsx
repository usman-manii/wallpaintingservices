'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Save, ArrowLeft, Plus, Trash2, GripVertical, FileText, Globe } from 'lucide-react';

type MenuLocations = {
  primary: boolean;
  footer: boolean;
};

// Pages that conflict with admin or framework routes should not be selectable for menus.
const RESERVED_SLUGS = new Set([
  'login',
  'dashboard',
  'auth',
  'admin',
  'api',
  '_next',
  'static',
  'settings',
]);

function buildPageUrl(slug?: string): string {
  if (!slug) return '#';
  if (slug === '(home)' || slug === 'home') return '/';
  return `/${slug}`;
}

function normalizeMenuLocations(locations: any, index: number): MenuLocations {
  if (locations && typeof locations === 'object') {
    return {
      primary: Boolean(locations.primary),
      footer: Boolean(locations.footer),
    };
  }
  // Backward compatibility: default the first menu to primary.
  return { primary: index === 0, footer: false };
}

function normalizeMenus(rawMenus: any[] | undefined): Menu[] {
  if (!Array.isArray(rawMenus) || rawMenus.length === 0) {
    return [
      {
        id: 'main',
        name: 'Main Menu',
        locations: { primary: true, footer: false },
        items: [],
      },
    ];
  }

  return rawMenus.map((menu, index) => ({
    id: menu.id || `menu-${index}`,
    name: menu.name || `Menu ${index + 1}`,
    locations: normalizeMenuLocations(menu.locations, index),
    items: Array.isArray(menu.items) ? menu.items : [],
  }));
}

interface MenuItem {
  id: string;
  type: 'page' | 'post' | 'custom';
  label: string;
  url: string;
  pageId?: string;
  postId?: string;
  order: number;
}

interface Menu {
  id: string;
  name: string;
  locations: MenuLocations;
  items: MenuItem[];
}

export default function MenuManagementPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const { dialog, confirm } = useConfirmDialog();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [pages, setPages] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [newMenuName, setNewMenuName] = useState('');
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [newItem, setNewItem] = useState<{
    type: MenuItem['type'];
    label: string;
    url: string;
    pageId?: string;
    postId?: string;
  }>({ type: 'custom', label: '', url: '', pageId: '', postId: '' });

  const loadData = useCallback(async () => {
    try {
      console.log('🔍 Loading menu data...');
      const [settingsData, pagesData, postsData] = await Promise.all([
        fetchAPI('/settings', { redirectOn401: false, cache: 'no-store' }),
        fetchAPI('/pages?status=PUBLISHED', { redirectOn401: false, cache: 'no-store' }).catch((err) => {
          console.warn('⚠️ Failed to fetch pages from protected endpoint, trying public:', err);
          // Fallback to public endpoint if protected fails
          return fetchAPI('/pages/public', { redirectOn401: false, cache: 'no-store' });
        }),
        fetchAPI('/blog/admin/posts?status=PUBLISHED&take=100', { redirectOn401: false, cache: 'no-store' }) // Use admin endpoint for authenticated users
      ]);

      console.log('📦 Settings data:', settingsData ? 'received' : 'null');
      console.log('📦 Pages data type:', typeof pagesData, 'Is Array:', Array.isArray(pagesData));
      console.log('📦 Pages data:', pagesData);

      setMenus(normalizeMenus(settingsData?.menuStructure?.menus));

      // Handle pages data - same pattern as dashboard/pages/page.tsx
      let pagesList: any[] = [];
      if (Array.isArray(pagesData)) {
        pagesList = pagesData;
        console.log('✅ Received pages as array:', pagesList.length, 'items');
      } else if (pagesData?.items && Array.isArray(pagesData.items)) {
        pagesList = pagesData.items;
        console.log('✅ Received pages as object.items:', pagesList.length, 'items');
      } else if (pagesData?.pages && Array.isArray(pagesData.pages)) {
        pagesList = pagesData.pages;
        console.log('✅ Received pages as object.pages:', pagesList.length, 'items');
      } else {
        console.warn('⚠️ Unexpected pages data format:', pagesData ? Object.keys(pagesData) : 'null/undefined');
      }
      
      // Filter to only published pages (though API should already filter)
      const publishedPages = pagesList.filter((page: any) => {
        if (!page) return false;
        const isPublished = page.status === 'PUBLISHED';
        if (!isPublished) {
          console.log('⏭️ Skipping non-published page:', page.title, 'status:', page.status);
        }
        if (RESERVED_SLUGS.has(page.slug)) {
          console.log('Skipping reserved page slug:', page.slug);
          return false;
        }
        return isPublished;
      });
      console.log(`✅ Loaded ${publishedPages.length} published pages for menu (out of ${pagesList.length} total)`);
      if (publishedPages.length > 0) {
        console.log('📄 Page titles:', publishedPages.map((p: any) => p.title));
      } else {
        console.warn('⚠️ No published pages found. Check if pages exist in database and are published.');
      }
      setPages(publishedPages);
      
      // Handle posts data
      let postsList: any[] = [];
      if (Array.isArray(postsData)) {
        postsList = postsData;
        console.log('✅ Received posts as array:', postsList.length, 'items');
      } else if (postsData?.items && Array.isArray(postsData.items)) {
        postsList = postsData.items;
        console.log('✅ Received posts as object.items:', postsList.length, 'items');
      } else if (postsData?.posts && Array.isArray(postsData.posts)) {
        postsList = postsData.posts;
        console.log('✅ Received posts as object.posts:', postsList.length, 'items');
      } else {
        console.warn('⚠️ Unexpected posts data format:', postsData ? Object.keys(postsData) : 'null/undefined');
      }
      
      // Filter to only published posts (though API should already filter)
      const publishedPosts = postsList.filter((post: any) => {
        if (!post) return false;
        const isPublished = post.status === 'PUBLISHED';
        if (!isPublished) {
          console.log('⏭️ Skipping non-published post:', post.title, 'status:', post.status);
        }
        return isPublished;
      });
      
      console.log(`✅ Loaded ${publishedPosts.length} published posts for menu (out of ${postsList.length} total)`);
      if (publishedPosts.length > 0) {
        console.log('📝 Post titles:', publishedPosts.map((p: any) => p.title).slice(0, 5));
      } else {
        console.warn('⚠️ No published posts found. Check if posts exist in database and are published.');
      }
      setPosts(publishedPosts);
    } catch (e: any) {
      console.error('❌ Error loading menu data:', e);
      console.error('Error details:', {
        message: e.message,
        stack: e.stack,
        name: e.name
      });
      
      // Check if it's an auth error
      if (e.message?.includes('401') || e.message?.includes('403') || e.message?.includes('Unauthorized')) {
        console.error('🔒 Authentication error');
      }
      
      showError(e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSave() {
    try {
      await fetchAPI('/settings', {
        method: 'PUT',
        body: JSON.stringify({ menuStructure: { menus } }),
        redirectOn401: false,
        cache: 'no-store',
      });
      success('Menu structure saved successfully!');
    } catch (e: any) {
      showError(e.message || 'Failed to save menu structure');
    }
  }

  function addMenu() {
    if (!newMenuName.trim()) return;
    const newMenu: Menu = {
      id: `menu-${Date.now()}`,
      name: newMenuName,
      locations: { primary: false, footer: false },
      items: []
    };
    setMenus([...menus, newMenu]);
    setNewMenuName('');
    setShowAddMenu(false);
  }

  function addMenuItem(menuId: string) {
    if (!newItem.label.trim() || (newItem.type === 'custom' && !newItem.url.trim())) {
      showError('Please fill in all required fields');
      return;
    }

    const menu = menus.find(m => m.id === menuId);
    if (!menu) return;

    const selectedPage = newItem.type === 'page' ? pages.find((p) => p.id === newItem.pageId) : null;
    const selectedPost = newItem.type === 'post' ? posts.find((p) => p.id === newItem.postId) : null;

    const item: MenuItem = {
      id: `item-${Date.now()}`,
      type: newItem.type,
      label: newItem.label,
      url:
        newItem.type === 'custom'
          ? newItem.url
          : newItem.type === 'page'
            ? buildPageUrl(selectedPage?.slug)
            : selectedPost?.slug
              ? `/blog/${selectedPost.slug}`
              : '#',
      pageId: newItem.type === 'page' ? newItem.pageId : undefined,
      postId: newItem.type === 'post' ? newItem.postId : undefined,
      order: menu.items.length
    };

    menu.items.push(item);
    setMenus([...menus]);
    setNewItem({ type: 'custom', label: '', url: '', pageId: '', postId: '' });
    setEditingMenu(null);
  }

  function removeMenuItem(menuId: string, itemId: string) {
    const menu = menus.find(m => m.id === menuId);
    if (!menu) return;
    menu.items = menu.items.filter(item => item.id !== itemId);
    setMenus([...menus]);
  }

  function removeMenu(menuId: string) {
    confirm(
      'Delete Menu',
      'Are you sure you want to delete this menu?',
      () => {
        setMenus(menus.filter(m => m.id !== menuId));
      }
    );
  }

  if (loading) return <div className="p-8 text-center text-slate-500">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pt-6">
      <div className="flex items-center gap-4 mb-4">
        <Button variant="ghost" onClick={() => router.push('/dashboard')}>
            <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
        </Button>
      </div>

      <div className="flex justify-between items-center mb-6 px-1">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Menu Management</h1>
            <p className="text-slate-500 dark:text-slate-400">Create and manage your site navigation menus.</p>
          </div>
          <div className="flex gap-2">
            {!showAddMenu && (
              <Button onClick={() => setShowAddMenu(true)}>
                <Plus size={16} className="mr-2" /> Add Menu
              </Button>
            )}
            <Button onClick={handleSave}>
              <Save size={16} className="mr-2" /> Save Changes
            </Button>
          </div>
      </div>

      {showAddMenu && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <Input
                value={newMenuName}
                onChange={(e) => setNewMenuName(e.target.value)}
                placeholder="Menu name (e.g., Main Menu, Footer Menu)"
                className="flex-1"
              />
              <Button onClick={addMenu}>Add</Button>
              <Button variant="outline" onClick={() => setShowAddMenu(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {menus.map((menu) => (
        <Card key={menu.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{menu.name}</CardTitle>
                <CardDescription>{menu.items.length} menu items</CardDescription>
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={menu.locations?.primary || false}
                      onChange={(e) => {
                        const nextMenus = menus.map((m) =>
                          m.id === menu.id
                            ? { ...m, locations: { ...m.locations, primary: e.target.checked } }
                            : m,
                        );
                        setMenus(nextMenus);
                      }}
                    />
                    Primary Menu
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={menu.locations?.footer || false}
                      onChange={(e) => {
                        const nextMenus = menus.map((m) =>
                          m.id === menu.id
                            ? { ...m, locations: { ...m.locations, footer: e.target.checked } }
                            : m,
                        );
                        setMenus(nextMenus);
                      }}
                    />
                    Footer Menu
                  </label>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingMenu(editingMenu?.id === menu.id ? null : menu)}
                >
                  <Plus size={14} className="mr-1" /> Add Item
                </Button>
                {menus.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeMenu(menu.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {editingMenu?.id === menu.id && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-4 border border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Item Type</label>
                    <select
                      value={newItem.type}
                      onChange={(e) => setNewItem({...newItem, type: e.target.value as any, url: '', pageId: '', postId: ''})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800"
                    >
                      <option value="custom">Custom Link</option>
                      <option value="page">Page</option>
                      <option value="post">Post</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Label</label>
                    <Input
                      value={newItem.label}
                      onChange={(e) => setNewItem({...newItem, label: e.target.value})}
                      placeholder="Menu item label"
                    />
                  </div>
                </div>
                {newItem.type === 'custom' && (
                  <div>
                    <label className="text-sm font-medium mb-1 block">URL</label>
                    <Input
                      value={newItem.url}
                      onChange={(e) => setNewItem({...newItem, url: e.target.value})}
                      placeholder="/about or https://example.com"
                    />
                  </div>
                )}
                {newItem.type === 'page' && (
                  <div>
                    <label className="text-sm font-medium mb-1 block">Select Page</label>
                    <select
                      value={newItem.pageId}
                      onChange={(e) => setNewItem({...newItem, pageId: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800"
                    >
                      <option value="">Select a page...</option>
                      {pages.length === 0 ? (
                        <option value="" disabled>No published pages available</option>
                      ) : (
                        pages.map((page) => (
                          <option key={page.id} value={page.id}>{page.title}</option>
                        ))
                      )}
                    </select>
                  </div>
                )}
                {newItem.type === 'post' && (
                  <div>
                    <label className="text-sm font-medium mb-1 block">Select Post</label>
                    <select
                      value={newItem.postId}
                      onChange={(e) => setNewItem({...newItem, postId: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800"
                    >
                      <option value="">Select a post...</option>
                      {posts.length === 0 ? (
                        <option value="" disabled>No published posts available</option>
                      ) : (
                        posts.map((post) => (
                          <option key={post.id} value={post.id}>{post.title}</option>
                        ))
                      )}
                    </select>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button onClick={() => addMenuItem(menu.id)}>Add Item</Button>
                  <Button variant="outline" onClick={() => { setEditingMenu(null); setNewItem({ type: 'custom', label: '', url: '', pageId: '', postId: '' }); }}>Cancel</Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {menu.items.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No menu items yet. Click "Add Item" to get started.</p>
              ) : (
                menu.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <GripVertical className="text-slate-400 cursor-move" size={20} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {item.type === 'page' && <FileText size={14} className="text-blue-500" />}
                        {item.type === 'post' && <FileText size={14} className="text-green-500" />}
                        {item.type === 'custom' && <Globe size={14} className="text-purple-500" />}
                        <span className="font-medium">{item.label}</span>
                        <span className="text-xs text-slate-500">({item.url})</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMenuItem(menu.id, item.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {dialog}
    </div>
  );
}
