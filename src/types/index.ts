export * from './user';
export * from './file';
export * from './folder';
import type { FileType } from './file';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginationResponse<T = unknown> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PreviewInfo {
  id: number;
  name: string;
  type: FileType;
  storage_path: string;
  entry_path?: string | null;
  needs_password: boolean;
  is_expired: boolean;
}
