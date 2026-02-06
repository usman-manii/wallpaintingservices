'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Image as ImageIcon } from 'lucide-react';

type ImageAlignment = 'left' | 'center' | 'right';

type ImageConfig = {
  src: string;
  alt: string;
  width: string;
  height: string;
  alignment: ImageAlignment;
  caption: string;
};

interface ImageWidgetProps {
  src?: string;
  alt?: string;
  width?: string;
  height?: string;
  alignment?: ImageAlignment;
  caption?: string;
  editable?: boolean;
  onChange?: (data: ImageConfig) => void;
}

export default function ImageWidget({
  src = 'https://via.placeholder.com/800x400',
  alt = 'Image',
  width = '100%',
  height = 'auto',
  alignment = 'center',
  caption = '',
  editable = false,
  onChange,
}: ImageWidgetProps) {
  const [localSrc, setLocalSrc] = useState(src);
  const [localAlt, setLocalAlt] = useState(alt);
  const [localWidth, setLocalWidth] = useState(width);
  const [localHeight, setLocalHeight] = useState(height);
  const [localAlignment, setLocalAlignment] = useState(alignment);
  const [localCaption, setLocalCaption] = useState(caption);

  useEffect(() => {
    if (onChange) {
      onChange({
        src: localSrc,
        alt: localAlt,
        width: localWidth,
        height: localHeight,
        alignment: localAlignment,
        caption: localCaption,
      });
    }
  }, [localSrc, localAlt, localWidth, localHeight, localAlignment, localCaption]);

  const getContainerStyle = () => {
    const styles: React.CSSProperties = {
      display: 'flex',
      justifyContent: localAlignment === 'left' ? 'flex-start' : localAlignment === 'right' ? 'flex-end' : 'center',
      marginBottom: '1rem',
    };
    return styles;
  };

  if (editable) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <ImageIcon size={16} />
            Image Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Image URL *
            </label>
            <Input
              type="text"
              value={localSrc}
              onChange={(e) => setLocalSrc(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Enter the full URL of your image
            </p>
          </div>

          {/* Alt Text */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Alt Text (SEO)
            </label>
            <Input
              type="text"
              value={localAlt}
              onChange={(e) => setLocalAlt(e.target.value)}
              placeholder="Describe the image..."
            />
          </div>

          {/* Width & Height */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Width
              </label>
              <Input
                type="text"
                value={localWidth}
                onChange={(e) => setLocalWidth(e.target.value)}
                placeholder="100%, 800px, auto"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Height
              </label>
              <Input
                type="text"
                value={localHeight}
                onChange={(e) => setLocalHeight(e.target.value)}
                placeholder="auto, 400px"
              />
            </div>
          </div>

          {/* Alignment */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Alignment
            </label>
            <div className="flex gap-2">
              {(['left', 'center', 'right'] as const).map((align) => (
                <button
                  key={align}
                  type="button"
                  onClick={() => setLocalAlignment(align)}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    localAlignment === align
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-300 dark:border-slate-600 hover:border-blue-400'
                  }`}
                >
                  {align.charAt(0).toUpperCase() + align.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Caption */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Caption (optional)
            </label>
            <Input
              type="text"
              value={localCaption}
              onChange={(e) => setLocalCaption(e.target.value)}
              placeholder="Add a caption for the image..."
            />
          </div>

          {/* Preview */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Preview
            </label>
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div style={getContainerStyle()}>
                <div>
                  <img
                    src={localSrc}
                    alt={localAlt}
                    style={{
                      width: localWidth,
                      height: localHeight,
                      maxWidth: '100%',
                      borderRadius: '8px',
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x400?text=Image+Not+Found';
                    }}
                  />
                  {localCaption && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 text-center italic">
                      {localCaption}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Display mode
  return (
    <div style={getContainerStyle()}>
      <div>
        <img
          src={localSrc}
          alt={localAlt}
          style={{
            width: localWidth,
            height: localHeight,
            maxWidth: '100%',
            borderRadius: '8px',
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x400?text=Image+Not+Found';
          }}
        />
        {localCaption && (
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 text-center italic">
            {localCaption}
          </p>
        )}
      </div>
    </div>
  );
}
