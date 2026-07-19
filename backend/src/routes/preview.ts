import { Router } from 'express';
import { handlePreview, handleVerifyPassword, handleServeFile, handleListFolder, handlePageTree } from '../controllers/previewController';

const router = Router();

// 通配子路径小工具：让 /files/* 和 /folder/* 拿到多段路径
const wildcardMiddleware = (req: any, _res: any, next: any) => {
  const w = req.params[0] !== undefined ? req.params[0] : req.params['*'];
  if (w !== undefined) req.params[0] = w;
  next();
};

// 静态文件与目录列表：必须先于 :shortId 注册，否则会被 :shortId 拦截
router.get('/files/*', wildcardMiddleware, handleServeFile);
router.get('/files/(.*)', handleServeFile);
router.get('/folder/*', wildcardMiddleware, handleListFolder);

// 预览与密码：短 ID 通常是 6-8 字符 base64url
router.get('/:shortId', handlePreview);
router.post('/:shortId/verify', handleVerifyPassword);
router.get('/:shortId/tree', handlePageTree);

export default router;
