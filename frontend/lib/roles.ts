// frontend/lib/roles.ts

export const USER_ROLES = {
  SUBSCRIBER: {
    name: 'Subscriber',
    color: 'bg-slate-100 text-slate-700',
    description: 'Can read content and manage their profile',
    capabilities: [
      'Read posts and pages',
      'Leave comments',
      'Edit own profile',
    ],
  },
  CONTRIBUTOR: {
    name: 'Contributor',
    color: 'bg-blue-100 text-blue-700',
    description: 'Can create and edit own posts (needs approval)',
    capabilities: [
      'All Subscriber capabilities',
      'Create posts (draft only)',
      'Edit own unpublished posts',
      'Delete own unpublished posts',
    ],
  },
  AUTHOR: {
    name: 'Author',
    color: 'bg-green-100 text-green-700',
    description: 'Can publish and manage own posts',
    capabilities: [
      'All Contributor capabilities',
      'Publish own posts',
      'Edit published posts',
      'Delete own posts',
      'Upload files',
    ],
  },
  EDITOR: {
    name: 'Editor',
    color: 'bg-purple-100 text-purple-700',
    description: 'Can manage all posts and moderate content',
    capabilities: [
      'All Author capabilities',
      'Edit others\' posts',
      'Publish others\' posts',
      'Delete others\' posts',
      'Manage categories and tags',
      'Moderate comments',
    ],
  },
  ADMINISTRATOR: {
    name: 'Administrator',
    color: 'bg-red-100 text-red-700',
    description: 'Full control over the website',
    capabilities: [
      'All Editor capabilities',
      'Manage users',
      'Change site settings',
      'Manage pages',
      'Install plugins/themes',
      'Import/export content',
    ],
  },
  SUPER_ADMIN: {
    name: 'Super Admin',
    color: 'bg-orange-100 text-orange-700',
    description: 'Network-wide unrestricted access',
    capabilities: [
      'All Administrator capabilities',
      'Network administration',
      'Unrestricted access',
    ],
  },
};

export function getRoleInfo(role: string) {
  const roleKey = role as keyof typeof USER_ROLES;
  return USER_ROLES[roleKey] || USER_ROLES.SUBSCRIBER;
}

export function getRoleColor(role: string) {
  return getRoleInfo(role).color;
}

export function getRoleName(role: string) {
  return getRoleInfo(role).name;
}
