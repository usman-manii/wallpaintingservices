'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  List, 
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type
} from 'lucide-react';

interface TextWidgetProps {
  content?: string;
  editable?: boolean;
  onChange?: (content: string) => void;
}

export default function TextWidget({
  content = '<p>Your text content here...</p>',
  editable = false,
  onChange,
}: TextWidgetProps) {
  const [localContent, setLocalContent] = useState(content);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (onChange) {
      onChange(localContent);
    }
  }, [localContent]);

  const applyFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setLocalContent(editorRef.current.innerHTML);
    }
  };

  const handleContentChange = () => {
    if (editorRef.current) {
      setLocalContent(editorRef.current.innerHTML);
    }
  };

  if (editable) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Type size={16} />
            Text Editor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Formatting Toolbar */}
          <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            {/* Text Formatting */}
            <button
              type="button"
              onClick={() => applyFormat('bold')}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
              title="Bold (Ctrl+B)"
            >
              <Bold size={18} />
            </button>
            <button
              type="button"
              onClick={() => applyFormat('italic')}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
              title="Italic (Ctrl+I)"
            >
              <Italic size={18} />
            </button>
            <button
              type="button"
              onClick={() => applyFormat('underline')}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
              title="Underline (Ctrl+U)"
            >
              <Underline size={18} />
            </button>
            <button
              type="button"
              onClick={() => applyFormat('strikeThrough')}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
              title="Strikethrough"
            >
              <Strikethrough size={18} />
            </button>

            <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

            {/* Lists */}
            <button
              type="button"
              onClick={() => applyFormat('insertUnorderedList')}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
              title="Bullet List"
            >
              <List size={18} />
            </button>
            <button
              type="button"
              onClick={() => applyFormat('insertOrderedList')}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
              title="Numbered List"
            >
              <ListOrdered size={18} />
            </button>

            <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

            {/* Alignment */}
            <button
              type="button"
              onClick={() => applyFormat('justifyLeft')}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
              title="Align Left"
            >
              <AlignLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => applyFormat('justifyCenter')}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
              title="Align Center"
            >
              <AlignCenter size={18} />
            </button>
            <button
              type="button"
              onClick={() => applyFormat('justifyRight')}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
              title="Align Right"
            >
              <AlignRight size={18} />
            </button>

            <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

            {/* Font Size */}
            <select
              onChange={(e) => applyFormat('fontSize', e.target.value)}
              className="px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded 
                       bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              defaultValue="3"
            >
              <option value="1">Small</option>
              <option value="3">Normal</option>
              <option value="5">Large</option>
              <option value="7">Huge</option>
            </select>

            {/* Text Color */}
            <input
              type="color"
              onChange={(e) => applyFormat('foreColor', e.target.value)}
              className="w-8 h-8 border border-slate-300 dark:border-slate-600 rounded cursor-pointer"
              title="Text Color"
            />

            {/* Background Color */}
            <input
              type="color"
              onChange={(e) => applyFormat('backColor', e.target.value)}
              className="w-8 h-8 border border-slate-300 dark:border-slate-600 rounded cursor-pointer"
              title="Background Color"
            />
          </div>

          {/* Content Editor */}
          <div
            ref={editorRef}
            contentEditable
            onInput={handleContentChange}
            onBlur={handleContentChange}
            dangerouslySetInnerHTML={{ __html: localContent }}
            className="min-h-[200px] p-4 border-2 border-slate-300 dark:border-slate-600 rounded-lg 
                     bg-white dark:bg-slate-800 text-slate-900 dark:text-white
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     prose prose-slate dark:prose-invert max-w-none"
            style={{
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
            }}
          />

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Select text and use the toolbar above to format it. You can also use keyboard shortcuts.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Display mode
  return (
    <div
      className="prose prose-slate dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: localContent }}
    />
  );
}
