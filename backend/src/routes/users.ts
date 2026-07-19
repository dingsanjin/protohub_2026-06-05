import { Router } from 'express';
import { getUsers, getUser, createUser, updateUser, deleteUser } from '../controllers/userController';
import { authenticate, requireSuperAdmin } from '../middlewares/auth';

const router = Router();

router.get('/', authenticate, requireSuperAdmin, getUsers);
router.get('/:id', authenticate, requireSuperAdmin, getUser);
router.post('/', authenticate, requireSuperAdmin, createUser);
router.put('/:id', authenticate, requireSuperAdmin, updateUser);
router.delete('/:id', authenticate, requireSuperAdmin, deleteUser);

export default router;
