import { Request, Response } from 'express';
import { createFolder, findFolderById, updateFolder, deleteFolder, getUserFolders } from '../repositories/folderRepository';
import type { Folder } from '../types';

export async function getFolders(req: Request, res: Response) {
  const folders = await getUserFolders(req.user!.id);
  res.json({ success: true, data: folders });
}

export async function getFolder(req: Request, res: Response) {
  const { id } = req.params;
  const folder = await findFolderById(Number(id));

  if (!folder || folder.user_id !== req.user!.id) {
    return res.status(404).json({ success: false, message: '文件夹不存在' });
  }

  res.json({ success: true, data: folder });
}

export async function createFolderHandler(req: Request, res: Response) {
  const { name, parent_id } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, message: '文件夹名称不能为空' });
  }

  const folder = await createFolder({
    user_id: req.user!.id,
    name,
    parent_id: parent_id || null,
  });

  res.status(201).json({ success: true, data: folder });
}

export async function updateFolderHandler(req: Request, res: Response) {
  const { id } = req.params;
  const { name, parent_id } = req.body;

  const existingFolder = await findFolderById(Number(id));
  if (!existingFolder || existingFolder.user_id !== req.user!.id) {
    return res.status(404).json({ success: false, message: '文件夹不存在' });
  }

  const updates: Partial<Folder> = {};
  if (name) updates.name = name;
  if (parent_id !== undefined) updates.parent_id = parent_id;

  const folder = await updateFolder(Number(id), updates);

  res.json({ success: true, data: folder });
}

export async function deleteFolderHandler(req: Request, res: Response) {
  const { id } = req.params;

  const folder = await findFolderById(Number(id));
  if (!folder || folder.user_id !== req.user!.id) {
    return res.status(404).json({ success: false, message: '文件夹不存在' });
  }

  await deleteFolder(Number(id));

  res.json({ success: true, message: '删除成功' });
}
