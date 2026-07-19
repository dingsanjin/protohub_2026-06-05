import { Router } from 'express';
import {
  uploadMiddleware,
  handleUpload,
  handleGetFile,
  handleListFiles,
  handleUpdateFile,
  handleDeleteFile,
  handleSetShareSettings,
  handleGetShareInfo,
  handleRawFile,
  handleUploadNewVersion,
  handleGetVersions,
  handleSwitchVersion,
  handleDeleteVersion,
  handleSetVersionNote,
} from '../controllers/fileController';
import { authenticate, authenticateHeaderOrQuery } from '../middlewares/auth';

const router = Router();

router.post('/upload', authenticate, uploadMiddleware, handleUpload);
router.get('/', authenticate, handleListFiles);
router.get('/:id', authenticate, handleGetFile);
router.get('/:id/raw', authenticateHeaderOrQuery, handleRawFile);
router.put('/:id', authenticate, handleUpdateFile);
router.delete('/:id', authenticate, handleDeleteFile);
router.post('/:id/share', authenticate, handleSetShareSettings);
router.get('/:id/share', authenticate, handleGetShareInfo);

// 版本管理
router.post('/:id/versions', authenticate, uploadMiddleware, handleUploadNewVersion);
router.get('/:id/versions', authenticate, handleGetVersions);
router.post('/:id/versions/:versionId/switch', authenticate, handleSwitchVersion);
router.delete('/versions/:versionId', authenticate, handleDeleteVersion);
router.put('/versions/:versionId/note', authenticate, handleSetVersionNote);

export default router;
