import { Router } from 'express';
import { getFolders, getFolder, createFolderHandler, updateFolderHandler, deleteFolderHandler } from '../controllers/folderController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.get('/', authenticate, getFolders);
router.get('/:id', authenticate, getFolder);
router.post('/', authenticate, createFolderHandler);
router.put('/:id', authenticate, updateFolderHandler);
router.delete('/:id', authenticate, deleteFolderHandler);

export default router;
