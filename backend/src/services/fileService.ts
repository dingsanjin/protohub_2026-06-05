import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import bcrypt from 'bcrypt';
import unzipper from 'unzipper';
import { createFile, findFileById, findFileByShortId, updateFile, deleteFile as deleteFileRepo, getUserFiles, incrementVisitCount } from '../repositories/fileRepository';
import { createFileFolder, deleteFileFolder, findFolderById } from '../repositories/folderRepository';
import { createVersion, getVersionsByFileId, getVersionById, getNextVersionNumber, deleteVersion, updateVersionNote } from '../repositories/versionRepository';
import { generateShortId, getFileExtension, getFileType } from '../utils/helpers';
import type { FileData, FileListParams } from '../types';

const STORAGE_PATH = process.env.FILE_STORAGE_PATH || './uploads';

async function extractZip(buffer: Buffer, targetDir: string): Promise<string | null> {
  try {
    await fs.promises.mkdir(targetDir, { recursive: true });

    await unzipper.Open.buffer(buffer)
      .then((d) => d.extract({ path: targetDir }));

    const entries = await fs.promises.readdir(targetDir);

    let entryPoint = null;

    const findEntryPoint = async (dir: string): Promise<string | null> => {
      const files = await fs.promises.readdir(dir, { withFileTypes: true });

      for (const file of files) {
        const fullPath = path.join(dir, file.name);

        if (file.isDirectory()) {
          const found = await findEntryPoint(fullPath);
          if (found) return found;
        } else if (file.isFile() && (file.name === 'index.html' || file.name === 'index.htm')) {
          return fullPath;
        }
      }

      for (const file of files) {
        const fullPath = path.join(dir, file.name);
        if (file.isFile() && (file.name.endsWith('.html') || file.name.endsWith('.htm'))) {
          return fullPath;
        }
      }

      return null;
    };

    entryPoint = await findEntryPoint(targetDir);

    return entryPoint;
  } catch {
    return null;
  }
}

// 在解压目录里找 Vite 项目根（含 package.json + vite.config）
// 最多往下找 3 层，避免误把 node_modules 当根
function findViteProjectRoot(extractDir: string, depth = 0): string | null {
  if (depth > 3) return null;
  const pkgPath = path.join(extractDir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const hasViteConfig = ['vite.config.ts', 'vite.config.js', 'vite.config.mjs', 'vite.config.cjs']
      .some(f => fs.existsSync(path.join(extractDir, f)));
    if (hasViteConfig) return extractDir;
    // 检查 package.json 里的 devDependencies / dependencies
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const all = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      if (all.vite) return extractDir;
    } catch {}
  }
  // 递归子目录
  try {
    const entries = fs.readdirSync(extractDir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules' && e.name !== '__MACOSX') {
        const found = findViteProjectRoot(path.join(extractDir, e.name), depth + 1);
        if (found) return found;
      }
    }
  } catch {}
  return null;
}

// 异步跑 npm install + npm run build，输出写到 log 文件
function runBuild(projectDir: string, logFile: string, timeoutMs: number): Promise<{ ok: boolean; code: number | null; signal: string | null }> {
  return new Promise((resolve) => {
    const logStream = fs.createWriteStream(logFile, { flags: 'a' });
    const child = spawn('bash', ['-c', 'npm install --no-audit --no-fund --loglevel=error && (npm run build 2>&1 || npx vite build --logLevel warn 2>&1)'], {
      cwd: projectDir,
      env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=768', CI: '1' },
    });
    child.stdout.pipe(logStream);
    child.stderr.pipe(logStream);
    const timer = setTimeout(() => {
      try { child.kill('SIGTERM'); } catch {}
      logStream.write('\n\n[protohub-build] TIMEOUT after ' + timeoutMs + 'ms\n');
      resolve({ ok: false, code: null, signal: 'SIGTERM' });
    }, timeoutMs);
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      logStream.end();
      resolve({ ok: code === 0, code, signal });
    });
    child.on('error', (err) => {
      clearTimeout(timer);
      logStream.write('\n\n[protohub-build] SPAWN ERROR: ' + err.message + '\n');
      logStream.end();
      resolve({ ok: false, code: null, signal: null });
    });
  });
}

