'use client';

import logger from '@/lib/logger';

import { useState, useEffect, useCallback } from 'react';
import type { DragEvent } from 'react';
import { fetchAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Save, ArrowLeft, Plus, Trash2, GripVertical, FileText, Globe } from 'lucide-react';
import { getErrorMessage } from '@/lib/error-utils';

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

function normalizeMenuLocations(locations: unknown, index: number): MenuLocations {
  if (locations && typeof locations === 'object') {
    const locObj = locations as Record<string, unknown>;
    return {
      primary: Boolean(locObj.primary),
      footer: Boolean(locObj.footer),
    };
  }
  // Backward compatibility: default the first menu to primary.
  return { primary: index === 0, footer: false };
}

function normalizeMenus(rawMenus: unknown): Menu[] {
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

  return rawMenus
    .map((menu, index) => {
      if (!menu || typeof menu !== 'object') return null;
      const menuObj = menu as Record<string, unknown>;
      const items = Array.isArray(menuObj.items)
        ? menuObj.items.map((item, itemIndex) => parseMenuItem(item, itemIndex)).filter((item): item is MenuItem => item !== null)
        : [];
      return {
        id: typeof menuObj.id === 'string' ? menuObj.id : `menu-${index}`,
        name: typeof menuObj.name === 'string' ? menuObj.name : `Menu ${index + 1}`,
        locations: normalizeMenuLocations(menuObj.locations, index),
        items,
      } satisfies Menu;
    })
    .filter((menu): menu is Menu => menu !== null);
}

function parseMenuItem(value: unknown, index: number): MenuItem | null {
  if (!value || typeof value !== 'object') return null;
  const obj = value as Record<string, unknown>;
  const type = obj.type === 'page' || obj.type === 'post' || obj.type === 'custom' ? obj.type : 'custom';
  return {
    id: typeof obj.id === 'string' ? obj.id : `item-${index}`,
    type,
    label: typeof obj.label === 'string' ? obj.label : 'Menu Item',
    url: typeof obj.url === 'string' ? obj.url : '#',
    pageId: typeof obj.pageId === 'string' ? obj.pageId : undefined,
    postId: typeof obj.postId === 'string' ? obj.postId : undefined,
    order: typeof obj.order === 'number' ? obj.order : index,
  };
}

function parsePageSummary(value: unknown): PageSummary | null {
  if (!value || typeof value !== 'object') return null;
  const obj = value as Record<string, unknown>;
  if (typeof obj.id !== 'string') return null;
  return {
    id: obj.id,
    title: typeof obj.title === 'string' ? obj.title : undefined,
    slug: typeof obj.slug === 'string' ? obj.slug : undefined,
    status: typeof obj.status === 'string' ? obj.status : undefined,
  };
}

function parsePostSummary(value: unknown): PostSummary | null {
  if (!value || typeof value !== 'object') return null;
  const obj = value as Record<string, unknown>;
  if (typeof obj.id !== 'string') return null;
  return {
    id: obj.id,
    title: typeof obj.title === 'string' ? obj.title : undefined,
    slug: typeof obj.slug === 'string' ? obj.slug : undefined,
    status: typeof obj.status === 'string' ? obj.status : undefined,
  };
}

function extractPagesList(data: PagesResponse | PageSummary[] | null): PageSummary[] {
  if (Array.isArray(data)) {
    return data.map(parsePageSummary).filter((page): page is PageSummary => page !== null);
  }
  if (data && typeof data === 'object') {
    const obj = data as PagesResponse;
    const items = Array.isArray(obj.items) ? obj.items : Array.isArray(obj.pages) ? obj.pages : [];
    return items.map(parsePageSummary).filter((page): page is PageSummary => page !== null);
  }
  return [];
}

