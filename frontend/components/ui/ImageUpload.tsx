'use client';

import logger from '@/lib/logger';

import { useState, useRef } from 'react';
import { Button } from './Button';
import { Upload, Link, X, Image as ImageIcon } from 'lucide-react';
import { fetchAPI, API_URL } from '@/lib/api';

interface ImageUploadProps {
  onImageSelect: (url: string) => void;
  currentImage?: string;
  label?: string;
  folder?: string;
}

type UploadResponse = {
  url?: string;
};

const getImageUrl = (response: UploadResponse | null | undefined): string | null => {
  if (!response?.url || typeof response.url !== 'string') return null;
  return response.url.startsWith('http')
    ? response.url
    : `${typeof window !== 'undefined' ? window.location.origin : ''}${response.url}`;
};

export function ImageUpload({ onImageSelect, currentImage, label = 'Upload Image', folder = 'uploads' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const data = await fetchAPI<UploadResponse>('/media/upload', {
        method: 'POST',
        body: formData,
      });

      // Use relative URL or full URL from response
      const imageUrl = getImageUrl(data);
      if (!imageUrl) {
        throw new Error('Upload response missing URL');
      }
      onImageSelect(imageUrl);
    } catch (err) {
      setError('Failed to upload image');
      logger.error('Image upload failed', err);
    } finally {
      setUploading(false);
    }
  };

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const data = await fetchAPI<UploadResponse>('/media/upload-from-url', {
        method: 'POST',
        body: JSON.stringify({ url: urlInput, folder }),
      });

      // Use relative URL or full URL from response
      const imageUrl = getImageUrl(data);
      if (!imageUrl) {
        throw new Error('Upload response missing URL');
      }
      onImageSelect(imageUrl);
      setUrlInput('');
    } catch (err) {
      setError('Failed to load image from URL');
      logger.error('Image upload from URL failed', err);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onImageSelect('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>

      {currentImage && (
        <div className="relative inline-block">
          <img
            src={currentImage}
            alt="Preview"
            className="w-32 h-32 object-cover rounded-lg border-2 border-slate-200 dark:border-slate-700"
          />
          <button
            onClick={handleRemove}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex gap-2 mb-3">
        <Button
          type="button"
          onClick={() => setMode('upload')}
          className={mode === 'upload' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}
        >
          <Upload className="w-4 h-4 mr-1" />
          Upload File
        </Button>
        <Button
          type="button"
          onClick={() => setMode('url')}
          className={mode === 'url' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}
        >
          <Link className="w-4 h-4 mr-1" />
          From URL
        </Button>
      </div>

      {mode === 'upload' ? (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            className="block w-full text-sm text-slate-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              dark:file:bg-slate-700 dark:file:text-blue-400
              disabled:opacity-50"
          />
          <p className="mt-1 text-xs text-slate-500">
            PNG, JPG, GIF, WebP up to 10MB
          </p>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/image.jpg"
            disabled={uploading}
            className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md
              bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100
              focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <Button
            type="button"
            onClick={handleUrlSubmit}
            disabled={uploading || !urlInput.trim()}
          >
            <ImageIcon className="w-4 h-4" />
          </Button>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {uploading && (
        <p className="text-sm text-blue-600 dark:text-blue-400">Uploading...</p>
      )}
    </div>
  );
}