// 在 build 后的 dist/ 里找 index.html
function findDistEntry(projectDir: string): string | null {
  const distDir = path.join(projectDir, 'dist');
  if (!fs.existsSync(distDir)) return null;
  const candidates = ['index.html', 'index.htm'];
  for (const c of candidates) {
    const p = path.join(distDir, c);
    if (fs.existsSync(p)) return p;
  }
  // 找第一个 .html
  try {
    const files = fs.readdirSync(distDir, { withFileTypes: true });
    for (const f of files) {
      if (f.isFile() && f.name.toLowerCase().endsWith('.html')) {
        return path.join(distDir, f.name);
      }
    }
  } catch {}
  return null;
}

export async function uploadFile(file: Express.Multer.File, userId: number, folderId?: number, customName?: string): Promise<FileData> {
  const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
  const displayName = customName?.trim() || originalName;
  const extension = getFileExtension(originalName);
  let type = getFileType(extension);
  const shortId = generateShortId();
  
  const userDir = path.join(STORAGE_PATH, String(userId));
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }

  let storagePath = `${userId}/${shortId}${extension}`;
  const fullPath = path.join(STORAGE_PATH, storagePath);
  
  if (type === 'zip' || type === 'axure') {
    const extractDir = path.join(STORAGE_PATH, userId.toString(), shortId);
    const entryPoint = await extractZip(file.buffer, extractDir);
    
    if (entryPoint) {
      storagePath = path.relative(STORAGE_PATH, entryPoint);
      // 解压成功并找到入口文件 → 实际上是 html 类型
      type = 'html';
    } else {
      // 解压失败或没有入口文件，按原样保存
      fs.writeFileSync(fullPath, file.buffer);
    }
  } else {
    fs.writeFileSync(fullPath, file.buffer);
  }

  const createdFile = await createFile({
    user_id: userId,
    name: displayName,
    original_name: originalName,
    type,
    size: file.size,
    storage_path: storagePath,
    short_id: shortId,
    share_mode: 'private',
    share_password: null,
    expire_at: null,
    visit_count: 0,
    last_visited_at: null,
  });

  if (folderId) {
    const folder = await findFolderById(folderId);
    if (folder && folder.user_id === userId) {
      await createFileFolder(createdFile.id, folderId);
    }
  }

  // 解压型 + Vite 项目：异步触发 build
  // 立即返回（type=html, storage_path=源码入口），后台跑 build，成功后更新 storage_path → dist 入口
  if (type === 'html' && storagePath && fs.existsSync(path.join(STORAGE_PATH, storagePath))) {
    // 解压出来的入口文件存在 → 找 Vite 项目根
    const extractDir = path.join(STORAGE_PATH, String(userId), shortId);
    const projectRoot = findViteProjectRoot(extractDir);
    if (projectRoot) {
      const logFile = path.join(extractDir, '.protohub-build.log');
      const createdFileId = createdFile.id;
      // 异步 fire-and-forget：build 完更新 db
      setImmediate(() => {
        runBuild(projectRoot, logFile, 5 * 60 * 1000).then(async (res) => {
          if (res.ok) {
            const distEntry = findDistEntry(projectRoot);
            if (distEntry) {
              const newStoragePath = path.relative(STORAGE_PATH, distEntry);
              await updateFile(createdFileId, { storage_path: newStoragePath, size: fs.statSync(distEntry).size });
            }
          }
        }).catch(() => {});
      });
    }
  }

  return createdFile;
}

export async function getFile(fileId: number, userId: number): Promise<FileData | undefined> {
  const file = await findFileById(fileId);
  if (!file || file.user_id !== userId) {
    return undefined;
  }
  return file;
}

export async function listFiles(userId: number, params: FileListParams): Promise<{ list: FileData[]; total: number }> {
  return getUserFiles(userId, params);
}

