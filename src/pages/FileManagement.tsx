import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import JSZip from 'jszip';
import {
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  Radio,
  Space,
  message,
  Popconfirm,
  Tag,
  Tooltip,
  Select,
  Spin,
} from 'antd';
import {
  EyeOutlined,
  ShareAltOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  PlusOutlined,
  FolderOutlined,
  FolderOpenOutlined,
  AppstoreOutlined,
  BarsOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  CalendarOutlined,
  CodeOutlined,
  FileTextOutlined,
  LayoutOutlined,
  BranchesOutlined,
  FileOutlined,
  FileZipOutlined,
  FilePdfOutlined,
  ApartmentOutlined,
  CloudUploadOutlined,
} from '@ant-design/icons';
import { getFileList, uploadFile, deleteFile, setShareSettings, updateFile, getShareInfo, uploadNewVersion, getFileVersions, switchFileVersion, deleteFileVersion } from '@/api/files';
import { getFolderList, createFolder, updateFolder, deleteFolder } from '@/api/folders';
import { FILE_TYPE_MAP, SHARE_MODE_MAP, MAX_FILE_SIZE } from '@/utils/constants';
import { formatFileSize, formatDateTime } from '@/utils/format';
import { makeCover, makeCoverWithPreview } from '@/utils/cover';
import { canUpload, canDelete, canShare, canManageFolders } from '@/utils/permissions';
import type { File as ProtoFile, FileType, ShareSettings, ShareMode, Folder, CreateFolderRequest, UpdateFolderRequest } from '@/types';
import dayjs, { type Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

const FILE_TYPE_ICONS: Record<string, React.ReactNode> = {
  html: <CodeOutlined />,
  axure: <LayoutOutlined />,
  pdf: <FileTextOutlined />,
  drawio: <BranchesOutlined />,
  other: <FileOutlined />,
};

export default function FileManagement() {
  const [files, setFiles] = useState<ProtoFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 });
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<FileType | ''>('');
  const [dateFilter, setDateFilter] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<number | ''>('');
  const [selectedFolderName, setSelectedFolderName] = useState('全部');

  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

  const [selectedFile, setSelectedFile] = useState<ProtoFile | null>(null);
  const [shareUrl, setShareUrl] = useState('');
  const [shareForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const [sortTab, setSortTab] = useState<'updated_at' | 'created_at' | 'visit_count'>('updated_at');

  const [uploadFileObj, setUploadFileObj] = useState<File | null>(null);
  const [uploadDisplayName, setUploadDisplayName] = useState('');
  const [uploadName, setUploadName] = useState('');
  const [uploadFolderId, setUploadFolderId] = useState<number | undefined>(undefined);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadShareMode, setUploadShareMode] = useState<ShareMode>('private');
  const [uploadSharePassword, setUploadSharePassword] = useState('');
  const [uploadExpireAt, setUploadExpireAt] = useState<Dayjs | null>(null);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [coverCache, setCoverCache] = useState<Record<number, string>>({});
  const [dragOverFolderId, setDragOverFolderId] = useState<number | '' | null>(null);
  const [draggingFileId, setDraggingFileId] = useState<number | null>(null);
  const [versionVisible, setVersionVisible] = useState(false);
  const [currentVersionFile, setCurrentVersionFile] = useState<any>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dropActive, setDropActive] = useState(false);
  const [packing, setPacking] = useState(false);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        sortBy: sortTab,
        sortOrder: 'desc',
      };

      if (searchText) params.search = searchText;
      if (typeFilter) params.type = typeFilter;
      if (selectedFolderId) params.folderId = selectedFolderId;
      if (dateFilter && dateFilter[0] && dateFilter[1]) {
        params.startTime = dateFilter[0].format('YYYY-MM-DD');
        params.endTime = dateFilter[1].format('YYYY-MM-DD');
      }

      const response = await getFileList(params);
      if (response.success && response.data) {
        setFiles(response.data.list);
        setPagination((prev) => ({
          ...prev,
          total: response.data.total,
        }));

        response.data.list.forEach((file: ProtoFile) => {
          if (!coverCache[file.id]) {
            setCoverCache((prev) => ({ ...prev, [file.id]: makeCover(file) }));
            makeCoverWithPreview(file).then((cover) => {
              setCoverCache((prev) => ({ ...prev, [file.id]: cover }));
            });
          }
        });
      }
    } catch {
      message.error('获取文件列表失败');
    } finally {
      setLoading(false);
    }
  }, [dateFilter, pagination.page, pagination.pageSize, searchText, selectedFolderId, sortTab, typeFilter]);

  const fetchFolders = useCallback(async () => {
    try {
      const data = await getFolderList();
      setFolders(data);
    } catch {
      message.error('获取文件夹列表失败');
    }
  }, []);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const visitTotal = useMemo(() => files.reduce((sum, f) => sum + (f.visit_count || 0), 0), [files]);

  const openPreview = (file: ProtoFile) => {
    window.open(`/p/${file.short_id}`, '_blank');
  };

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleReset = () => {
    setSearchText('');
    setTypeFilter('');
    setDateFilter(null);
    setSortTab('updated_at');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page: number, pageSize: number) => {
    setPagination({ page, pageSize, total: pagination.total });
  };

  const handleSortTabChange = (key: string) => {
    setSortTab(key as 'updated_at' | 'created_at' | 'visit_count');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const openUploadModal = () => {
    setUploadFileObj(null);
    setUploadDisplayName('');
    setUploadName('');
    setUploadFolderId(typeof selectedFolderId === 'number' ? selectedFolderId : undefined);
    setUploadShareMode('private');
    setUploadSharePassword('');
    setUploadExpireAt(null);
    setUploadProgress(0);
    setUploadModalVisible(true);
  };

  // ================== 上传 ==================

  const packFiles = async (fileList: File[]): Promise<File> => {
    if (fileList.length === 1 && !fileList[0].name.endsWith('.zip')) {
      return fileList[0];
    }
    const zip = new JSZip();
    for (const f of fileList) {
      const rel = (f as any).webkitRelativePath || f.name;
      zip.file(rel.replace(/^\//, ''), f);
    }
    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
    return new File([blob], 'folder-upload.zip', { type: 'application/zip' });
  };

  const setFileAndCheck = (f: File, displayName?: string) => {
    if (f.size > MAX_FILE_SIZE) {
      message.error('文件超过500MB限制');
      return;
    }
    setUploadFileObj(f);
    setUploadDisplayName(displayName || f.name);
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list || list.length === 0) return;
    const files = Array.from(list);
    const totalSize = files.reduce((s, f) => s + f.size, 0);
    if (totalSize > MAX_FILE_SIZE) { message.error('超过500MB限制'); return; }

    if (files.length === 1 && !(files[0] as any).webkitRelativePath) {
      setFileAndCheck(files[0]);
    } else {
      setPacking(true);
      try {
        const folderName = files[0] && (files[0] as any).webkitRelativePath
          ? (files[0] as any).webkitRelativePath.split('/')[0]
          : undefined;
        const zipFile = await packFiles(files);
        setFileAndCheck(zipFile, folderName);
      } catch { message.error('打包失败'); }
      finally { setPacking(false); }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDropActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDropActive(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDropActive(false);

    const dt = e.dataTransfer;
    if (!dt) return;

    const items = dt.items;
    if (items) {
      const entries: any[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].kind !== 'file') continue;
        const entry = (items[i] as any).webkitGetAsEntry?.();
        if (entry) entries.push(entry);
      }

      const dirEntries = entries.filter((en) => en?.isDirectory);
      if (dirEntries.length > 0) {
        const collect = async (entry: any, p = ''): Promise<File[]> => {
          const r: File[] = [];
          if (entry.isFile) {
            const f = await new Promise<File>((res) => entry.file(res));
            Object.defineProperty(f, 'webkitRelativePath', { value: (p + '/' + f.name).replace(/^\//, ''), configurable: true });
            r.push(f);
          } else if (entry.isDirectory) {
            const reader = entry.createReader();
            const subs: any[] = await new Promise((res) => reader.readEntries(res));
            for (const s of subs) r.push(...(await collect(s, p + '/' + entry.name)));
          }
          return r;
        };
        setPacking(true);
        try {
          const all: File[] = [];
          for (const en of dirEntries) all.push(...(await collect(en, '')));
          if (all.length === 0) { message.error('空文件夹'); return; }
          const folderName = dirEntries[0].name;
          const zipFile = await packFiles(all);
          setFileAndCheck(zipFile, folderName);
        } catch { message.error('打包失败'); }
        finally { setPacking(false); }
        return;
      }
    }

    const files = Array.from(dt.files);
    if (files.length === 0) return;
    if (files.length === 1) {
      setFileAndCheck(files[0]);
    } else {
      setPacking(true);
      try {
        const zipFile = await packFiles(files);
        setFileAndCheck(zipFile);
      } catch { message.error('打包失败'); }
      finally { setPacking(false); }
    }
  };

  const detectFileType = (name: string): string => {
    const lower = name.toLowerCase();
    if (lower.endsWith('.html') || lower.endsWith('.htm')) return 'html';
    if (lower.endsWith('.rp') || lower.endsWith('.rplib')) return 'axure';
    if (lower.endsWith('.pdf')) return 'pdf';
    if (lower.endsWith('.drawio') || lower.endsWith('.drawio.xml') || lower.endsWith('.dio')) return 'drawio';
    if (lower.endsWith('.zip')) return 'zip';
    return 'other';
  };

  const handleConfirmUpload = async () => {
    if (!uploadFileObj) {
      message.warning('请先选择要上传的文件');
      return;
    }
    const finalName = uploadName.trim() || uploadDisplayName;
    const formData = new FormData();
    formData.append('file', uploadFileObj, uploadFileObj.name);
    formData.append('name', finalName);
    if (uploadFolderId) {
      formData.append('folderId', String(uploadFolderId));
    }
    setUploading(true);
    setUploadProgress(0);
    try {
      const response = await uploadFile(formData, (p) => setUploadProgress(p));
      if (response.success) {
        if (uploadShareMode !== 'private') {
          const settings: ShareSettings = {
            share_mode: uploadShareMode,
            password: uploadShareMode === 'password' ? uploadSharePassword : undefined,
            expire_at: uploadExpireAt ? uploadExpireAt.toISOString() : undefined,
          };
          await setShareSettings(response.data.id, settings);
        }
        message.success('文件上传成功');
        setUploadModalVisible(false);
        setUploadProgress(0);
        fetchFiles();
      } else {
        message.error('上传失败');
      }
    } catch {
      message.error('上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteFile(id);
      message.success('删除成功');
      fetchFiles();
    } catch {
      message.error('删除失败');
    }
  };

  const handleShare = async (file: ProtoFile) => {
    setSelectedFile(file);
    setShareUrl('');
    shareForm.setFieldsValue({
      share_mode: file.share_mode,
      password: '',
      expire_at: file.expire_at ? dayjs(file.expire_at) : null,
    });
    setShareModalVisible(true);

    try {
      const info = await getShareInfo(file.id);
      setShareUrl(window.location.origin + `/p/${info.short_id}`);
    } catch {
      message.error('获取分享链接失败');
    }
  };

  const handleShareSubmit = async (values: ShareSettings & { expire_at?: Dayjs | null }) => {
    if (!selectedFile) return;

    const settings: ShareSettings = {
      share_mode: values.share_mode,
      password: values.share_mode === 'password' ? values.password : undefined,
      expire_at: values.expire_at ? values.expire_at.toISOString() : undefined,
    };

    try {
      const updatedFile = await setShareSettings(selectedFile.id, settings);
      const info = await getShareInfo(selectedFile.id);
      setSelectedFile(updatedFile);
      setShareUrl(window.location.origin + `/p/${info.short_id}`);
      message.success('分享设置更新成功');
      fetchFiles();
    } catch {
      message.error('更新失败');
    }
  };

  const setShareExpireShortcut = (type: string) => {
    if (type === 'forever') {
      shareForm.setFieldValue('expire_at', null);
      return;
    }
    const daysMap: Record<string, number> = { '3d': 3, '7d': 7, '30d': 30, '90d': 90, '180d': 180 };
    const days = daysMap[type];
    if (days) shareForm.setFieldValue('expire_at', dayjs().add(days, 'day').endOf('day'));
  };

  const handleEdit = (file: ProtoFile) => {
    setSelectedFile(file);
    editForm.resetFields();
    editForm.setFieldsValue({
      name: file.name,
      folder_id: file.folder_id ?? undefined,
      share_mode: file.share_mode,
      share_password: '',
      expire_at: file.expire_at ? dayjs(file.expire_at) : null,
    });
    setEditModalVisible(true);
  };

  const handleEditSubmit = async (values: { name: string; folder_id?: number; share_mode: ShareMode; share_password?: string; expire_at?: Dayjs | null }) => {
    if (!selectedFile) return;

    try {
      const updateData: { name: string; folder_id?: number } = { name: values.name };
      if (values.folder_id !== undefined) {
        updateData.folder_id = values.folder_id;
      }

      await updateFile(selectedFile.id, updateData);

      const settings: ShareSettings = {
        share_mode: values.share_mode,
        password: values.share_mode === 'password' ? values.share_password : undefined,
        expire_at: values.expire_at ? values.expire_at.toISOString() : undefined,
      };
      await setShareSettings(selectedFile.id, settings);

      message.success('更新成功');
      editForm.resetFields();
      setEditModalVisible(false);
      fetchFiles();
    } catch {
      message.error('更新失败');
    }
  };

  const handleFileDragStart = (fileId: number) => {
    setDraggingFileId(fileId);
  };

  const handleFileDragEnd = () => {
    setDraggingFileId(null);
  };

  const handleFolderDragOver = (e: React.DragEvent, folderId: number | '') => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolderId(folderId);
  };

  const handleFolderDragLeave = () => {
    setDragOverFolderId(null);
  };

  const handleFolderDrop = async (e: React.DragEvent, folderId: number | '') => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolderId(null);
    if (draggingFileId === null) return;

    try {
      await updateFile(draggingFileId, { folder_id: folderId === '' ? undefined : folderId });
      message.success('文件已移动');
      fetchFiles();
    } catch {
      message.error('移动失败');
    }
  };

  // ================== 版本管理 ==================

  const handleVersionClick = async (file: any) => {
    setCurrentVersionFile(file);
    setVersionVisible(true);
    await fetchVersions(file.id);
  };

  const fetchVersions = async (fileId: number) => {
    setVersionsLoading(true);
    getFileVersions(fileId)
      .then((data) => setVersions(data))
      .catch(() => message.error('获取版本失败'))
      .finally(() => setVersionsLoading(false));
  };

  const handleUploadNewVersion = async (params: { file: File }) => {
    if (!currentVersionFile) return;
    const formData = new FormData();
    formData.append('file', params.file);
    try {
      await uploadNewVersion(currentVersionFile.id, formData);
      message.success('上传新版本成功');
      fetchVersions(currentVersionFile.id);
      fetchFiles();
    } catch {
      message.error('上传新版本失败');
    }
  };

  const handleSwitchVersion = async (version: any) => {
    if (!currentVersionFile) return;
    try {
      await switchFileVersion(currentVersionFile.id, version.id);
      message.success('已切换到版本 ' + version.version_number);
      fetchVersions(currentVersionFile.id);
      fetchFiles();
    } catch {
      message.error('切换失败');
    }
  };

  const handleDeleteVersion = async (version: any) => {
    try {
      await deleteFileVersion(version.id);
      message.success('已删除版本 ' + version.version_number);
      fetchVersions(currentVersionFile.id);
      fetchFiles();
    } catch {
      message.error('删除版本失败');
    }
  };

  const handleFolderSelect = (id: number | '') => {
    if (id === '') {
      setSelectedFolderId('');
      setSelectedFolderName('全部');
    } else {
      setSelectedFolderId(id);
      const folder = folders.find((f) => f.id === id);
      setSelectedFolderName(folder?.name || '');
    }
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const [folderModalVisible, setFolderModalVisible] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [folderForm] = Form.useForm();

  const getParentFolders = useMemo(() => {
    return folders.filter((f) => f.parent_id === null && (!editingFolder || f.id !== editingFolder.id));
  }, [folders, editingFolder]);

  const getSubFolders = useMemo(() => {
    const map: Record<number, Folder[]> = {};
    folders.forEach((f) => {
      if (f.parent_id) {
        if (!map[f.parent_id]) map[f.parent_id] = [];
        map[f.parent_id].push(f);
      }
    });
    return map;
  }, [folders]);

  const handleFolderAdd = () => {
    setEditingFolder(null);
    folderForm.resetFields();
    setFolderModalVisible(true);
  };

  const handleFolderEdit = (folder: Folder) => {
    folderForm.resetFields();
    setEditingFolder(folder);
    folderForm.setFieldsValue({ name: folder.name, parent_id: folder.parent_id ?? undefined });
    setFolderModalVisible(true);
  };

  const handleFolderDelete = async (folder: Folder) => {
    const hasSubFolders = folders.some((f) => f.parent_id === folder.id);
    const hasFiles = files.some((f) => f.folder_id === folder.id);

    if (hasSubFolders || hasFiles) {
      message.warning(hasFiles 
        ? '该文件夹下有原型，删除后原型将移动到根目录' 
        : '该文件夹下有子文件夹，删除后子文件夹将移动到根目录'
      );
    }

    try {
      await deleteFolder(folder.id);
      message.success('文件夹删除成功');
      if (selectedFolderId === folder.id) {
        setSelectedFolderId('');
        setSelectedFolderName('全部');
      }
      fetchFolders();
      fetchFiles();
    } catch {
      message.error('文件夹删除失败');
    }
  };

  const handleFolderSubmit = async (values: CreateFolderRequest) => {
    try {
      if (editingFolder) {
        const updateData: UpdateFolderRequest = {
          name: values.name,
          parent_id: values.parent_id ?? null,
        };
        await updateFolder(editingFolder.id, updateData);
        message.success('文件夹更新成功');
      } else {
        await createFolder({ ...values, parent_id: values.parent_id ?? null });
        message.success('文件夹创建成功');
      }
      folderForm.resetFields();
      setFolderModalVisible(false);
      fetchFolders();
    } catch {
      message.error('操作失败');
    }
  };

  const renderFileCover = (file: ProtoFile) => {
    const cover = coverCache[file.id] || makeCover(file);
    return (
      <div
        className="file-cover"
        style={{ backgroundImage: `url("${cover}")` }}
        role="img"
        aria-label={`${file.name} 封面`}
      >
        <span className="cover-type-chip">{FILE_TYPE_MAP[file.type] || file.type.toUpperCase()}</span>
        <div className="cover-actions">
          <Tooltip title="预览">
            <button onClick={() => openPreview(file)} aria-label="预览">
              <EyeOutlined />
            </button>
          </Tooltip>
          {canShare() && (
            <Tooltip title="分享">
              <button onClick={() => handleShare(file)} aria-label="分享">
                <ShareAltOutlined />
              </button>
            </Tooltip>
          )}
          <Tooltip title="编辑">
            <button onClick={() => handleEdit(file)} aria-label="编辑">
              <EditOutlined />
            </button>
          </Tooltip>
          {canDelete() && (
            <Popconfirm
              title="确定要删除该文件吗？"
              okText="删除"
              cancelText="取消"
              onConfirm={() => handleDelete(file.id)}
            >
              <Tooltip title="删除">
                <button className="danger" aria-label="删除">
                  <DeleteOutlined />
                </button>
              </Tooltip>
            </Popconfirm>
          )}
        </div>
      </div>
    );
  };

  const renderShareBadge = (file: ProtoFile) => {
    const colorMap: Record<string, string> = { public: '#3FB68B', password: '#E69B43', private: '#7C8497' };
    const mode = file.share_mode;
    const isShared = mode !== 'private';
    return (
      <span className="file-share-badge" style={{ color: colorMap[mode], background: `${colorMap[mode]}1a`, borderColor: `${colorMap[mode]}55` }}>
        {isShared && <ShareAltOutlined style={{ fontSize: 12, marginRight: 4 }} />}
        {SHARE_MODE_MAP[mode] || mode}
      </span>
    );
  };

  const renderFileMeta = (file: ProtoFile) => {
    return (
      <div className="file-meta-row">
        <span className="file-meta-size">{formatFileSize(file.size)}</span>
        <span className="file-meta-sep">·</span>
        <span className="file-meta-visit">{file.visit_count} 次访问</span>
      </div>
    );
  };

  return (
    <div className="file-management-modern">
      <div className="file-folder-panel">
        <div className="panel-header">
          <div>
            <div className="eyebrow">Workspace</div>
            <h3>文件夹</h3>
          </div>
          {canManageFolders() && (
            <Button type="primary" shape="circle" icon={<PlusOutlined />} onClick={handleFolderAdd} />
          )}
        </div>
        <div className="folder-tree-wrap">
          {folders.length === 0 ? (
            <div className="folder-empty" onClick={handleFolderAdd}>
              <FolderOutlined />
              <p>还没有文件夹</p>
              <small>点击这里创建第一个文件夹</small>
            </div>
          ) : (
            <div className="folder-list">
              <button
                className={`folder-pill ${selectedFolderId === '' ? 'is-active' : ''} ${dragOverFolderId === '' ? 'is-drag-over' : ''}`}
                onClick={() => handleFolderSelect('')}
                onDragOver={(e) => handleFolderDragOver(e, '')}
                onDragLeave={handleFolderDragLeave}
                onDrop={(e) => handleFolderDrop(e, '')}
              >
                <FolderOpenOutlined /> 全部（无文件夹）
              </button>
              {folders.filter((f) => f.parent_id === null).map((parent) => (
                <div key={parent.id} className="folder-group">
                  <div
                    className={`folder-pill-row ${selectedFolderId === parent.id ? 'is-active' : ''}`}
                  >
                    <button
                      className={`folder-pill ${dragOverFolderId === parent.id ? 'is-drag-over' : ''}`}
                      onClick={() => handleFolderSelect(parent.id)}
                      onDragOver={(e) => handleFolderDragOver(e, parent.id)}
                      onDragLeave={handleFolderDragLeave}
                      onDrop={(e) => handleFolderDrop(e, parent.id)}
                    >
                      <FolderOutlined />
                      <span className="name">{parent.name}</span>
                    </button>
                    {canManageFolders() && (
                      <span className="folder-pill-actions">
                        <button title="编辑" onClick={() => handleFolderEdit(parent)}>
                          <EditOutlined />
                        </button>
                        <Popconfirm
                          title="确定要删除该文件夹吗？"
                          description={folders.some((f) => f.parent_id === parent.id) || files.some((f) => f.folder_id === parent.id) ? '该文件夹下有内容，删除后内容将移动到根目录' : '删除文件夹不会删除文件，文件保留在此处。'}
                          onConfirm={() => handleFolderDelete(parent)}
                          okText="删除"
                          cancelText="取消"
                        >
                          <button title="删除">
                            <DeleteOutlined />
                          </button>
                        </Popconfirm>
                      </span>
                    )}
                  </div>
                  {getSubFolders[parent.id]?.map((child) => (
                    <div
                      key={child.id}
                      className={`folder-pill-row folder-child ${selectedFolderId === child.id ? 'is-active' : ''}`}
                    >
                      <button
                        className={`folder-pill ${dragOverFolderId === child.id ? 'is-drag-over' : ''}`}
                        onClick={() => handleFolderSelect(child.id)}
                        onDragOver={(e) => handleFolderDragOver(e, child.id)}
                        onDragLeave={handleFolderDragLeave}
                        onDrop={(e) => handleFolderDrop(e, child.id)}
                      >
                        <FolderOutlined />
                        <span className="name">{child.name}</span>
                      </button>
                      {canManageFolders() && (
                        <span className="folder-pill-actions">
                          <button title="编辑" onClick={() => handleFolderEdit(child)}>
                            <EditOutlined />
                          </button>
                          <Popconfirm
                            title="确定要删除该文件夹吗？"
                            description={files.some((f) => f.folder_id === child.id) ? '该文件夹下有原型，删除后原型将移动到根目录' : '删除文件夹不会删除文件，文件保留在此处。'}
                            onConfirm={() => handleFolderDelete(child)}
                            okText="删除"
                            cancelText="取消"
                          >
                            <button title="删除">
                              <DeleteOutlined />
                            </button>
                          </Popconfirm>
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="file-content-panel">
        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-title">
              {selectedFolderName === '全部' ? '全部' : selectedFolderName}
            </h1>
            <div className="page-stats">
              <div className="stat-item">
                <span className="stat-value">{pagination.total}</span>
                <span className="stat-label">文件</span>
              </div>
              <div className="stat-divider" />
              <div className="stat-item">
                <span className="stat-value">{folders.length}</span>
                <span className="stat-label">文件夹</span>
              </div>
              <div className="stat-divider" />
              <div className="stat-item">
                <span className="stat-value">{visitTotal}</span>
                <span className="stat-label">访问</span>
              </div>
            </div>
          </div>
          <div className="page-header-right">
            {canUpload() && (
              <button className="primary-cta" onClick={openUploadModal}>
                <CloudUploadOutlined /> 上传原型
              </button>
            )}
          </div>
        </div>

        <div className="control-bar">
          <div className="control-bar-top">
            <Input.Search
              className="modern-search"
              placeholder="搜索你的原型 / 文件名"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={handleSearch}
              onPressEnter={handleSearch}
              allowClear
              enterButton
            />

            <div className="chip-row">
              <button
                className={`chip ${typeFilter === '' ? 'is-active' : ''}`}
                onClick={() => {
                  setTypeFilter('');
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
              >
                <FolderOutlined /> 全部
              </button>
              {(Object.keys(FILE_TYPE_MAP) as FileType[]).map((t) => (
                <button
                  key={t}
                  className={`chip chip-${t} ${typeFilter === t ? 'is-active' : ''}`}
                  onClick={() => {
                    setTypeFilter(t);
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                >
                  {FILE_TYPE_ICONS[t]} {FILE_TYPE_MAP[t]}
                </button>
              ))}
            </div>

            <RangePicker
              className="modern-range"
              placeholder={['开始日期', '结束日期']}
              value={dateFilter}
              onChange={(dates) => {
                setDateFilter(dates);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            />

            <Button className="ghost-reset" onClick={handleReset}>重置</Button>
          </div>

          <div className="control-bar-bottom">
            <div className="sort-pills">
              <button
                className={`sort-pill ${sortTab === 'updated_at' ? 'is-active' : ''}`}
                onClick={() => handleSortTabChange('updated_at')}
              >
                <ClockCircleOutlined /> 最近更新
              </button>
              <button
                className={`sort-pill ${sortTab === 'created_at' ? 'is-active' : ''}`}
                onClick={() => handleSortTabChange('created_at')}
              >
                <CalendarOutlined /> 上传时间
              </button>
              <button
                className={`sort-pill ${sortTab === 'visit_count' ? 'is-active' : ''}`}
                onClick={() => handleSortTabChange('visit_count')}
              >
                <ThunderboltOutlined /> 访问热度
              </button>
            </div>

            <div className="view-toggle">
              <button
                className={viewMode === 'grid' ? 'is-active' : ''}
                onClick={() => setViewMode('grid')}
                aria-label="网格视图"
              >
                <AppstoreOutlined />
              </button>
              <button
                className={viewMode === 'list' ? 'is-active' : ''}
                onClick={() => setViewMode('list')}
                aria-label="列表视图"
              >
                <BarsOutlined />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid-skeleton">
            {Array.from({ length: 6 }).map((_, i) => (
              <div className="skeleton-card" key={i}>
                <div className="skel-cover" />
                <div className="skel-line" />
                <div className="skel-line short" />
              </div>
            ))}
          </div>
        ) : files.length === 0 ? (
          <div className="empty-state">
            <div className="empty-art" aria-hidden />
            <h2>这里还没有文件</h2>
            <p>上传第一个原型，或者换个文件夹看看。</p>
            {canUpload() && (
              <Button type="primary" icon={<CloudUploadOutlined />} onClick={openUploadModal}>
                上传第一个原型
              </Button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="file-grid-wrapper">
            <div className="file-grid">
              {files.map((file) => (
                <article
                  className={`file-card ${draggingFileId === file.id ? 'is-dragging' : ''}`}
                  key={file.id}
                  draggable
                  onDragStart={() => handleFileDragStart(file.id)}
                  onDragEnd={handleFileDragEnd}
                  title="拖拽此文件到左侧文件夹进行归类"
                >
                  {renderFileCover(file)}
                  <div className="file-card-body">
                    <div className="file-card-header">
                      <h3 className="file-card-title" title={file.name}>{file.name}</h3>
                      {renderShareBadge(file)}
                    </div>
                    {renderFileMeta(file)}
                    <div className="file-card-footer">
                      <span>{formatDateTime(file.updated_at)}</span>
                      <Space size={4}>
                        <Button type="text" size="small" icon={<BranchesOutlined />} onClick={() => handleVersionClick(file)} title="版本管理" />
                        {canShare() && (
                          <Button type="text" size="small" icon={<ShareAltOutlined />} onClick={() => handleShare(file)} />
                        )}
                      </Space>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <div className="pagination grid-pagination">
              <span>共 {pagination.total} 个原型 · 第 {pagination.page} 页</span>
              <Space>
                <Button disabled={pagination.page <= 1} onClick={() => handlePageChange(pagination.page - 1, pagination.pageSize)}>上一页</Button>
                <Button disabled={pagination.page * pagination.pageSize >= pagination.total} onClick={() => handlePageChange(pagination.page + 1, pagination.pageSize)}>下一页</Button>
              </Space>
            </div>
          </div>
        ) : (
          <div className="list-card">
            <table className="file-list-table">
              <thead>
                <tr>
                  <th>原型</th>
                  <th>名称</th>
                  <th>类型</th>
                  <th>大小</th>
                  <th>分享</th>
                  <th>访问</th>
                  <th>更新时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr
                    key={file.id}
                    draggable
                    onDragStart={() => handleFileDragStart(file.id)}
                    onDragEnd={handleFileDragEnd}
                    className={draggingFileId === file.id ? 'is-dragging' : ''}
                    title="拖拽此行到左侧文件夹进行归类"
                  >
                    <td>
                      <div className="list-cover" style={{ backgroundImage: `url("${coverCache[file.id] || makeCover(file)}")` }} />
                    </td>
                    <td>
                      <div className="list-title-cell">
                        <strong>{file.name}</strong>
                      </div>
                    </td>
                    <td>{FILE_TYPE_MAP[file.type] || file.type}</td>
                    <td>{formatFileSize(file.size)}</td>
                    <td>
                      <span className="share-status-tag" style={{
                        color: file.share_mode === 'public' ? '#3FB68B' : file.share_mode === 'password' ? '#E69B43' : '#7C8497',
                        background: file.share_mode === 'public' ? '#3FB68B1a' : file.share_mode === 'password' ? '#E69B431a' : '#7C84971a',
                        borderColor: file.share_mode === 'public' ? '#3FB68B55' : file.share_mode === 'password' ? '#E69B4355' : '#7C849755',
                      }}>
                        {(file.share_mode !== 'private') && <ShareAltOutlined style={{ fontSize: 12, marginRight: 4 }} />}
                        {SHARE_MODE_MAP[file.share_mode] || file.share_mode}
                      </span>
                    </td>
                    <td>{file.visit_count}</td>
                    <td>{formatDateTime(file.updated_at)}</td>
                    <td>
                      <Space size={4}>
                        <Button type="text" icon={<EyeOutlined />} onClick={() => openPreview(file)} />
                        {canShare() && (
                          <Button type="text" icon={<ShareAltOutlined />} onClick={() => handleShare(file)} />
                        )}
                        <Button type="text" icon={<BranchesOutlined />} onClick={() => handleVersionClick(file)} title="版本管理" />
                        <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(file)} />
                        {canDelete() && (
                          <Popconfirm
                            title="确定要删除？"
                            okText="删除"
                            cancelText="取消"
                            onConfirm={() => handleDelete(file.id)}
                          >
                            <Button type="text" danger icon={<DeleteOutlined />} />
                          </Popconfirm>
                        )}
                      </Space>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="pagination list-pagination">
              <span>共 {pagination.total} 个原型 · 第 {pagination.page} 页</span>
              <Space>
                <Button disabled={pagination.page <= 1} onClick={() => handlePageChange(pagination.page - 1, pagination.pageSize)}>上一页</Button>
                <Button disabled={pagination.page * pagination.pageSize >= pagination.total} onClick={() => handlePageChange(pagination.page + 1, pagination.pageSize)}>下一页</Button>
              </Space>
            </div>
          </div>
        )}
      </div>

      <Modal
        title="上传原型"
        open={uploadModalVisible}
        destroyOnClose
        onCancel={() => setUploadModalVisible(false)}
        onOk={handleConfirmUpload}
        confirmLoading={uploading}
        okText="开始上传"
        cancelText="取消"
        okButtonProps={{ disabled: !uploadFileObj }}
        width={520}
      >
        <Form layout="vertical">
          <Form.Item label="选择文件" required>
            <input
              ref={fileInputRef}
              type="file"
              accept=".html,.htm,.rp,.rplib,.pdf,.drawio,.drawio.xml,.dio,.zip"
              multiple
              style={{ display: 'none' }}
              onChange={handleFileInputChange}
            />

            <div
              className={`upload-dropzone ${dropActive ? 'is-active' : ''} ${packing ? 'is-packing' : ''} ${uploadFileObj ? 'has-file' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              {packing ? (
                <div className="upload-dropzone-inner">
                  <Spin size="default" />
                  <p className="upload-dropzone-text">正在处理…</p>
                </div>
              ) : uploadFileObj ? (
                <div className="upload-dropzone-inner">
                  <div className="upload-dropzone-file-icon">
                    {detectFileType(uploadFileObj.name) === 'html' ? <FileTextOutlined /> :
                     detectFileType(uploadFileObj.name) === 'axure' ? <FileZipOutlined /> :
                     detectFileType(uploadFileObj.name) === 'pdf' ? <FilePdfOutlined /> :
                     detectFileType(uploadFileObj.name) === 'drawio' ? <ApartmentOutlined /> :
                     <FileOutlined />}
                  </div>
                  <p className="upload-dropzone-text">{uploadDisplayName}</p>
                  <p className="upload-dropzone-hint">
                    {(uploadFileObj.size / 1024 / 1024).toFixed(2)} MB · {FILE_TYPE_MAP[detectFileType(uploadFileObj.name)] || detectFileType(uploadFileObj.name)}
                  </p>
                  <Button size="small" onClick={(e) => { e.stopPropagation(); setUploadFileObj(null); setUploadDisplayName(''); }}>
                    重新选择
                  </Button>
                </div>
              ) : (
                <div className="upload-dropzone-inner">
                  <div className="upload-dropzone-icon">
                    <CloudUploadOutlined />
                  </div>
                  <p className="upload-dropzone-text">点击选择或拖拽文件/文件夹到此处</p>
                  <p className="upload-dropzone-hint">支持 HTML、Axure、PDF、Draw.io、ZIP 压缩包</p>
                </div>
              )}
            </div>

            <div className="upload-type-tags">
              <span>支持：</span>
              <Tag>HTML/HTM</Tag>
              <Tag>Axure (.rp)</Tag>
              <Tag>PDF</Tag>
              <Tag>Draw.io</Tag>
              <Tag>.zip</Tag>
              <Tag>文件夹</Tag>
            </div>
          </Form.Item>
          <Form.Item label="文件名称">
            <Input
              placeholder={uploadFileObj ? `留空则使用：${uploadDisplayName}` : '留空则使用源文件名'}
              value={uploadName}
              onChange={(e) => setUploadName(e.target.value)}
            />
          </Form.Item>
          <Form.Item label="所属文件夹">
            <Select
              value={uploadFolderId ?? undefined}
              onChange={(value) => setUploadFolderId(value || undefined)}
              style={{ width: '100%' }}
              placeholder="选择文件夹"
              allowClear
            >
              <Select.Option value={undefined}>不选文件夹</Select.Option>
              {folders.filter((f) => f.parent_id === null).map((parent) => (
                <React.Fragment key={parent.id}>
                  <Select.Option value={parent.id}>{parent.name}</Select.Option>
                  {getSubFolders[parent.id]?.map((child) => (
                    <Select.Option key={child.id} value={child.id}>
                      └── {child.name}
                    </Select.Option>
                  ))}
                </React.Fragment>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="分享设置">
            <Radio.Group
              value={uploadShareMode}
              onChange={(e) => setUploadShareMode(e.target.value)}
              options={[
                { value: 'private', label: '私密' },
                { value: 'public', label: '公开' },
                { value: 'password', label: '密码保护' },
              ]}
              optionType="button"
            />
          </Form.Item>

          {uploadShareMode === 'password' && (
            <Form.Item label="分享密码">
              <Input.Password
                placeholder="设置分享密码"
                value={uploadSharePassword}
                onChange={(e) => setUploadSharePassword(e.target.value)}
              />
            </Form.Item>
          )}

          {(uploadShareMode === 'public' || uploadShareMode === 'password') && (
            <Form.Item label="有效期">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Radio.Group
                  optionType="button"
                  onChange={(e) => {
                    if (e.target.value === 'forever') {
                      setUploadExpireAt(null);
                    } else {
                      const daysMap: Record<string, number> = { '3d': 3, '7d': 7, '30d': 30, '90d': 90, '180d': 180 };
                      const days = daysMap[e.target.value];
                      if (days) setUploadExpireAt(dayjs().add(days, 'day').endOf('day'));
                    }
                  }}
                  options={[
                    { value: 'forever', label: '永久' },
                    { value: '3d', label: '3天' },
                    { value: '7d', label: '7天' },
                    { value: '30d', label: '1个月' },
                    { value: '90d', label: '3个月' },
                    { value: '180d', label: '6个月' },
                  ]}
                />
                <DatePicker
                  showTime
                  placeholder="自定义过期时间"
                  allowClear
                  style={{ width: '100%' }}
                  value={uploadExpireAt}
                  onChange={(value) => setUploadExpireAt(value)}
                />
              </Space>
            </Form.Item>
          )}

          {uploading && (
            <div className="upload-progress-wrap">
              <div className="upload-progress-text">
                <span>上传中</span>
                <span className="upload-progress-percent">{uploadProgress}%</span>
              </div>
              <div className="upload-progress-bar">
                <div
                  className="upload-progress-fill"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              {uploadProgress === 100 && (
                <div className="upload-progress-tip">正在服务器处理（解压/识别），请稍候…</div>
              )}
            </div>
          )}
        </Form>
      </Modal>

      <Modal
        title="分享设置"
        open={shareModalVisible}
        onCancel={() => setShareModalVisible(false)}
        footer={null}
      >
        <Form
          form={shareForm}
          layout="vertical"
          onFinish={handleShareSubmit}
        >
          <Form.Item
            name="share_mode"
            label="分享模式"
            rules={[{ required: true, message: '请选择分享模式' }]}
          >
            <Radio.Group
              options={[
                { value: 'public', label: '公开' },
                { value: 'password', label: '密码保护' },
                { value: 'private', label: '私密' },
              ]}
              optionType="button"
            />
          </Form.Item>

          <Form.Item shouldUpdate={(prev, current) => prev.share_mode !== current.share_mode} noStyle>
            {({ getFieldValue }) =>
              getFieldValue('share_mode') === 'password' ? (
                <Form.Item
                  name="password"
                  label="分享密码"
                  rules={[{ required: true, message: '请输入分享密码' }]}
                >
                  <Input.Password placeholder="设置分享密码" />
                </Form.Item>
              ) : null
            }
          </Form.Item>

          <Form.Item label="有效期">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Radio.Group
                optionType="button"
                onChange={(e) => setShareExpireShortcut(e.target.value)}
                options={[
                  { value: 'forever', label: '永久' },
                  { value: '3d', label: '3天' },
                  { value: '7d', label: '7天' },
                  { value: '30d', label: '1个月' },
                  { value: '90d', label: '3个月' },
                  { value: '180d', label: '6个月' },
                ]}
              />
              <Form.Item name="expire_at" noStyle>
                <DatePicker showTime placeholder="也可以自定义过期时间" allowClear style={{ width: '100%' }} />
              </Form.Item>
            </Space>
          </Form.Item>

          <Form.Item shouldUpdate={(prev, current) => prev.share_mode !== current.share_mode} noStyle>
            {({ getFieldValue }) => {
              const mode = getFieldValue('share_mode');
              return shareUrl ? (
                <div className="share-link-card">
                  <div className="share-link-meta">
                    <span>分享链接</span>
                    <Tag color={mode === 'private' ? 'default' : mode === 'password' ? 'gold' : 'green'}>
                      {mode === 'private' ? '私密不可访问' : mode === 'password' ? '密码访问' : '公开访问'}
                    </Tag>
                  </div>
                  <Input.Search
                    value={shareUrl}
                    readOnly
                    enterButton="复制链接"
                    disabled={mode === 'private'}
                    onSearch={() => {
                      navigator.clipboard.writeText(shareUrl);
                      message.success('链接已复制');
                    }}
                  />
                  {mode === 'private' && <div className="share-link-tip">当前为私密模式，链接不会对外开放。切换为公开或密码保护后再复制给他人。</div>}
                </div>
              ) : null;
            }}
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setShareModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">保存设置并生成链接</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        key={selectedFile?.id ?? 'edit-file'}
        title="编辑文件"
        open={editModalVisible}
        destroyOnClose
        onCancel={() => setEditModalVisible(false)}
        footer={null}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditSubmit}
        >
          <Form.Item
            name="name"
            label="文件名"
            rules={[{ required: true, message: '请输入文件名' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="folder_id" label="所属文件夹">
            <Select
              style={{ width: '100%' }}
              placeholder="选择文件夹"
              allowClear
            >
              <Select.Option value={undefined}>不选文件夹</Select.Option>
              {folders.filter((f) => f.parent_id === null).map((parent) => (
                <React.Fragment key={parent.id}>
                  <Select.Option value={parent.id}>{parent.name}</Select.Option>
                  {getSubFolders[parent.id]?.map((child) => (
                    <Select.Option key={child.id} value={child.id}>
                      └── {child.name}
                    </Select.Option>
                  ))}
                </React.Fragment>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="share_mode" label="分享设置">
            <Radio.Group
              options={[
                { value: 'private', label: '私密' },
                { value: 'public', label: '公开' },
                { value: 'password', label: '密码保护' },
              ]}
              optionType="button"
            />
          </Form.Item>

          <Form.Item shouldUpdate={(prev, current) => prev.share_mode !== current.share_mode} noStyle>
            {({ getFieldValue }) =>
              getFieldValue('share_mode') === 'password' ? (
                <Form.Item
                  name="share_password"
                  label="分享密码"
                  rules={[{ required: true, message: '请输入分享密码' }]}
                >
                  <Input.Password placeholder="设置分享密码" />
                </Form.Item>
              ) : null
            }
          </Form.Item>

          <Form.Item label="有效期">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Radio.Group
                optionType="button"
                onChange={(e) => {
                  if (e.target.value === 'forever') {
                    editForm.setFieldValue('expire_at', null);
                  } else {
                    const daysMap: Record<string, number> = { '3d': 3, '7d': 7, '30d': 30, '90d': 90, '180d': 180 };
                    const days = daysMap[e.target.value];
                    if (days) editForm.setFieldValue('expire_at', dayjs().add(days, 'day').endOf('day'));
                  }
                }}
                options={[
                  { value: 'forever', label: '永久' },
                  { value: '3d', label: '3天' },
                  { value: '7d', label: '7天' },
                  { value: '30d', label: '1个月' },
                  { value: '90d', label: '3个月' },
                  { value: '180d', label: '6个月' },
                ]}
              />
              <Form.Item name="expire_at" noStyle>
                <DatePicker showTime placeholder="自定义过期时间" allowClear style={{ width: '100%' }} />
              </Form.Item>
            </Space>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button onClick={() => setEditModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">保存</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        key={editingFolder ? `folder-${editingFolder.id}` : 'new-folder'}
        title={editingFolder ? '编辑文件夹' : '创建文件夹'}
        open={folderModalVisible}
        destroyOnClose
        onCancel={() => setFolderModalVisible(false)}
        footer={null}
      >
        <Form
          form={folderForm}
          layout="vertical"
          onFinish={handleFolderSubmit}
        >
          <Form.Item
            name="name"
            label="文件夹名称"
            rules={[{ required: true, message: '请输入文件夹名称' }]}
          >
            <Input placeholder="请输入文件夹名称" />
          </Form.Item>

          <Form.Item name="parent_id" label="父目录">
            <Select
              style={{ width: '100%' }}
              placeholder="选择父目录"
              allowClear
            >
              <Select.Option value={undefined}>根目录</Select.Option>
              {getParentFolders.map((f) => (
                <React.Fragment key={f.id}>
                  <Select.Option value={f.id}>{f.name}</Select.Option>
                  {getSubFolders[f.id]?.map((child) => (
                    <Select.Option key={child.id} value={child.id}>
                      └── {child.name}
                    </Select.Option>
                  ))}
                </React.Fragment>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button onClick={() => setFolderModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">保存</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 版本管理 Modal */}
      <Modal
        title={`版本管理 - ${currentVersionFile?.name || ''}`}
        open={versionVisible}
        destroyOnClose
        onCancel={() => setVersionVisible(false)}
        footer={null}
        width={720}
      >
        <div className="version-manager">
          <div className="upload-version-section">
            <h4>上传新版本</h4>
            <input
              type="file"
              accept=".html,.htm,.rp,.rplib,.pdf,.drawio,.drawio.xml,.dio,.zip"
              style={{ display: 'none' }}
              id="version-file-input"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) {
                  await handleUploadNewVersion({ file: f });
                  (e.target as HTMLInputElement).value = '';
                }
              }}
            />
            <Button
              icon={<CloudUploadOutlined />}
              type="primary"
              size="large"
              block
              onClick={() => document.getElementById('version-file-input')?.click()}
            >
              选择新版本的 HTML 文件
            </Button>
            <p style={{ color: '#666', fontSize: 12, marginTop: 12, lineHeight: 1.6 }}>
              💡 <b>选单个文件</b>，不是选文件夹。<br/>
              支持 .html / .htm / .zip。旧版本会自动保留为历史。
            </p>
              当前版本信息会作为历史版本保留，新文件会成为当前版本。
            </p>
          </div>

          <div className="version-list-section" style={{ marginTop: 24 }}>
            <h4>历史版本</h4>
            {versionsLoading ? (
              <p style={{ color: '#999' }}>加载中...</p>
            ) : versions.length === 0 ? (
              <p style={{ color: '#999' }}>暂无历史版本</p>
            ) : (
              <div className="version-list">
                {versions.map((version) => {
                  const isCurrent = version.storage_path === currentVersionFile?.storage_path;
                  return (
                    <div
                      key={version.id}
                      className={`version-item ${isCurrent ? 'is-current' : ''}`}
                      style={{
                        padding: 12,
                        border: '1px solid #eee',
                        borderRadius: 8,
                        marginBottom: 8,
                        background: isCurrent ? '#E6F7EF' : 'transparent',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong>版本 {version.version_number}</strong>
                          {isCurrent && <Tag color="green" style={{ marginLeft: 8 }}>当前版本</Tag>}
                          <br />
                          <small style={{ color: '#888' }}>
                            {formatDateTime(version.created_at)} · {formatFileSize(version.size)} · {version.type}
                          </small>
                          {version.note && (
                            <div style={{ marginTop: 4, fontSize: 12, color: '#555' }}>
                              备注：{version.note}
                            </div>
                          )}
                        </div>
                        <Space size={4}>
                          {!isCurrent && (
                            <Button
                              size="small"
                              type="primary"
                              ghost
                              onClick={() => handleSwitchVersion(version)}
                            >
                              切换到此版本
                            </Button>
                          )}
                          {!isCurrent && (
                            <Popconfirm
                              title="确定要删除此版本？"
                              onConfirm={() => handleDeleteVersion(version)}
                              okText="删除"
                              cancelText="取消"
                            >
                              <Button size="small" danger>删除</Button>
                            </Popconfirm>
                          )}
                        </Space>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}