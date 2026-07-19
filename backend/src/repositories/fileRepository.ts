import db from '../database/connection';
import type { FileData, FileListParams } from '../types';

export async function createFile(file: Omit<FileData, 'id' | 'created_at' | 'updated_at'>): Promise<FileData> {
  const [result] = await db('files').insert(file).returning('*');
  return result;
}

export async function findFileById(id: number): Promise<FileData | undefined> {
  return db('files').where('id', id).first();
}

export async function findFileByShortId(shortId: string): Promise<FileData | undefined> {
  return db('files').where('short_id', shortId).first();
}

export async function updateFile(id: number, updates: Partial<FileData>): Promise<FileData | undefined> {
  const [result] = await db('files').where('id', id).update(updates).returning('*');
  return result;
}

export async function deleteFile(id: number): Promise<void> {
  await db('files').where('id', id).del();
}

export async function searchFiles(keyword: string, userId: number): Promise<FileData[]> {
  return db('files')
    .where('user_id', userId)
    .where('name', 'like', `%${keyword}%`)
    .select('*');
}

export async function getUserFiles(userId: number, params: FileListParams): Promise<{ list: (FileData & { folder_id: number | null })[]; total: number }> {
  let query = db('files')
    .leftJoin('file_folder', 'files.id', 'file_folder.file_id')
    .where('files.user_id', userId);

  if (params.search) {
    query = query.where('files.name', 'like', `%${params.search}%`);
  }

  if (params.type) {
    query = query.where('files.type', params.type);
  }

  if (params.folderId) {
    query = query.where('file_folder.folder_id', params.folderId);
  }

  if (params.startTime) {
    query = query.where('files.created_at', '>=', params.startTime);
  }

  if (params.endTime) {
    query = query.where('files.created_at', '<=', params.endTime + ' 23:59:59');
  }

  const sortBy = params.sortBy || 'updated_at';
  const sortOrder = params.sortOrder || 'desc';
  query = query.orderBy(`files.${sortBy}`, sortOrder);

  const page = params.page || 1;
  const pageSize = params.pageSize || 20;
  const offset = (page - 1) * pageSize;
  const totalQuery = query.clone().clearOrder().clearSelect();

  const [totalResult] = await totalQuery.countDistinct('files.id as total');
  const total = Number(totalResult.total);

  const list = await query
    .select('files.*', 'file_folder.folder_id')
    .offset(offset)
    .limit(pageSize);

  return { list, total };
}

export async function incrementVisitCount(id: number): Promise<void> {
  await db('files').where('id', id).increment('visit_count', 1);
  await db('files').where('id', id).update('last_visited_at', new Date().toISOString());
}