export async function removeFile(fileId: number, userId: number): Promise<boolean> {
  const file = await findFileById(fileId);
  if (!file || file.user_id !== userId) {
    return false;
  }

  const fullPath = path.join(STORAGE_PATH, file.storage_path);
  // 解压型上传的 storage_path 指向入口文件（如 1/shortId/sub/index.html），
  // 这里必须删整个解压根目录 1/shortId/，否则会残留其它子文件（css/js 等）。
  const extractDir = path.join(STORAGE_PATH, String(file.user_id), file.short_id);
  if (fs.existsSync(extractDir)) {
    fs.rmSync(extractDir, { recursive: true, force: true });
  } else if (fs.existsSync(fullPath)) {
    if (fs.statSync(fullPath).isDirectory()) {
      fs.rmSync(fullPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(fullPath);
    }
  }

  await deleteFileFolder(fileId);
  await deleteFileRepo(fileId);

  return true;
}

export async function updateFileInfo(fileId: number, userId: number, updates: Partial<Pick<FileData, 'name'>> & { folder_id?: number | null }): Promise<FileData | undefined> {
  const file = await findFileById(fileId);
  if (!file || file.user_id !== userId) {
    return undefined;
  }

  const { folder_id, ...fileUpdates } = updates;

  if (folder_id !== undefined) {
    await deleteFileFolder(fileId);
    if (folder_id !== null && folder_id !== undefined) {
      const folder = await findFolderById(folder_id);
      if (folder && folder.user_id === userId) {
        await createFileFolder(fileId, folder_id);
      }
    }
  }

  if (Object.keys(fileUpdates).length > 0) {
    return updateFile(fileId, fileUpdates);
  }

  return findFileById(fileId);
}

export async function moveFileToFolder(fileId: number, userId: number, folderId: number | null): Promise<boolean> {
  const file = await findFileById(fileId);
  if (!file || file.user_id !== userId) {
    return false;
  }

  await deleteFileFolder(fileId);

  if (folderId !== null && folderId !== undefined) {
    const folder = await findFolderById(folderId);
    if (!folder || folder.user_id !== userId) {
      return false;
    }
    await createFileFolder(fileId, folderId);
  }

  await updateFile(fileId, {});

  return true;
}

export async function setShareSettings(fileId: number, userId: number, settings: { share_mode: FileData['share_mode']; password?: string; expire_at?: string }): Promise<FileData | undefined> {
  const file = await findFileById(fileId);
  if (!file || file.user_id !== userId) {
    return undefined;
  }

  const updates: Partial<FileData> = {
    share_mode: settings.share_mode,
    expire_at: settings.expire_at || null,
  };

  if (settings.share_mode === 'password') {
    updates.share_password = settings.password ? await bcrypt.hash(settings.password, 10) : null;
  } else {
    updates.share_password = null;
  }

  return updateFile(fileId, updates);
}

export async function verifySharePassword(shortId: string, password: string): Promise<FileData | null> {
  const file = await findFileByShortId(shortId);
  if (!file) {
    return null;
  }

  if (file.share_mode !== 'password' || !file.share_password) {
    return null;
  }

  const isValid = await bcrypt.compare(password, file.share_password);
  return isValid ? file : null;
}

export async function getPreviewFile(shortId: string, userId?: number): Promise<{ file: FileData; needsPassword: boolean; isExpired: boolean } | null> {
  const file = await findFileByShortId(shortId);
  if (!file) {
    return null;
  }

  const isExpired = file.expire_at ? new Date(file.expire_at) < new Date() : false;
  const needsPassword = file.share_mode === 'password';

  if (file.share_mode === 'private') {
    // 文件所有者或管理员可以预览自己的私密文件
    if (userId && (file.user_id === userId || userId === 1)) {
      return { file, needsPassword: false, isExpired };
    }
    return null;
  }

  return { file, needsPassword, isExpired };
}

export async function listFolderContents(storagePath: string): Promise<Array<{ name: string; type: 'file' | 'folder'; path: string }>> {
  const fullPath = path.join(STORAGE_PATH, storagePath);
  if (!fs.existsSync(fullPath)) {
    return [];
  }

  const files = await fs.promises.readdir(fullPath, { withFileTypes: true });
  const contents: Array<{ name: string; type: 'file' | 'folder'; path: string }> = [];

  for (const file of files) {
    const itemPath = path.join(storagePath, file.name);
    contents.push({
      name: file.name,
      type: file.isDirectory() ? 'folder' : 'file',
      path: itemPath,
    });
  }

  return contents;
}

interface PageTreeNode {
  name: string;
  path: string;
  type: 'page' | 'folder';
  children?: PageTreeNode[];
}

function walkDir(basePath: string, relPath: string): PageTreeNode[] {
  const fullPath = path.join(STORAGE_PATH, basePath, relPath);
  if (!fs.existsSync(fullPath)) return [];

  const entries = fs.readdirSync(fullPath, { withFileTypes: true });
  const nodes: PageTreeNode[] = [];

  const folders: PageTreeNode[] = [];
  const pages: PageTreeNode[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'resources' || entry.name === 'images' || entry.name === '__MACOSX') continue;
    const itemRel = relPath ? path.join(relPath, entry.name) : entry.name;
    if (entry.isDirectory()) {
      const children = walkDir(basePath, itemRel);
      if (children.length > 0) {
        folders.push({ name: entry.name, path: itemRel, type: 'folder', children });
      }
    } else if (/\.(html|htm)$/i.test(entry.name)) {
      pages.push({ name: entry.name.replace(/\.(html|htm)$/i, ''), path: itemRel, type: 'page' });
    }
  }

  return [...folders, ...pages];
}

