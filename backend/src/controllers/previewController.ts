import { Request, Response } from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
import { getPreviewFile, verifySharePassword, trackVisit, listFolderContents, findHtmlEntry, getPageTree, getPageTreeForDir } from '../services/fileService';

const STORAGE_PATH = process.env.FILE_STORAGE_PATH || './uploads';

function safeJoin(storagePath: string, rel: string): string | null {
  const full = path.resolve(STORAGE_PATH, rel);
  if (!full.startsWith(path.resolve(STORAGE_PATH))) return null;
  return full;
}

function getOptionalUserId(req: Request): number | undefined {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const decoded = jwt.verify(authHeader.substring(7), process.env.JWT_SECRET!) as any;
      return decoded?.id;
    }
  } catch {}
  return undefined;
}

export async function handlePreview(req: Request, res: Response) {
  const { shortId } = req.params;
  const userId = getOptionalUserId(req);

  const result = await getPreviewFile(shortId, userId);

  if (!result) {
    return res.status(404).json({ success: false, message: '文件不存在或未公开' });
  }

  const { file, needsPassword, isExpired } = result;

  await trackVisit(shortId);

  // 对于 HTML 类（html / axure），找到入口文件路径
  let entryPath: string | null = null;
  if (file.type === 'html' || file.type === 'axure') {
    entryPath = findHtmlEntry(file.storage_path);
  }

  res.json({
    success: true,
    data: {
      id: file.id,
      name: file.name,
      type: file.type,
      storage_path: file.storage_path,
      entry_path: entryPath,
      needs_password: needsPassword,
      is_expired: isExpired,
    },
  });
}

export async function handleVerifyPassword(req: Request, res: Response) {
  const { shortId } = req.params;
  const { password } = req.body;

  const file = await verifySharePassword(shortId, password);

  if (!file) {
    return res.status(401).json({ success: false, message: '密码错误' });
  }

  const isExpired = file.expire_at ? new Date(file.expire_at) < new Date() : false;

  await trackVisit(shortId);

  res.json({
    success: true,
    data: {
      id: file.id,
      name: file.name,
      type: file.type,
      storage_path: file.storage_path,
      needs_password: false,
      is_expired: isExpired,
    },
  });
}

export async function handleServeFile(req: Request, res: Response) {
  const rel = req.params[0];
  const fullPath = safeJoin(STORAGE_PATH, rel);
  if (!fullPath) {
    return res.status(403).json({ success: false, message: '非法路径' });
  }

  if (!require('fs').existsSync(fullPath)) {
    return res.status(404).json({ success: false, message: '文件不存在' });
  }

  // 根据扩展名设置 Content-Type
  const ext = path.extname(fullPath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.htm': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.jsx': 'application/javascript; charset=utf-8',
    '.ts': 'application/javascript; charset=utf-8',
    '.tsx': 'application/javascript; charset=utf-8',
    '.map': 'application/json',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.pdf': 'application/pdf',
    '.drawio': 'application/xml',
  };
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  res.setHeader('Content-Type', contentType);

  // 对 HTML 注入 <base href>，并把 /开头的绝对路径引用重写为相对路径
  // 这样无论 HTML 是开发模式（/src/main.tsx）还是构建产物（相对路径），
  // 都能在 iframe 里正确加载依赖资源
  if (ext === '.html' || ext === '.htm') {
    const dir = path.dirname(rel);
    const baseHref = `/api/preview/files/${dir ? dir + '/' : ''}`;
    require('fs').readFile(fullPath, 'utf8', (err: any, data: string) => {
      if (err) {
        return res.status(500).json({ success: false, message: '读取失败' });
      }
      // 1) 把 href /xxx src /xxx 去掉前导 /，变成相对路径
      //    base href 会负责把它解析到当前 HTML 所在目录下
      //    这样 /src/main.tsx → src/main.tsx → /api/preview/files/<html_dir>/src/main.tsx ✅
      //    （保留 http://、https://、//、data: 不动）
      let html = data;
      html = html.replace(
        /\b(href|src)\s*=\s*"(\/[^"]*)"/gi,
        (m, attr, p) => `${attr}="${p.replace(/^\/+/, '')}"`
      );
      html = html.replace(
        /\b(href|src)\s*=\s*'(\/[^']*)'/gi,
        (m, attr, p) => `${attr}='${p.replace(/^\/+/, '')}'`
      );
      // 2) 注入 base href + target=_blank 修复
      const inject = `<head><base href="${baseHref}"><script>document.addEventListener('click',function(e){if(e.target&&e.target.tagName==='A'&&e.target.target==='_blank'){e.preventDefault();window.open(e.target.href,'_blank');}});</script>`;
      if (/<head>/i.test(html)) {
        html = html.replace(/<head>/i, inject);
      } else {
        html = `${inject}</head>${html}`;
      }
      res.send(html);
    });
  } else {
    res.sendFile(fullPath);
  }
}

export async function handleListFolder(req: Request, res: Response) {
  // 通配路由下，路径在 req.params[0]
  const folderPath = (req.params as any)[0] || (req.params as any).path || '';
  try {
    const contents = await listFolderContents(folderPath);
    res.json({ success: true, data: contents });
  } catch {
    res.status(500).json({ success: false, message: '获取文件夹内容失败' });
  }
}

export async function handlePageTree(req: Request, res: Response) {
  const { shortId } = req.params;
  const userId = getOptionalUserId(req);

  const result = await getPreviewFile(shortId, userId);
  if (!result) {
    return res.status(404).json({ success: false, message: '文件不存在或未公开' });
  }

  try {
    const sp = result.file.storage_path;
    // 判定标准：解压目录的 storage_path 形如 "1/shortId/..."，单文件上传是 "1/shortId.html" 或 "1/shortId.htm"
    const extractDirPrefix = `${result.file.user_id}/${result.file.short_id}/`;
    const isExtractDir = sp.startsWith(extractDirPrefix);

    if (!isExtractDir) {
      // 单文件：直接返回 entry_path 一项，不扫任何目录
      const entry = findHtmlEntry(sp) || sp;
      const name = path.basename(entry, path.extname(entry));
      res.json({ success: true, data: [{ name, path: entry, type: 'page' }] });
      return;
    }

    // 目录型（zip/axure 解压）：从解压根目录 {userId}/{shortId}/ 扫描
    const extractRoot = path.join(String(result.file.user_id), result.file.short_id);
    const rawTree = getPageTreeForDir(extractRoot);
    // walkDir 返回的 path 是相对 extractRoot 的，给它补上 storage 绝对路径前缀
    const prefixPath = (node: any) => {
      node.path = path.join(extractRoot, node.path);
      if (node.children) node.children.forEach(prefixPath);
    };
    rawTree.forEach(prefixPath);
    res.json({ success: true, data: rawTree });
  } catch {
    res.status(500).json({ success: false, message: '获取页面树失败' });
  }
}
