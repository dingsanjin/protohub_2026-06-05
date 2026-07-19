export interface Folder {
  id: number;
  user_id: number;
  name: string;
  parent_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface FolderListResponse {
  success: boolean;
  data: {
    list: Folder[];
    total: number;
  };
}

export interface FolderDetailResponse {
  success: boolean;
  data: Folder;
}

export interface CreateFolderRequest {
  name: string;
  parent_id?: number | null;
}

export interface UpdateFolderRequest {
  name?: string;
  parent_id?: number | null;
}