export function getPageTree(storagePath: string): PageTreeNode[] {
  const fullPath = path.join(STORAGE_PATH, storagePath);
  if (!fs.existsSync(fullPath)) return [];

  const stat = fs.statSync(fullPath);
  if (stat.isFile()) {
    // 单文件：返回这一页
    const name = path.basename(storagePath, path.extname(storagePath));
    return [{ name, path: storagePath, type: 'page' }];
  }

  // 目录：递归扫描
  return walkDir(storagePath, '');
}

// 扫描目录，返回所有 HTML 页面树
export function getPageTreeForDir(dirPath: string): PageTreeNode[] {
  const fullPath = path.join(STORAGE_PATH, dirPath);
  if (!fs.existsSync(fullPath)) return [];
  const stat = fs.statSync(fullPath);
  if (stat.isFile()) return [];
  return walkDir(dirPath, '');
}

// 找到 HTML 项目的入口：index.html / start.html / 第一个 .html
export function findHtmlEntry(storagePath: string): string | null {
  if (storagePath.toLowerCase().endsWith('.html') || storagePath.toLowerCase().endsWith('.htm')) {
    return storagePath;
  }
  const fullPath = path.join(STORAGE_PATH, storagePath);
  if (!fs.existsSync(fullPath)) return null;

  const stat = fs.statSync(fullPath);
  if (stat.isFile()) {
    // 已经是文件了（不应该走到这）
    return storagePath;
  }

  // 优先找 index.html / start.html / default.html
  const candidates = ['index.html', 'index.htm', 'start.html', 'start.htm', 'default.html'];
  for (const c of candidates) {
    const p = path.join(fullPath, c);
    if (fs.existsSync(p)) return path.join(storagePath, c);
  }

  // 找第一个 .html
  const files = fs.readdirSync(fullPath, { withFileTypes: true });
  for (const f of files) {
    if (f.isFile() && f.name.toLowerCase().endsWith('.html')) {
      return path.join(storagePath, f.name);
    }
  }

  return null;
}

export async function trackVisit(shortId: string): Promise<void> {
  const file = await findFileByShortId(shortId);
  if (file) {
    await incrementVisitCount(file.id);
  }
}

// ================= 版本管理 =================

