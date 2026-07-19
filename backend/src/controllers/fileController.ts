import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { uploadFile, getFile, listFiles, removeFile, updateFileInfo, setShareSettings, uploadNewVersion, getFileVersions, switchToVersion, removeFileVersion, setVersionNote } from '../services/fileService';
import type { FileListParams } from '../types';

const STORAGE_PATH = process.env.FILE_STORAGE_PATH || './uploads';

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 500 * 1024 * 1024 } });

export const uploadMiddleware = upload.single('file');

export async function handleUpload(req: Request, res: Response) {
  if (!req.file) {
    return res.status(400).json({ success: false, message: '请选择要上传的文件' });
  }

  try {
    const folderId = req.body.folderId ? Number(req.body.folderId) : undefined;
    const customName = req.body.name as string | undefined;
    const file = await uploadFile(req.file, req.user!.id, folderId, customName);
    
    res.json({
      success: true,
      data: {
        id: file.id,
        name: file.name,
        original_name: file.original_name,
        type: file.type,
        size: file.size,
        short_id: file.short_id,
        share_mode: file.share_mode,
      },
    });
  } catch {
    res.status(500).json({ success: false, message: '上传失败' });
  }
}

export async function handleGetFile(req: Request, res: Response) {
  const { id } = req.params;
  const file = await getFile(Number(id), req.user!.id);

  if (!file) {
    return res.status(404).json({ success: false, message: '文件不存在' });
  }

  res.json({ success: true, data: file });
}

export async function handleListFiles(req: Request, res: Response) {
  const params: FileListParams = {
    page: Number(req.query.page) || 1,
    pageSize: Number(req.query.pageSize) || 20,
    search: req.query.search as string,
    type: req.query.type as string,
    folderId: Number(req.query.folderId) || undefined,
    sortBy: req.query.sortBy as string,
    sortOrder: req.query.sortOrder as string,
    startTime: req.query.startTime as string,
    endTime: req.query.endTime as string,
  };

  const { list, total } = await listFiles(req.user!.id, params);

  res.json({
    success: true,
    data: {
      list,
      total,
      page: params.page,
      pageSize: params.pageSize,
    },
  });
}

export async function handleUpdateFile(req: Request, res: Response) {
  const { id } = req.params;
  const { name, folder_id } = req.body;

  const updates: { name?: string; folder_id?: number | null } = {};
  if (name !== undefined) updates.name = name;
  if (folder_id !== undefined) {
    updates.folder_id = folder_id === null ? null : Number(folder_id);
  }

  const file = await updateFileInfo(Number(id), req.user!.id, updates);

  if (!file) {
    return res.status(404).json({ success: false, message: '文件不存在' });
  }

  res.json({ success: true, data: file });
}

export async function handleDeleteFile(req: Request, res: Response) {
  const { id } = req.params;
  const success = await removeFile(Number(id), req.user!.id);

  if (!success) {
    return res.status(404).json({ success: false, message: '文件不存在' });
  }

  res.json({ success: true, message: '删除成功' });
}

export async function handleSetShareSettings(req: Request, res: Response) {
  const { id } = req.params;
  const { share_mode, password, expire_at } = req.body;

  const file = await setShareSettings(Number(id), req.user!.id, {
    share_mode,
    password,
    expire_at,
  });

  if (!file) {
    return res.status(404).json({ success: false, message: '文件不存在' });
  }

  res.json({ success: true, data: file });
}

export async function handleGetShareInfo(req: Request, res: Response) {
  const { id } = req.params;
  const file = await getFile(Number(id), req.user!.id);

  if (!file) {
    return res.status(404).json({ success: false, message: '文件不存在' });
  }

  const serverUrl = `${req.protocol}://${req.get('host')}`;

  res.json({
    success: true,
    data: {
      short_id: file.short_id,
      share_mode: file.share_mode,
      expire_at: file.expire_at,
      url: `${serverUrl}/p/${file.short_id}`,
    },
  });
}

export async function handleRawFile(req: Request, res: Response) {
  const { id } = req.params;
  const file = await getFile(Number(id), req.user!.id);
  if (!file) {
    return res.status(404).json({ success: false, message: '文件不存在' });
  }
  const fullPath = path.resolve(STORAGE_PATH, file.storage_path);
  res.sendFile(fullPath, (err) => {
    if (err) res.status(404).end();
  });
}

export async function handleUploadNewVersion(req: Request, res: Response) {
  const { id } = req.params;
  if (!req.file) {
    return res.status(400).json({ success: false, message: '请选择要上传的文件' });
  }
  const note = req.body.note as string | undefined;
  const file = await uploadNewVersion(Number(id), req.user!.id, req.file, note);
  if (!file) {
    return res.status(404).json({ success: false, message: '上传新版本失败' });
  }
  res.json({ success: true, data: file });
}

export async function handleGetVersions(req: Request, res: Response) {
  const { id } = req.params;
  const versions = await getFileVersions(Number(id), req.user!.id);
  res.json({ success: true, data: versions });
}

export async function handleSwitchVersion(req: Request, res: Response) {
  const { id, versionId } = req.params;
  const file = await switchToVersion(Number(versionId), req.user!.id);
  if (!file) {
    return res.status(404).json({ success: false, message: '切换失败' });
  }
  res.json({ success: true, data: file });
}

export async function handleDeleteVersion(req: Request, res: Response) {
  const { versionId } = req.params;
  const success = await removeFileVersion(Number(versionId), req.user!.id);
  if (!success) {
    return res.status(400).json({ success: false, message: '删除版本失败' });
  }
  res.json({ success: true, message: '删除成功' });
}

export async function handleSetVersionNote(req: Request, res: Response) {
  const { versionId } = req.params;
  const { note } = req.body;
  const version = await setVersionNote(Number(versionId), req.user!.id, note || '');
  if (!version) {
    return res.status(404).json({ success: false, message: '设置备注失败' });
  }
  res.json({ success: true, data: version });
}