function extractPostsList(data: PostsResponse | PostSummary[] | null): PostSummary[] {
  if (Array.isArray(data)) {
    return data.map(parsePostSummary).filter((post): post is PostSummary => post !== null);
  }
  if (data && typeof data === 'object') {
    const obj = data as PostsResponse;
    const items = Array.isArray(obj.items) ? obj.items : Array.isArray(obj.posts) ? obj.posts : [];
    return items.map(parsePostSummary).filter((post): post is PostSummary => post !== null);
  }
  return [];
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

type SettingsResponse = {
  menuStructure?: {
    menus?: unknown;
  };
};

type PageSummary = {
  id?: string;
  title?: string;
  slug?: string;
  status?: string;
};

type PostSummary = {
  id?: string;
  title?: string;
  slug?: string;
  status?: string;
};

type PagesResponse = {
  items?: unknown[];
  pages?: unknown[];
};

type PostsResponse = {
  items?: unknown[];
  posts?: unknown[];
};

export default function MenuManagementPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const { dialog, confirm } = useConfirmDialog();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [pages, setPages] = useState<PageSummary[]>([]);
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [newMenuName, setNewMenuName] = useState('');
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [dragState, setDragState] = useState<{ menuId: string; itemId: string } | null>(null);
  const [dragOver, setDragOver] = useState<{ menuId: string; itemId: string } | null>(null);
  const [newItem, setNewItem] = useState<{
    type: MenuItem['type'];
    label: string;
    url: string;
    pageId?: string;
    postId?: string;
  }>({ type: 'custom', label: '', url: '', pageId: '', postId: '' });

  const loadData = useCallback(async () => {
    try {
      logger.debug('Loading menu data');
      const [settingsData, pagesData, postsData] = await Promise.all([
        fetchAPI<SettingsResponse>('/settings', { redirectOn401: false, cache: 'no-store' }),
        fetchAPI<PagesResponse | PageSummary[]>(
          '/pages?status=PUBLISHED',
          { redirectOn401: false, cache: 'no-store' },
        ).catch((err: unknown) => {
          logger.warn('Failed to fetch pages from protected endpoint, trying public', { error: getErrorMessage(err) });
          return fetchAPI<PagesResponse | PageSummary[]>(
            '/pages/public',
            { redirectOn401: false, cache: 'no-store' },
          );
        }),
        fetchAPI<PostsResponse | PostSummary[]>(
          '/blog/admin/posts?status=PUBLISHED&take=100',
          { redirectOn401: false, cache: 'no-store' },
        )
      ]);

      setMenus(normalizeMenus(settingsData?.menuStructure?.menus));

      const pagesList = extractPagesList(pagesData);
      const publishedPages = pagesList.filter((page) => {
        if (!page.slug) return false;
        if (RESERVED_SLUGS.has(page.slug)) return false;
        return page.status === 'PUBLISHED';
      });
      logger.debug('Loaded pages for menu', { published: publishedPages.length, total: pagesList.length });
      setPages(publishedPages);

      const postsList = extractPostsList(postsData);
      const publishedPosts = postsList.filter((post) => post.status === 'PUBLISHED');
      logger.debug('Loaded posts for menu', { published: publishedPosts.length, total: postsList.length });
      setPosts(publishedPosts);
    } catch (e: unknown) {
      logger.error('Error loading menu data', e, { component: 'MenuManagementPage' });
      const message = getErrorMessage(e, 'Failed to load data');
      if (message.includes('401') || message.includes('403') || message.includes('Unauthorized')) {
        logger.warn('Authentication error while loading menu data', { component: 'MenuManagementPage' });
      }
      showError(message);
    } finally {
      setLoading(false);
    }
  }, [showError]);

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
    } catch (e: unknown) {
      logger.error('Failed to save menu structure', e, { component: 'MenuManagementPage' });
      showError(getErrorMessage(e, 'Failed to save menu structure'));
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

  function moveMenuItem(menuId: string, fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;
    const nextMenus = menus.map((menu) => {
      if (menu.id !== menuId) return menu;
      const items = [...menu.items];
      const [moved] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, moved);
      const reordered = items.map((item, index) => ({ ...item, order: index }));
      return { ...menu, items: reordered };
    });
    setMenus(nextMenus);
  }

  function handleDragStart(menuId: string, itemId: string) {
    return (event: DragEvent<HTMLDivElement>) => {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', itemId);
      setDragState({ menuId, itemId });
    };
  }

  function handleDragOver(menuId: string, itemId: string) {
    return (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (!dragState || dragState.menuId !== menuId) return;
      setDragOver({ menuId, itemId });
    };
  }

  function handleDrop(menuId: string, itemId: string) {
    return (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (!dragState || dragState.menuId !== menuId) return;
      const menu = menus.find((m) => m.id === menuId);
      if (!menu) return;
      const fromIndex = menu.items.findIndex((item) => item.id === dragState.itemId);
      const toIndex = menu.items.findIndex((item) => item.id === itemId);
      if (fromIndex === -1 || toIndex === -1) return;
      moveMenuItem(menuId, fromIndex, toIndex);
      setDragState(null);
      setDragOver(null);
    };
  }

  function handleDropToEnd(menuId: string) {
    return (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (!dragState || dragState.menuId !== menuId) return;
      const menu = menus.find((m) => m.id === menuId);
      if (!menu) return;
      const fromIndex = menu.items.findIndex((item) => item.id === dragState.itemId);
      if (fromIndex === -1) return;
      moveMenuItem(menuId, fromIndex, menu.items.length);
      setDragState(null);
      setDragOver(null);
    };
  }

  function handleDragEnd() {
    setDragState(null);
    setDragOver(null);
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
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === 'custom' || value === 'page' || value === 'post') {
                          setNewItem({ ...newItem, type: value, url: '', pageId: '', postId: '' });
                        }
                      }}
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
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Drag and drop items to set priority, WordPress-style.
              </div>
              {menu.items.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No menu items yet. Click "Add Item" to get started.</p>
              ) : (
                <>
                  {menu.items.map((item, index) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        dragOver?.menuId === menu.id && dragOver?.itemId === item.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
                      }`}
                      draggable
                      onDragStart={handleDragStart(menu.id, item.id)}
                      onDragOver={handleDragOver(menu.id, item.id)}
                      onDrop={handleDrop(menu.id, item.id)}
                      onDragEnd={handleDragEnd}
                    >
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
                      <span className="text-xs text-slate-400">#{index + 1}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMenuItem(menu.id, item.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  ))}
                  <div
                    className="rounded-lg border border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 p-3 text-xs text-slate-500 text-center"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={handleDropToEnd(menu.id)}
                  >
                    Drop here to move item to the end
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {dialog}
    </div>
  );
}




