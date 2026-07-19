import { getCurrentUser } from '@/api/auth';

export type UserMenuPermissions = string[];
export type UserButtonPermissions = string[];

const DEFAULT_MENU_PERMISSIONS: UserMenuPermissions = ['can_access_dashboard'];
const DEFAULT_BUTTON_PERMISSIONS: UserButtonPermissions = ['can_upload', 'can_delete', 'can_share', 'can_manage_folders'];

function loadMenuPermissions(userId: number): UserMenuPermissions {
  try {
    const raw = localStorage.getItem(`protohub_menu_permissions_${userId}`);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return DEFAULT_MENU_PERMISSIONS;
}

function loadButtonPermissions(userId: number): UserButtonPermissions {
  try {
    const raw = localStorage.getItem(`protohub_button_permissions_${userId}`);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return DEFAULT_BUTTON_PERMISSIONS;
}

export function getUserMenuPermissions(): UserMenuPermissions {
  const user = getCurrentUser();
  if (!user) return DEFAULT_MENU_PERMISSIONS;
  if (user.role === 'super_admin') {
    return ['can_access_dashboard', 'can_access_users'];
  }
  return loadMenuPermissions(user.id);
}

export function getUserButtonPermissions(): UserButtonPermissions {
  const user = getCurrentUser();
  if (!user) return DEFAULT_BUTTON_PERMISSIONS;
  if (user.role === 'super_admin') {
    return ['can_upload', 'can_delete', 'can_share', 'can_manage_folders'];
  }
  return loadButtonPermissions(user.id);
}

export function canAccessDashboard(): boolean {
  return getUserMenuPermissions().includes('can_access_dashboard');
}

export function canAccessUsers(): boolean {
  return getUserMenuPermissions().includes('can_access_users');
}

export function canUpload(): boolean {
  return getUserButtonPermissions().includes('can_upload');
}

export function canDelete(): boolean {
  return getUserButtonPermissions().includes('can_delete');
}

export function canShare(): boolean {
  return getUserButtonPermissions().includes('can_share');
}

export function canManageFolders(): boolean {
  return getUserButtonPermissions().includes('can_manage_folders');
}
