import { get, post, put, del, upload, getAuthToken } from './axios';
import type { File, FileListResponse, FileDetailResponse, UploadResponse, ShareSettings, FileListParams } from '@/types';

export async function uploadFile(
  formData: FormData,
  onProgress?: (percent: number) => void
): Promise<UploadResponse> {
  if (!onProgress) {
    return upload<UploadResponse>('/files/upload', formData);
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const token = getAuthToken();
    const baseURL = import.meta.env.VITE_API_BASE || 'http://localhost:3000';
    xhr.open('POST', `${baseURL}/api/files/upload`, true);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          if (onProgress) onProgress(100);
          resolve(data);
        } else {
          reject(new Error(data?.message || `HTTP ${xhr.status}`));
        }
      } catch (err) {
        reject(err);
      }
    };
    xhr.onerror = () => reject(new Error('网络错误'));
    xhr.send(formData);
  });
}

export async function getFileList(params: FileListParams): Promise<FileListResponse> {
  return get<FileListResponse>('/files', params as Record<string, unknown>);
}

export async function getFileById(id: number): Promise<FileDetailResponse> {
  return get<FileDetailResponse>(`/files/${id}`);
}

export async function updateFile(id: number, data: { name?: string; folder_id?: number }): Promise<File> {
  const response = await put<{ data: File }>(`/files/${id}`, data);
  return response.data;
}

export async function deleteFile(id: number): Promise<void> {
  await del(`/files/${id}`);
}

export async function setShareSettings(id: number, settings: ShareSettings): Promise<File> {
  const response = await post<{ data: File }>(`/files/${id}/share`, settings);
  return response.data;
}

export async function getShareInfo(id: number): Promise<{ short_id: string; share_mode: string; expire_at: string | null; url: string }> {
  const response = await get<{ data: { short_id: string; share_mode: string; expire_at: string | null; url: string } }>(`/files/${id}/share`);
  return response.data;
}

export async function searchFiles(keyword: string): Promise<File[]> {
  const response = await get<{ data: File[] }>('/files/search', { keyword });
  return response.data;
}

export async function uploadNewVersion(fileId: number, formData: FormData): Promise<File> {
  return upload<File>(`/files/${fileId}/versions`, formData);
}

export async function getFileVersions(fileId: number): Promise<any[]> {
  const response = await get<{ data: any[] }>(`/files/${fileId}/versions`);
  return response.data;
}

export async function switchFileVersion(fileId: number, versionId: number): Promise<File> {
  const response = await post<{ data: File }>(`/files/${fileId}/versions/${versionId}/switch`, {});
  return response.data;
}

export async function deleteFileVersion(versionId: number): Promise<void> {
  await del(`/files/versions/${versionId}`);
}

export async function setVersionNote(versionId: number, note: string): Promise<any> {
  const response = await put<{ data: any }>(`/files/versions/${versionId}/note`, { note });
  return response.data;
}
