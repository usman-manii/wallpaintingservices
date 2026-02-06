import { createElement, type ElementType } from 'react';
import parse from 'html-react-parser';
import sanitizeHtml, { IOptions } from 'sanitize-html';

const sanitizeOptions: IOptions = {
  allowedTags: [
    'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
    'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'span', 'div', 'section', 'article',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
    '*': ['class', 'id', 'aria-label', 'aria-hidden', 'role', 'data-*'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel', 'data'],
  allowedSchemesByTag: {
    img: ['http', 'https', 'data'],
  },
  allowProtocolRelative: false,
  transformTags: {
    a: (tagName: string, attribs: Record<string, string>) => {
      if (attribs.target === '_blank') {
        const rel = attribs.rel ? attribs.rel : 'noopener noreferrer';
        return { tagName, attribs: { ...attribs, rel } };
      }
      return { tagName, attribs };
    },
  },
};

type SafeHtmlProps = {
  html: string;
  className?: string;
  as?: ElementType;
};

export function SafeHtml({ html, className, as = 'div' }: SafeHtmlProps) {
  const sanitized = sanitizeHtml(html ?? '', sanitizeOptions);
  const content = parse(sanitized);
  return createElement(as, { className }, content);
}
