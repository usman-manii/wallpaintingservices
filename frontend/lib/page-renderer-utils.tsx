/**
 * Shared Page Renderer Utilities
 * P2 Issue Fix: Eliminate duplicate code between DynamicPageRenderer and PageByIdRenderer
 */

import React from 'react';

export interface PageSection {
  type: string;
  content: any;
}

export interface PageData {
  id: string;
  slug: string;
  title: string;
  content: string | any;
  sections?: PageSection[];
  seoTitle?: string;
  seoDescription?: string;
}

/**
 * Render a text section
 */
export function renderTextSection(text: string): React.ReactNode {
  if (!text) return null;
  return <div dangerouslySetInnerHTML={{ __html: text }} className="prose dark:prose-invert max-w-none" />;
}

/**
 * Render a two-column layout
 */
export function renderTwoColumnSection(leftColumn: string, rightColumn: string): React.ReactNode {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div dangerouslySetInnerHTML={{ __html: leftColumn }} className="prose dark:prose-invert" />
      <div dangerouslySetInnerHTML={{ __html: rightColumn }} className="prose dark:prose-invert" />
    </div>
  );
}

/**
 * Render multi-column layout
 */
export function renderMultiColumnSection(columns: Array<{ content: string }>): React.ReactNode {
  const gridCols = columns.length === 3 ? 'md:grid-cols-3' : columns.length === 4 ? 'md:grid-cols-4' : 'md:grid-cols-2';
  
  return (
    <div className={`grid grid-cols-1 ${gridCols} gap-6`}>
      {columns.map((col, i) => (
        <div key={i} dangerouslySetInnerHTML={{ __html: col.content }} className="prose dark:prose-invert" />
      ))}
    </div>
  );
}

/**
 * Render a hero section
 */
export function renderHeroSection(content: any): React.ReactNode {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20 px-4 rounded-lg">
      <div className="max-w-4xl mx-auto text-center">
        {content.title && <h1 className="text-4xl md:text-6xl font-bold mb-6">{content.title}</h1>}
        {content.subtitle && <p className="text-xl md:text-2xl mb-8 text-blue-100">{content.subtitle}</p>}
        {content.cta && (
          <a
            href={content.cta.url}
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            {content.cta.text}
          </a>
        )}
      </div>
    </div>
  );
}

/**
 * Render an image section
 */
export function renderImageSection(content: any): React.ReactNode {
  return (
    <div className="my-8">
      <img
        src={content.url}
        alt={content.alt || ''}
        className="w-full h-auto rounded-lg shadow-lg"
      />
      {content.caption && (
        <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-2">{content.caption}</p>
      )}
    </div>
  );
}

/**
 * Render a CTA section
 */
export function renderCTASection(content: any): React.ReactNode {
  return (
    <div className="bg-blue-50 dark:bg-slate-800 p-8 rounded-lg text-center my-8">
      {content.title && <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">{content.title}</h3>}
      {content.description && <p className="text-slate-600 dark:text-slate-300 mb-6">{content.description}</p>}
      {content.button && (
        <a
          href={content.button.url}
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
        >
          {content.button.text}
        </a>
      )}
    </div>
  );
}

/**
 * Main section renderer - handles all section types
 */
export function renderSection(section: PageSection, index: number): React.ReactNode {
  const { type, content } = section;

  switch (type) {
    case 'text':
      return <div key={index}>{content.text && renderTextSection(content.text)}</div>;

    case 'two_column':
      return <div key={index}>{renderTwoColumnSection(content.leftColumn, content.rightColumn)}</div>;

    case 'multi_column':
      return <div key={index}>{renderMultiColumnSection(content.columns)}</div>;

    case 'hero':
      return <div key={index}>{renderHeroSection(content)}</div>;

    case 'image':
      return <div key={index}>{renderImageSection(content)}</div>;

    case 'cta':
      return <div key={index}>{renderCTASection(content)}</div>;

    case 'html':
      return (
        <div
          key={index}
          dangerouslySetInnerHTML={{ __html: content.html }}
          className="prose dark:prose-invert max-w-none"
        />
      );

    default:
      console.warn(`Unknown section type: ${type}`);
      return null;
  }
}

/**
 * Check if page content is JSON-based sections or HTML string
 */
export function isJSONContent(content: any): boolean {
  return typeof content === 'object' && content !== null && (Array.isArray(content) || content.sections);
}

/**
 * Parse page content safely
 */
export function parsePageContent(content: any): { isJSON: boolean; sections?: PageSection[]; html?: string } {
  // If it's already an object with sections
  if (typeof content === 'object' && content !== null) {
    if (Array.isArray(content)) {
      return { isJSON: true, sections: content };
    }
    if (content.sections && Array.isArray(content.sections)) {
      return { isJSON: true, sections: content.sections };
    }
  }

  // If it's a JSON string, try to parse it
  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) || (parsed.sections && Array.isArray(parsed.sections))) {
        return {
          isJSON: true,
          sections: Array.isArray(parsed) ? parsed : parsed.sections,
        };
      }
    } catch {
      // Not JSON, treat as HTML
      return { isJSON: false, html: content };
    }
  }

  // Fallback: treat as HTML
  return { isJSON: false, html: String(content || '') };
}
