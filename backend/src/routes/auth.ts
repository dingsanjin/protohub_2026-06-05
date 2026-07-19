import { Router } from 'express';
import { handleLogin, handleRegister, handleLogout } from '../controllers/authController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/login', handleLogin);
router.post('/register', handleRegister);
router.post('/logout', authenticate, handleLogout);

export default router;
