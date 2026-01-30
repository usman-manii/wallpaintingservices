// backend/src/auth/capabilities.ts

export const ROLE_CAPABILITIES = {
  SUBSCRIBER: [
    'read_posts',
    'read_comments',
    'edit_profile',
  ],
  CONTRIBUTOR: [
    'read_posts',
    'read_comments',
    'edit_profile',
    'create_posts',
    'edit_own_posts',
    'delete_own_posts',
  ],
  AUTHOR: [
    'read_posts',
    'read_comments',
    'edit_profile',
    'create_posts',
    'edit_own_posts',
    'delete_own_posts',
    'publish_posts',
    'upload_files',
  ],
  EDITOR: [
    'read_posts',
    'read_comments',
    'edit_profile',
    'create_posts',
    'edit_posts',
    'edit_own_posts',
    'edit_others_posts',
    'publish_posts',
    'delete_posts',
    'delete_own_posts',
    'delete_others_posts',
    'manage_categories',
    'manage_tags',
    'moderate_comments',
    'upload_files',
  ],
  ADMINISTRATOR: [
    'read_posts',
    'read_comments',
    'edit_profile',
    'create_posts',
    'edit_posts',
    'edit_own_posts',
    'edit_others_posts',
    'publish_posts',
    'delete_posts',
    'delete_own_posts',
    'delete_others_posts',
    'manage_categories',
    'manage_tags',
    'moderate_comments',
    'upload_files',
    'manage_users',
    'create_users',
    'edit_users',
    'delete_users',
    'manage_settings',
    'manage_pages',
    'edit_theme',
    'install_plugins',
  ],
  SUPER_ADMIN: [
    'all', // Has all capabilities
  ],
};

export function hasCapability(userRole: string, capability: string, customCapabilities?: string[]): boolean {
  // Check custom capabilities first
  if (customCapabilities && customCapabilities.includes(capability)) {
    return true;
  }
  
  // Super admin has all capabilities
  if (userRole === 'SUPER_ADMIN') {
    return true;
  }
  
  // Check role-based capabilities
  const capabilities = ROLE_CAPABILITIES[userRole] || [];
  return capabilities.includes(capability);
}

export function getUserCapabilities(userRole: string, customCapabilities?: string[]): string[] {
  if (userRole === 'SUPER_ADMIN') {
    return ['all'];
  }
  
  const roleCapabilities = ROLE_CAPABILITIES[userRole] || [];
  return customCapabilities 
    ? [...new Set([...roleCapabilities, ...customCapabilities])]
    : roleCapabilities;
}
