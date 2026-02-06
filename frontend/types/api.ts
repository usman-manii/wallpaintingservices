// API Response Types
import type { JsonValue } from '@/types/json';
export interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  nickname?: string;
  displayName?: string;
  phoneNumber?: string;
  countryCode?: string;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  role: 'SUBSCRIBER' | 'CONTRIBUTOR' | 'AUTHOR' | 'EDITOR' | 'ADMIN' | 'SUPER_ADMIN';
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED';
  publishedAt?: string;
  tags: Tag[];
  categories: Category[];
  author: User;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Comment {
  id: string;
  content: string;
  author: User;
  post: Post;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SPAM' | 'FLAGGED';
  createdAt: string;
}

export interface Page {
  id: string;
  title: string;
  slug: string;
  description?: string;
  content: JsonValue;
  status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED';
  pageType: 'STATIC' | 'DYNAMIC' | 'LANDING' | 'POLICY' | 'BLOG_TEMPLATE';
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
