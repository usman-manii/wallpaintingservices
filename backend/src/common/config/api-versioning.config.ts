/**
 * API Versioning Strategy
 * P2 Issue Fix: Implement API versioning for better backward compatibility
 * 
 * Strategy: URI Versioning (e.g., /api/v1/resource)
 * - Simple and widely adopted
 * - Easy to understand and implement
 * - Clear separation of versions
 */

import { VersioningType } from '@nestjs/common';

export const API_VERSIONING_CONFIG = {
  type: VersioningType.URI,
  defaultVersion: '1',
  prefix: 'api/',
};

/**
 * Version-specific features and deprecation timeline
 */
export const API_VERSIONS = {
  v1: {
    version: '1.0.0',
    releaseDate: '2026-01-15',
    status: 'stable',
    deprecationDate: null,
    endOfLifeDate: null,
    features: [
      'Authentication & Authorization',
      'Blog CRUD operations',
      'Media upload & management',
      'Comment system',
      'Page builder',
      'Site settings',
    ],
  },
  // Future versions can be added here
  // v2: {
  //   version: '2.0.0',
  //   releaseDate: '2026-06-01',
  //   status: 'beta',
  //   deprecationDate: null,
  //   endOfLifeDate: null,
  //   features: ['New AI features', 'Enhanced performance'],
  //   breakingChanges: ['Authentication flow updated'],
  // },
} as const;

/**
 * Version deprecation warnings
 */
export function getVersionStatus(version: string): {
  isDeprecated: boolean;
  isEndOfLife: boolean;
  message?: string;
} {
  const versionInfo = API_VERSIONS[`v${version}` as keyof typeof API_VERSIONS];
  
  if (!versionInfo) {
    return {
      isDeprecated: false,
      isEndOfLife: false,
      message: 'Unknown API version',
    };
  }

  const now = new Date();
  const deprecationDate = versionInfo.deprecationDate ? new Date(versionInfo.deprecationDate) : null;
  const endOfLifeDate = versionInfo.endOfLifeDate ? new Date(versionInfo.endOfLifeDate) : null;

  const isEndOfLife = endOfLifeDate ? now > endOfLifeDate : false;
  const isDeprecated = deprecationDate ? now > deprecationDate : false;

  let message: string | undefined;
  if (isEndOfLife) {
    message = `API version ${version} has reached end of life and is no longer supported. Please upgrade to the latest version.`;
  } else if (isDeprecated) {
    message = `API version ${version} is deprecated and will be removed on ${versionInfo.endOfLifeDate}. Please plan to upgrade.`;
  }

  return { isDeprecated, isEndOfLife, message };
}

/**
 * Version compatibility middleware
 * Can be used to add deprecation warnings to responses
 */
export function addVersionHeaders(version: string) {
  const status = getVersionStatus(version);
  const headers: Record<string, string> = {
    'X-API-Version': version,
  };

  if (status.isDeprecated) {
    headers['X-API-Deprecated'] = 'true';
    headers['X-API-Deprecation-Info'] = status.message || '';
  }

  if (status.isEndOfLife) {
    headers['X-API-End-Of-Life'] = 'true';
  }

  return headers;
}