export async function uploadNewVersion(
  fileId: number,
  userId: number,
  uploadedFile: Express.Multer.File,
  note?: string
): Promise<FileData | undefined> {
  const file = await findFileById(fileId);
  if (!file || file.user_id !== userId) {
    return undefined;
  }

  const extension = getFileExtension(uploadedFile.originalname);
  const type = getFileType(extension);

  // 如果是 zip 类型，自动解压
  let newStoragePath: string;
  const versionShortId = generateShortId();

  if (type === 'zip' || type === 'axure') {
    const extractDir = path.join(STORAGE_PATH, String(userId), `v${versionShortId}`);
    const entryPoint = await extractZip(uploadedFile.buffer, extractDir);
    if (entryPoint) {
      newStoragePath = path.relative(STORAGE_PATH, entryPoint);
    } else {
      const fallbackPath = path.join(STORAGE_PATH, String(userId), `v${versionShortId}${extension}`);
      fs.writeFileSync(fallbackPath, uploadedFile.buffer);
      newStoragePath = path.relative(STORAGE_PATH, fallbackPath);
    }
  } else {
    const filePath = path.join(STORAGE_PATH, String(userId), `v${versionShortId}${extension}`);
    fs.writeFileSync(filePath, uploadedFile.buffer);
    newStoragePath = path.relative(STORAGE_PATH, filePath);
  }

  // 将当前版本归档到 file_versions（获取下一个 version number - 1 作为历史版本号）
  const nextVersionNumber = await getNextVersionNumber(fileId);
  const archivedVersionNumber = nextVersionNumber; // 旧版本作为新版本号，然后更新当前版本为更高的

  // 归档旧版本
  await createVersion({
    file_id: fileId,
    version_number: nextVersionNumber,
    storage_path: file.storage_path,
    original_name: file.original_name,
    size: file.size,
    type: file.type,
    note: note || null,
    created_by: userId,
  });

  // 更新当前文件记录（files 表）为新版本内容
  const updatedFile = await updateFile(fileId, {
    storage_path: newStoragePath,
    original_name: uploadedFile.originalname,
    size: uploadedFile.size,
    type,
  });

  // 同时把新版本也写入 file_versions 作为最高版本号的版本
  await createVersion({
    file_id: fileId,
    version_number: nextVersionNumber + 1,
    storage_path: newStoragePath,
    original_name: uploadedFile.originalname,
    size: uploadedFile.size,
    type,
    note: '当前版本',
    created_by: userId,
  });

  return updatedFile;
}

export async function getFileVersions(fileId: number, userId: number): Promise<any[]> {
  const file = await findFileById(fileId);
  if (!file || file.user_id !== userId) {
    return [];
  }
  return getVersionsByFileId(fileId);
}

export async function switchToVersion(versionId: number, userId: number): Promise<FileData | undefined> {
  const version = await getVersionById(versionId);
  if (!version) return undefined;

  const file = await findFileById(version.file_id);
  if (!file || file.user_id !== userId) return undefined;

  // 更新 files 表的 storage_path, size, type, original_name 为所选版本
  const updated = await updateFile(file.id, {
    storage_path: version.storage_path,
    original_name: version.original_name,
    size: version.size,
    type: version.type as FileData['type'],
  });

  return updated;
}

export async function removeFileVersion(versionId: number, userId: number): Promise<boolean> {
  const version = await getVersionById(versionId);
  if (!version) return false;

  const file = await findFileById(version.file_id);
  if (!file || file.user_id !== userId) return false;

  // 不能删除当前活动版本
  if (file.storage_path === version.storage_path) {
    return false;
  }

  // 如果磁盘上是独立文件，删除之，但要防止删除和其他版本共享的路径
  const otherVersionsWithSamePath = await getVersionsByFileId(version.file_id);
  const samePathCount = otherVersionsWithSamePath.filter((v) => v.storage_path === version.storage_path && v.id !== version.id).length;

  // 只有当前版本不被其他版本或活动版本引用时删除物理文件
  const isCurrentActive = file.storage_path === version.storage_path;
  if (!isCurrentActive && samePathCount === 0) {
    try {
      const fullPath = path.join(STORAGE_PATH, version.storage_path);
      if (fs.existsSync(fullPath)) {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          fs.rmSync(fullPath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(fullPath);
        }
      }
    } catch {
      // 静默忽略
    }
  }

  await deleteVersion(versionId);
  return true;
}

export async function setVersionNote(versionId: number, userId: number, note: string): Promise<any | undefined> {
  const version = await getVersionById(versionId);
  if (!version) return undefined;

  const file = await findFileById(version.file_id);
  if (!file || file.user_id !== userId) return undefined;

  return updateVersionNote(versionId, note);
}
