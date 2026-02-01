'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useConfirmDialog } from '@/components/ui/ConfirmDialog';
import { fetchAPI } from '@/lib/api';
import { 
  Plus, Search, Filter, Eye, Edit2, Trash2, Copy, 
  Globe, Clock, MoreVertical, FileText, Layout, CheckCircle, Shield, RefreshCw
} from 'lucide-react';

interface Page {
  id: string;
  title: string;
  slug: string;
  status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED';
  pageType: 'STATIC' | 'DYNAMIC' | 'TEMPLATE' | 'HOMEPAGE' | 'LANDING';
  isPolicyPage?: boolean;
  usePageBuilder?: boolean;
  viewCount: number;
  author: { username: string };
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  isSystem?: boolean;
}

// Pages that conflict with admin or framework routes should not appear in the editor list.
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

export default function PagesManagementPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const { dialog, confirm } = useConfirmDialog();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [showFilters, setShowFilters] = useState(false);

  const fetchPages = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (typeFilter !== 'ALL') params.append('pageType', typeFilter);

      console.log('🔍 Fetching pages with filters:', { statusFilter, typeFilter });
      const endpoint = params.toString() ? `/pages?${params.toString()}` : '/pages';
      console.log('📡 API endpoint:', endpoint);
      console.log('📡 Full URL:', `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${endpoint}`);
      
      const data = await fetchAPI(endpoint, { redirectOn401: false, cache: 'no-store' });
      
      console.log('📦 Raw API response:', data);
      console.log('📦 Response type:', typeof data, 'Is Array:', Array.isArray(data));
      
      let pagesList: Page[] = [];
      if (Array.isArray(data)) {
        pagesList = data;
      } else if (data?.items && Array.isArray(data.items)) {
        pagesList = data.items;
      } else if (data?.pages && Array.isArray(data.pages)) {
        pagesList = data.pages;
      } else if (data && typeof data === 'object') {
        // If data is an object but not in expected format, log it
        console.warn('⚠️ Unexpected data format:', data);
        pagesList = [];
      }
      
      console.log(`📄 Parsed ${pagesList.length} pages from response`);
      
      // Ensure all pages have required fields with defaults
      const validPages = pagesList.map((page: any) => ({
        ...page,
        viewCount: page.viewCount || 0,
        author: page.author || { username: 'Unknown' },
        isSystem: page.isSystem || false,
        createdAt: page.createdAt || new Date().toISOString(),
        updatedAt: page.updatedAt || new Date().toISOString(),
      }));
      
      // Hide reserved/admin slugs from the pages section.
      const visiblePages = validPages.filter((page) => !RESERVED_SLUGS.has(page.slug));

      // Sort by updatedAt (most recent first) so newly created pages appear at the top
      visiblePages.sort((a, b) => {
        const dateA = new Date(a.updatedAt).getTime();
        const dateB = new Date(b.updatedAt).getTime();
        return dateB - dateA;
      });
      
      console.log(`✅ Loaded ${visiblePages.length} pages (${validPages.length} total, ${validPages.length - visiblePages.length} reserved)`);
      setPages(visiblePages);
    } catch (error: any) {
      console.error('❌ Error fetching pages:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response,
      });
      
      // If auth error, redirect to login
      if (error.message?.includes('401') || error.message?.includes('403') || error.message?.includes('Unauthorized')) {
        console.warn('⚠️ Authentication error, redirecting to login');
        router.push('/login');
        return;
      }
      
      // Show error to user and clear the list
      showError(error.message || 'Failed to load pages. Please try refreshing.');
      setPages([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  useEffect(() => {
    const onPagesChanged = (event?: any) => {
      console.log('📢 Pages changed event received, refreshing list...', event?.detail);
      // Force refresh - fetchPages will use current filters
      fetchPages();
    };
    window.addEventListener('pages:changed', onPagesChanged as EventListener);
    return () => window.removeEventListener('pages:changed', onPagesChanged as EventListener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - fetchPages is stable and uses current state

  const handleDelete = async (id: string) => {
    confirm(
      'Delete Page',
      'Are you sure you want to delete this page?',
      async () => {
        try {
          await fetchAPI(`/pages/${id}`, { method: 'DELETE', redirectOn401: false, cache: 'no-store' });
          fetchPages();
          success('Page deleted');
        } catch (error: any) {
          console.error('Error deleting page:', error);
          showError(error.message || 'Failed to delete page');
        }
      }
    );
  };

  const handleDuplicate = async (id: string) => {
    try {
      await fetchAPI(`/pages/${id}/duplicate`, { method: 'POST', redirectOn401: false, cache: 'no-store' });
      fetchPages();
      success('Page duplicated successfully!');
    } catch (error: any) {
      console.error('Error duplicating page:', error);
      showError(error.message || 'Failed to duplicate page');
    }
  };

  const filteredPages = pages.filter(page =>
    page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const styles = {
      DRAFT: 'bg-slate-100 text-slate-700',
      PUBLISHED: 'bg-green-100 text-green-700',
      SCHEDULED: 'bg-blue-100 text-blue-700',
      ARCHIVED: 'bg-yellow-100 text-yellow-700',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {status}
      </span>
    );
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      STATIC: FileText,
      DYNAMIC: Globe,
      TEMPLATE: Layout,
      HOMEPAGE: Layout,
      LANDING: FileText,
    };
    const Icon = icons[type as keyof typeof icons] || FileText;
    return <Icon className="w-4 h-4" />;
  };

  const handleCreateStart = () => {
    // Direct redirect to simple page editor (no page builder)
    router.push('/dashboard/pages/new/edit');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading pages...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {dialog}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Pages</h1>
          <p className="text-slate-600 mt-1">
            Manage all your website pages from one place - the single source of truth
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => {
              console.log('🔄 Manual refresh triggered');
              fetchPages();
            }}
            title="Refresh Pages List"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleCreateStart}>
            <Plus className="w-4 h-4 mr-2" />
            Create New Page
          </Button>
        </div>
      </div>


      {/* Filters & Search */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pages by title or slug..."
              className="pl-10"
            />
          </div>

          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">All Types</option>
                <option value="STATIC">Static</option>
                <option value="DYNAMIC">Dynamic</option>
                <option value="TEMPLATE">Template</option>
                <option value="HOMEPAGE">Homepage</option>
                <option value="LANDING">Landing Page</option>
              </select>
            </div>
          </div>
        )}
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-slate-600">Total Pages</div>
          <div className="text-2xl font-bold mt-1">{pages.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-600">Published</div>
          <div className="text-2xl font-bold mt-1 text-green-600">
            {pages.filter(p => p.status === 'PUBLISHED').length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-600">Drafts</div>
          <div className="text-2xl font-bold mt-1 text-slate-600">
            {pages.filter(p => p.status === 'DRAFT').length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-600">Total Views</div>
          <div className="text-2xl font-bold mt-1 text-blue-600">
            {pages.reduce((sum, p) => sum + p.viewCount, 0)}
          </div>
        </Card>
      </div>

      {/* Pages Table */}
      {filteredPages.length === 0 ? (
        <Card className="p-12 text-center">
          <Layout className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No pages found</h3>
          <p className="text-slate-600 mb-6">
            {searchQuery ? 'Try a different search term' : 'Create your first page to get started'}
          </p>
          <Link href="/dashboard/pages/new/edit">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Page
            </Button>
          </Link>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Page
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Views
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Author
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredPages.map((page) => (
                  <tr key={page.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-slate-900 flex items-center gap-2">
                          {page.title}
                          {page.isPolicyPage && (
                             <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wide font-medium">Policy</span>
                          )}
                          {page.isSystem && (
                             <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-wide font-medium">System</span>
                          )}
                        </div>
                        <div className="text-sm text-slate-500">/{page.slug}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        {getTypeIcon(page.pageType)}
                        <span className="text-sm">{page.pageType}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(page.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {page.viewCount}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {page.author.username}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(page.updatedAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* View Button - Show for all published pages */}
                        {page.status === 'PUBLISHED' && (
                          <a
                            href={page.slug === '(home)' ? '/' : `/${page.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Page"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                        )}
                        
                        {/* Edit Button - Show for all pages (system pages can be viewed but not edited in DB) */}
                        {page.isSystem ? (
                          <span 
                            className="p-2 text-slate-400 cursor-not-allowed"
                            title="System pages cannot be edited"
                          >
                            <Edit2 className="w-4 h-4" />
                          </span>
                        ) : (
                          <Link
                            href={`/dashboard/pages/${page.id}/edit`}
                            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Page"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                        )}
                        
                        {/* Duplicate Button - Only for non-system pages */}
                        {!page.isSystem && (
                          <button
                            onClick={() => handleDuplicate(page.id)}
                            className="p-2 text-slate-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Duplicate Page"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        )}
                        
                        {/* Delete Button - Only for non-system pages */}
                        {page.isSystem ? (
                          <span 
                            className="p-2 text-slate-400 cursor-not-allowed"
                            title="System pages cannot be deleted"
                          >
                            <Trash2 className="w-4 h-4" />
                          </span>
                        ) : (
                          <button
                            onClick={() => handleDelete(page.id)}
                            className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Page"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
