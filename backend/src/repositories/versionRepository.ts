import db from '../database/connection';

export interface FileVersionData {
  id: number;
  file_id: number;
  version_number: number;
  storage_path: string;
  original_name: string;
  size: number;
  type: string;
  note: string | null;
  created_by: number;
  created_at: string;
}

export async function createVersion(data: Omit<FileVersionData, 'id' | 'created_at'>): Promise<FileVersionData> {
  const [result] = await db('file_versions').insert(data).returning('*');
  return result;
}

export async function getVersionsByFileId(fileId: number): Promise<FileVersionData[]> {
  return db('file_versions')
    .where('file_id', fileId)
    .orderBy('version_number', 'desc')
    .select('*');
}

export async function getVersionById(versionId: number): Promise<FileVersionData | undefined> {
  return db('file_versions').where('id', versionId).first();
}

export async function getNextVersionNumber(fileId: number): Promise<number> {
  const result = await db('file_versions')
    .where('file_id', fileId)
    .max('version_number as max_version')
    .first();
  const max = result?.max_version ?? 0;
  return Number(max) + 1;
}

export async function deleteVersion(versionId: number): Promise<void> {
  await db('file_versions').where('id', versionId).del();
}

export async function updateVersionNote(versionId: number, note: string): Promise<FileVersionData | undefined> {
  const [result] = await db('file_versions').where('id', versionId).update({ note }).returning('*');
  return result;
}
