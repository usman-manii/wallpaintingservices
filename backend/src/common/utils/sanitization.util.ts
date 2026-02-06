import sanitizeHtml from 'sanitize-html';

/**
 * HTML Sanitization Utility
 * Prevents XSS attacks by sanitizing user-generated content
 * Enterprise-grade security for blog content, comments, and user inputs
 */

export class SanitizationUtil {
  /**
   * Sanitize HTML content - Allow safe tags for blog content
   * Uses allowlist approach for maximum security
   */
  static sanitizeHTML(html: string): string {
    if (!html) return '';

    return sanitizeHtml(html, {
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
        a: (tagName, attribs) => {
          if (attribs.target === '_blank') {
            const rel = attribs.rel ? attribs.rel : 'noopener noreferrer';
            return { tagName, attribs: { ...attribs, rel } };
          }
          return { tagName, attribs };
        },
      },
    });
  }

  /**
   * Sanitize plain text - Remove all HTML
   * For use in comments, names, emails, etc.
   */
  static sanitizeText(text: string): string {
    if (!text) return '';
    
    // Remove all HTML tags
    let sanitized = text.replace(/<[^>]*>/g, '');
    
    // Decode HTML entities
    sanitized = this.decodeHTMLEntities(sanitized);
    
    // Trim and normalize whitespace
    sanitized = sanitized.trim().replace(/\s+/g, ' ');
    
    return sanitized;
  }

  /**
   * Sanitize SQL input - Prevent SQL injection
   * Note: Prisma already protects against SQL injection, but this adds an extra layer
   */
  static sanitizeSQL(input: string): string {
    if (!input) return '';
    
    // Remove SQL keywords and dangerous characters
    const dangerous = ['--', ';', '/*', '*/', 'xp_', 'sp_', 'DROP', 'INSERT', 'DELETE', 'UPDATE', 'CREATE', 'ALTER'];
    let sanitized = input;
    
    dangerous.forEach(keyword => {
      const regex = new RegExp(keyword, 'gi');
      sanitized = sanitized.replace(regex, '');
    });
    
    return sanitized.trim();
  }

  /**
   * Validate and sanitize email address
   */
  static sanitizeEmail(email: string): string | null {
    if (!email) return null;
    
    const sanitized = email.toLowerCase().trim();
    
    // RFC 5322 compliant email regex (simplified)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    return emailRegex.test(sanitized) ? sanitized : null;
  }

  /**
   * Sanitize URL - Ensure it's safe
   */
  static sanitizeURL(url: string): string | null {
    if (!url) return null;
    
    const sanitized = url.trim();
    
    // Allow only http, https protocols
    if (!/^https?:\/\//i.test(sanitized)) {
      return null;
    }
    
    // Block javascript: and data: protocols
    if (/^(javascript|data):/i.test(sanitized)) {
      return null;
    }
    
    try {
      new URL(sanitized);
      return sanitized;
    } catch {
      return null;
    }
  }

  /**
   * Decode HTML entities
   */
  private static decodeHTMLEntities(text: string): string {
    const entities: { [key: string]: string } = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&nbsp;': ' ',
    };

    return text.replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, match => entities[match] || match);
  }

  /**
   * Validate slug format
   */
  static sanitizeSlug(slug: string): string {
    if (!slug) return '';
    
    return slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 200); // Reasonable max length
  }

  /**
   * Sanitize filename for upload
   */
  static sanitizeFilename(filename: string): string {
    if (!filename) return '';
    
    const ext = filename.split('.').pop();
    const name = filename.substring(0, filename.lastIndexOf('.'));
    
    const sanitizedName = name
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);
    
    return `${sanitizedName}.${ext}`;
  }

  /**
   * Rate limit key sanitization
   */
  static sanitizeRateLimitKey(key: string): string {
    return key.replace(/[^a-zA-Z0-9:-]/g, '').substring(0, 100);
  }
}
