export type FileType = 'html' | 'axure' | 'pdf' | 'drawio' | 'zip' | 'folder' | 'other';

export type ShareMode = 'public' | 'password' | 'private';

export interface File {
  id: number;
  user_id: number;
  name: string;
  original_name: string;
  type: FileType;
  size: number;
  storage_path: string;
  short_id: string;
  share_mode: ShareMode;
  share_password: string | null;
  expire_at: string | null;
  visit_count: number;
  last_visited_at: string | null;
  created_at: string;
  updated_at: string;
  folder_id: number | null;
}

export interface FileListResponse {
  success: boolean;
  data: {
    list: File[];
    total: number;
    page: number;
    pageSize: number;
  };
}

export interface FileDetailResponse {
  success: boolean;
  data: File;
}

export interface UploadResponse {
  success: boolean;
  data: {
    id: number;
    name: string;
    original_name: string;
    type: FileType;
    size: number;
    short_id: string;
    share_mode: ShareMode;
  };
}

export interface SearchFileResponse {
  success: boolean;
  data: File[];
}

export interface ShareInfo {
  short_id: string;
  share_mode: ShareMode;
  expire_at: string | null;
  url: string;
}

export interface ShareSettings {
  share_mode: ShareMode;
  password?: string;
  expire_at?: string;
}

export interface PreviewInfo {
  id: number;
  name: string;
  type: FileType;
  storage_path: string;
  needs_password: boolean;
  is_expired: boolean;
}

export interface FileListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: FileType;
  folderId?: number;
  sortBy?: 'updated_at' | 'created_at' | 'visit_count';
  sortOrder?: 'asc' | 'desc';
  startTime?: string;
  endTime?: string;
}
