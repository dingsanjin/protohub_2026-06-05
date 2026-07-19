import db from '../database/connection';
import type { Folder, FileFolder } from '../types';

export async function createFolder(folder: Omit<Folder, 'id' | 'created_at' | 'updated_at'>): Promise<Folder> {
  const [result] = await db('folders').insert(folder).returning('*');
  return result;
}

export async function findFolderById(id: number): Promise<Folder | undefined> {
  return db('folders').where('id', id).first();
}

export async function updateFolder(id: number, updates: Partial<Folder>): Promise<Folder | undefined> {
  const [result] = await db('folders').where('id', id).update(updates).returning('*');
  return result;
}

export async function deleteFolder(id: number): Promise<void> {
  await db('file_folder').where('folder_id', id).del();
  await db('folders').where('id', id).del();
}

export async function getUserFolders(userId: number): Promise<Folder[]> {
  return db('folders').where('user_id', userId).select('*');
}

export async function createFileFolder(fileId: number, folderId: number): Promise<void> {
  await db('file_folder').insert({ file_id: fileId, folder_id: folderId });
}

export async function deleteFileFolder(fileId: number): Promise<void> {
  await db('file_folder').where('file_id', fileId).del();
}

export async function getFileFolders(fileId: number): Promise<FileFolder[]> {
  return db('file_folder').where('file_id', fileId).select('*');
}
