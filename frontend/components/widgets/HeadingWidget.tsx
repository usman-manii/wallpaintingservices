'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Type } from 'lucide-react';

type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
type HeadingAlignment = 'left' | 'center' | 'right';

type HeadingConfig = {
  content: string;
  tag: HeadingTag;
  font: string;
  fontSize?: string;
  color: string;
  alignment: HeadingAlignment;
};

interface HeadingWidgetProps {
  content?: string;
  tag?: HeadingTag;
  font?: string;
  fontSize?: string;
  color?: string;
  alignment?: HeadingAlignment;
  editable?: boolean;
  onChange?: (data: HeadingConfig) => void;
}

export default function HeadingWidget({
  content = 'Your Heading Here',
  tag = 'h2',
  font = 'default',
  fontSize,
  color = '#1e293b',
  alignment = 'left',
  editable = false,
  onChange,
}: HeadingWidgetProps) {
  const [localContent, setLocalContent] = useState(content);
  const [localTag, setLocalTag] = useState(tag);
  const [localFont, setLocalFont] = useState(font);
  const [localFontSize, setLocalFontSize] = useState(fontSize);
  const [localColor, setLocalColor] = useState(color);
  const [localAlignment, setLocalAlignment] = useState(alignment);

  useEffect(() => {
    if (onChange) {
      onChange({
        content: localContent,
        tag: localTag,
        font: localFont,
        fontSize: localFontSize,
        color: localColor,
        alignment: localAlignment,
      });
    }
  }, [localContent, localTag, localFont, localFontSize, localColor, localAlignment]);

  const getFontFamily = () => {
    if (localFont === 'default') return 'inherit';
    return localFont;
  };

  const getDefaultFontSize = () => {
    const sizes: Record<string, string> = {
      h1: '2.5rem',
      h2: '2rem',
      h3: '1.75rem',
      h4: '1.5rem',
      h5: '1.25rem',
      h6: '1rem',
    };
    return localFontSize || sizes[localTag];
  };

  const headingStyle: React.CSSProperties = {
    fontFamily: getFontFamily(),
    fontSize: getDefaultFontSize(),
    color: localColor,
    textAlign: localAlignment,
    margin: 0,
  };

  const renderHeading = () => {
    const props = { style: headingStyle };
    switch (localTag) {
      case 'h1':
        return <h1 {...props}>{localContent}</h1>;
      case 'h2':
        return <h2 {...props}>{localContent}</h2>;
      case 'h3':
        return <h3 {...props}>{localContent}</h3>;
      case 'h4':
        return <h4 {...props}>{localContent}</h4>;
      case 'h5':
        return <h5 {...props}>{localContent}</h5>;
      case 'h6':
        return <h6 {...props}>{localContent}</h6>;
      default:
        return <h2 {...props}>{localContent}</h2>;
    }
  };

  if (editable) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Type size={16} />
            Heading Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Heading Content */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Heading Text
            </label>
            <Input
              type="text"
              value={localContent}
              onChange={(e) => setLocalContent(e.target.value)}
              placeholder="Enter your heading..."
            />
          </div>

          {/* Heading Tag */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Heading Tag
            </label>
            <select
              value={localTag}
              onChange={(e) => {
                const value = e.target.value;
                if (value === 'h1' || value === 'h2' || value === 'h3' || value === 'h4' || value === 'h5' || value === 'h6') {
                  setLocalTag(value);
                }
              }}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg 
                       bg-white dark:bg-slate-800 text-slate-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="h1">H1 - Main Title</option>
              <option value="h2">H2 - Section Title</option>
              <option value="h3">H3 - Subsection</option>
              <option value="h4">H4 - Minor Heading</option>
              <option value="h5">H5 - Small Heading</option>
              <option value="h6">H6 - Smallest Heading</option>
            </select>
          </div>

          {/* Font Family */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Font Family
            </label>
            <select
              value={localFont}
              onChange={(e) => setLocalFont(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg 
                       bg-white dark:bg-slate-800 text-slate-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="default">Site Default Font</option>
              <option value="Arial, sans-serif">Arial</option>
              <option value="'Times New Roman', serif">Times New Roman</option>
              <option value="Georgia, serif">Georgia</option>
              <option value="'Courier New', monospace">Courier New</option>
              <option value="Verdana, sans-serif">Verdana</option>
              <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
              <option value="'Comic Sans MS', cursive">Comic Sans MS</option>
              <option value="Impact, fantasy">Impact</option>
            </select>
          </div>

          {/* Font Size */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Font Size (optional - uses default for tag)
            </label>
            <Input
              type="text"
              value={localFontSize || ''}
              onChange={(e) => setLocalFontSize(e.target.value)}
              placeholder="e.g., 24px, 1.5rem"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Text Color
            </label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={localColor}
                onChange={(e) => setLocalColor(e.target.value)}
                className="w-20 h-10"
              />
              <Input
                type="text"
                value={localColor}
                onChange={(e) => setLocalColor(e.target.value)}
                placeholder="#1e293b"
              />
            </div>
          </div>

          {/* Alignment */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Text Alignment
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

          {/* Preview */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Preview
            </label>
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              {renderHeading()}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Display mode
  return renderHeading();
}
