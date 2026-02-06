/**
 * Shared Page Renderer Utilities
 * P2 Issue Fix: Eliminate duplicate code between DynamicPageRenderer and PageByIdRenderer
 */

import React from 'react';
import { SafeHtml } from '@/components/SafeHtml';
import logger from '@/lib/logger';
import type { JsonValue } from '@/types/json';

export type SectionContent = Record<string, JsonValue>;

export interface PageSection {
  type: string;
  content: SectionContent;
}

export type PageContent = {
  sections: PageSection[];
  globalStyles?: JsonValue;
};

export interface PageData {
  id: string;
  slug: string;
  title: string;
  content: string | PageContent | PageSection[];
  sections?: PageSection[];
  seoTitle?: string;
  seoDescription?: string;
}

/**
 * Render a text section
 */
export function renderTextSection(text: string): React.ReactNode {
  if (!text) return null;
  return <SafeHtml html={text} className="prose dark:prose-invert max-w-none" />;
}

/**
 * Render a two-column layout
 */
export function renderTwoColumnSection(leftColumn: string, rightColumn: string): React.ReactNode {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <SafeHtml html={leftColumn} className="prose dark:prose-invert" />
      <SafeHtml html={rightColumn} className="prose dark:prose-invert" />
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
        <SafeHtml key={i} html={col.content} className="prose dark:prose-invert" />
      ))}
    </div>
  );
}

/**
 * Render a hero section
 */
export function renderHeroSection(content: SectionContent): React.ReactNode {
  const cta = content.cta && typeof content.cta === 'object' ? (content.cta as { url?: string; text?: string }) : null;
  const ctaUrl = typeof cta?.url === 'string' ? cta.url.trim() : '';
  const ctaText = typeof cta?.text === 'string' ? cta.text : 'Learn more';

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20 px-4 rounded-lg">
      <div className="max-w-4xl mx-auto text-center">
        {typeof content.title === 'string' && <h1 className="text-4xl md:text-6xl font-bold mb-6">{content.title}</h1>}
        {typeof content.subtitle === 'string' && <p className="text-xl md:text-2xl mb-8 text-blue-100">{content.subtitle}</p>}
        {cta ? (
          ctaUrl ? (
            <a
              href={ctaUrl}
              className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              {ctaText}
            </a>
          ) : (
            <button
              type="button"
              className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              {ctaText}
            </button>
          )
        ) : null}
      </div>
    </div>
  );
}

/**
 * Render an image section
 */
export function renderImageSection(content: SectionContent): React.ReactNode {
  const url = typeof content.url === 'string' ? content.url : '';
  const alt = typeof content.alt === 'string' ? content.alt : '';
  const caption = typeof content.caption === 'string' ? content.caption : '';

  return (
    <div className="my-8">
      <img
        src={url}
        alt={alt}
        className="w-full h-auto rounded-lg shadow-lg"
      />
      {caption && (
        <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-2">{caption}</p>
      )}
    </div>
  );
}

/**
 * Render a CTA section
 */
export function renderCTASection(content: SectionContent): React.ReactNode {
  const title = typeof content.title === 'string' ? content.title : '';
  const description = typeof content.description === 'string' ? content.description : '';
  const button = typeof content.button === 'object' && content.button
    ? (content.button as { url?: string; text?: string })
    : null;

  return (
    <div className="bg-blue-50 dark:bg-slate-800 p-8 rounded-lg text-center my-8">
      {title && <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">{title}</h3>}
      {description && <p className="text-slate-600 dark:text-slate-300 mb-6">{description}</p>}
      {button && (
        <a
          href={button.url || '#'}
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
        >
          {button.text || 'Get started'}
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
      return (
        <div key={index}>
          {typeof content.text === 'string' && renderTextSection(content.text)}
        </div>
      );

    case 'two_column':
      return (
        <div key={index}>
          {typeof content.leftColumn === 'string' && typeof content.rightColumn === 'string'
            ? renderTwoColumnSection(content.leftColumn, content.rightColumn)
            : null}
        </div>
      );

    case 'multi_column':
      return (
        <div key={index}>
          {Array.isArray(content.columns)
            ? renderMultiColumnSection(content.columns as Array<{ content: string }>)
            : null}
        </div>
      );

    case 'hero':
      return <div key={index}>{renderHeroSection(content)}</div>;

    case 'image':
      return <div key={index}>{renderImageSection(content)}</div>;

    case 'cta':
      return <div key={index}>{renderCTASection(content)}</div>;

    case 'html':
      return typeof content.html === 'string' ? (
        <SafeHtml key={index} html={content.html} className="prose dark:prose-invert max-w-none" />
      ) : null;

    default:
      logger.warn(`Unknown section type: ${type}`);
      return null;
  }
}

/**
 * Check if page content is JSON-based sections or HTML string
 */
export function isJSONContent(content: unknown): boolean {
  if (Array.isArray(content)) return true;
  if (typeof content === 'object' && content !== null && 'sections' in content) {
    const sections = (content as { sections?: unknown }).sections;
    return Array.isArray(sections);
  }
  return false;
}

/**
 * Parse page content safely
 */
export function parsePageContent(content: unknown): { isJSON: boolean; sections?: PageSection[]; html?: string } {
  // If it's already an object with sections
  if (typeof content === 'object' && content !== null) {
    if (Array.isArray(content)) {
      return { isJSON: true, sections: content as PageSection[] };
    }
    if ('sections' in content && Array.isArray((content as { sections?: unknown }).sections)) {
      return { isJSON: true, sections: (content as { sections: PageSection[] }).sections };
    }
  }

  // If it's a JSON string, try to parse it
  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) || (parsed.sections && Array.isArray(parsed.sections))) {
        return {
          isJSON: true,
          sections: Array.isArray(parsed) ? (parsed as PageSection[]) : (parsed.sections as PageSection[]),
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
