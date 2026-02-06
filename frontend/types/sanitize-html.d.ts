declare module 'sanitize-html' {
  export interface IOptions {
    allowedTags?: string[];
    allowedAttributes?: Record<string, string[]>;
    allowedSchemes?: string[];
    allowedSchemesByTag?: Record<string, string[]>;
    allowProtocolRelative?: boolean;
    enforceHtmlBoundary?: boolean;
    [key: string]: unknown;
  }

  export default function sanitizeHtml(dirty: string, options?: IOptions): string;
}
