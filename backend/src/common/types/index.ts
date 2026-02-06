// Common Types for Backend
import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    userId?: string;
    email: string;
    role: string;
    capabilities?: string[];
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  search?: string;
  status?: string;
  tags?: string[];
  categories?: string[];
  author?: string;
  startDate?: Date;
  endDate?: Date;
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

export type MediaVariant = {
  url: string;
  width: number;
  height: number;
  size: number;
};

export type SocialChannel = {
  platform: 'twitter' | 'facebook' | 'linkedin' | 'instagram';
  enabled: boolean;
  accessToken?: string;
  pageId?: string;
};
