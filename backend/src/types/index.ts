export interface User {
  id: number;
  username: string;
  password: string;
  email?: string;
  role: 'super_admin' | 'admin';
  status: 'active' | 'disabled';
  created_at: string;
  updated_at: string;
}

export type FileType = 'html' | 'axure' | 'pdf' | 'drawio' | 'zip' | 'folder' | 'other';

export interface FileData {
  id: number;
  user_id: number;
  name: string;
  original_name: string;
  type: FileType;
  size: number;
  storage_path: string;
  short_id: string;
  share_mode: 'public' | 'password' | 'private';
  share_password: string | null;
  expire_at: string | null;
  visit_count: number;
  last_visited_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Folder {
  id: number;
  user_id: number;
  name: string;
  parent_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface FileFolder {
  file_id: number;
  folder_id: number;
}

export interface JwtPayload {
  id: number;
  username: string;
  role: 'super_admin' | 'admin';
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginationOptions {
  page?: number;
  pageSize?: number;
}

export interface FileListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: string;
  folderId?: number;
  sortBy?: string;
  sortOrder?: string;
  startTime?: string;
  endTime?: string;
}
