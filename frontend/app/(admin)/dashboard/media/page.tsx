'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { useConfirmDialog } from '@/components/ui/ConfirmDialog';
import { fetchAPI, API_URL } from '@/lib/api';
import {
  Upload,
  Search,
  Folder,
  Image as ImageIcon,
  File,
  Trash2,
  Edit2,
  Link as LinkIcon,
  Download,
  X,
  Plus,
  Grid,
  List,
  Filter,
} from 'lucide-react';

interface MediaFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  width?: number;
  height?: number;
  folder: string;
  title?: string;
  description?: string;
  altText?: string;
  tags?: string[];
  variants?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  uploadedBy?: {
    username: string;
  };
}

type ViewMode = 'grid' | 'list';
type UploadMode = 'file' | 'url';

export default function MediaManagerPage() {
  const { success, error: showError } = useToast();
  const { dialog, confirm } = useConfirmDialog();
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [uploadMode, setUploadMode] = useState<UploadMode>('file');
  const [searchQuery, setSearchQuery] = useState('');
  const [folderFilter, setFolderFilter] = useState<string>('all');
  const [folders, setFolders] = useState<string[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingMedia, setEditingMedia] = useState<MediaFile | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', altText: '' });
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (folderFilter !== 'all') params.append('folder', folderFilter);
      params.append('limit', '1000'); // Increased limit to show all media
      params.append('page', '1');
      
      const data = await fetchAPI(`/media?${params.toString()}`, { redirectOn401: false, cache: 'no-store' });
      // Handle paginated response from backend
      const files = Array.isArray(data) ? data : (data?.items || data?.files || []);
      setMedia(files);
      
      // Extract unique folders
      const uniqueFolders = Array.from(
        new Set<string>((files.map((f: MediaFile) => f.folder).filter(Boolean) as string[])),
      );
      setFolders(uniqueFolders);
    } catch (error: any) {
      console.error('Error fetching media:', error);
      showError(error.message || 'Failed to load media files');
      setMedia([]);
    } finally {
      setLoading(false);
    }
  }, [folderFilter, showError]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      showError('File size must be less than 10MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError('Only image files are allowed');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folderFilter !== 'all' ? folderFilter : 'uploads');

      const data = await fetchAPI('/media/upload', {
        method: 'POST',
        body: formData,
        redirectOn401: false,
        cache: 'no-store',
      });

      success('File uploaded successfully!');
      setShowUploadModal(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchMedia();
    } catch (error: any) {
      console.error('Upload error:', error);
      showError(error.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleUrlUpload = async () => {
    if (!urlInput.trim()) {
      showError('Please enter a valid URL');
      return;
    }

    setUploading(true);
    try {
      const data = await fetchAPI('/media/upload-from-url', {
        method: 'POST',
        body: JSON.stringify({
          url: urlInput,
          folder: folderFilter !== 'all' ? folderFilter : 'uploads',
        }),
        redirectOn401: false,
        cache: 'no-store',
      });

      success('File uploaded from URL successfully!');
      setUrlInput('');
      setShowUploadModal(false);
      fetchMedia();
    } catch (error: any) {
      console.error('URL upload error:', error);
      showError(error.message || 'Failed to upload from URL');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (mediaId: string, filename: string) => {
    confirm(
      'Delete Media File',
      `Are you sure you want to delete "${filename}"? This action cannot be undone.`,
      async () => {
        try {
          await fetchAPI(`/media/${mediaId}`, { method: 'DELETE', redirectOn401: false, cache: 'no-store' });
          success('File deleted successfully');
          fetchMedia();
        } catch (error: any) {
          console.error('Delete error:', error);
          showError(error.message || 'Failed to delete file');
        }
      }
    );
  };

  const handleEdit = (file: MediaFile) => {
    setEditingMedia(file);
    setEditForm({
      title: file.title || '',
      description: file.description || '',
      altText: file.altText || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingMedia) return;

    try {
      await fetchAPI(`/media/${editingMedia.id}`, {
        method: 'PATCH',
        body: JSON.stringify(editForm),
        redirectOn401: false,
      });

      success('Media updated successfully');
      setEditingMedia(null);
      fetchMedia();
    } catch (error: any) {
      console.error('Update error:', error);
      showError(error.message || 'Failed to update media');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getImageUrl = (file: MediaFile) => {
    if (file.variants?.thumbnail) {
      return `${API_URL.replace('/api', '')}${file.variants.thumbnail}`;
    }
    return `${API_URL.replace('/api', '')}${file.url}`;
  };

  const filteredMedia = media.filter((file) => {
    const matchesSearch = searchQuery === '' || 
      file.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (file.title && file.title.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Media Manager</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Manage your media library: upload, organize, and optimize images
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
          </Button>
          <Button onClick={() => setShowUploadModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Upload
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={folderFilter}
                onChange={(e) => setFolderFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800"
              >
                <option value="all">All Folders</option>
                {folders.map((folder) => (
                  <option key={folder} value={folder}>
                    {folder}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Upload Media</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowUploadModal(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 border-b">
                <button
                  onClick={() => setUploadMode('file')}
                  className={`px-4 py-2 font-medium ${
                    uploadMode === 'file'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Upload File
                </button>
                <button
                  onClick={() => setUploadMode('url')}
                  className={`px-4 py-2 font-medium ${
                    uploadMode === 'url'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  From URL
                </button>
              </div>

              {uploadMode === 'file' ? (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                      Drag and drop an image, or click to select
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? <LoadingSpinner size="sm" /> : 'Select File'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Input
                    type="url"
                    placeholder="Enter image URL..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                  />
                  <Button onClick={handleUrlUpload} disabled={uploading || !urlInput.trim()}>
                    {uploading ? <LoadingSpinner size="sm" /> : 'Upload from URL'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Modal */}
      {editingMedia && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Edit Media</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setEditingMedia(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <Input
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="Media title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Media description"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Alt Text</label>
                <Input
                  value={editForm.altText}
                  onChange={(e) => setEditForm({ ...editForm, altText: e.target.value })}
                  placeholder="Alt text for accessibility"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveEdit} className="flex-1">
                  Save
                </Button>
                <Button variant="outline" onClick={() => setEditingMedia(null)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Media Grid/List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : filteredMedia.length === 0 ? (
        <EmptyState
          title="No media files found"
          description={searchQuery ? 'Try adjusting your search query' : 'Upload your first media file to get started'}
          action={{
            label: 'Upload Media',
            onClick: () => setShowUploadModal(true),
            icon: <Plus className="w-4 h-4" />,
          }}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {filteredMedia.map((file) => (
            <Card key={file.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative aspect-square bg-slate-100 dark:bg-slate-800">
                <img
                  src={getImageUrl(file)}
                  alt={file.altText || file.originalName}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 hover:bg-black/50 transition-colors flex items-center justify-center gap-2 opacity-0 hover:opacity-100">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleEdit(file)}
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleDelete(file.id, file.originalName)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-2">
                <p className="text-xs font-medium truncate" title={file.originalName}>
                  {file.title || file.originalName}
                </p>
                <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                {file.folder && (
                  <Badge variant="info" className="text-xs mt-1">
                    <Folder className="w-3 h-3 mr-1" />
                    {file.folder}
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400">Preview</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400">Size</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400">Folder</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredMedia.map((file) => (
                  <tr key={file.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                    <td className="px-4 py-3">
                      <img
                        src={getImageUrl(file)}
                        alt={file.altText || file.originalName}
                        className="w-16 h-16 object-cover rounded"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-sm">{file.title || file.originalName}</p>
                        {file.description && (
                          <p className="text-xs text-slate-500 truncate max-w-xs">{file.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{formatFileSize(file.size)}</td>
                    <td className="px-4 py-3">
                      <Badge variant="info" className="text-xs">
                        <Folder className="w-3 h-3 mr-1" />
                        {file.folder}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {new Date(file.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(file)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(file.id, file.originalName)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {dialog}
    </div>
  );
}
