import { get, post, put, del } from './axios';
import type { Folder, CreateFolderRequest, UpdateFolderRequest } from '@/types';

export async function getFolderList(): Promise<Folder[]> {
  const response = await get<{ data: Folder[] }>('/folders');
  return response.data;
}

export async function getFolderById(id: number): Promise<Folder> {
  const response = await get<{ data: Folder }>(`/folders/${id}`);
  return response.data;
}

export async function createFolder(data: CreateFolderRequest): Promise<Folder> {
  const response = await post<{ data: Folder }>('/folders', data);
  return response.data;
}

export async function updateFolder(id: number, data: UpdateFolderRequest): Promise<Folder> {
  const response = await put<{ data: Folder }>(`/folders/${id}`, data);
  return response.data;
}

export async function deleteFolder(id: number): Promise<void> {
  await del(`/folders/${id}`);
}
