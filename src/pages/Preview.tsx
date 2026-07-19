import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Form, Input, Button, Card, Spin, Alert, Typography, message, Tree } from 'antd';
import { LockOutlined, FileOutlined, FolderOutlined, FolderOpenOutlined } from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import { getPreviewInfo, verifyPassword } from '@/api/preview';
import type { PreviewInfo, FileType } from '@/types';
import DrawioViewer from '@/components/DrawioViewer';

const { Title } = Typography;

interface PageTreeNode {
  name: string;
  path: string;
  type: 'page' | 'folder';
  children?: PageTreeNode[];
}

export default function Preview() {
  const { shortId } = useParams<{ shortId: string }>();
  const [previewInfo, setPreviewInfo] = useState<PreviewInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [drawioContent, setDrawioContent] = useState<string>('');
  const [pageTree, setPageTree] = useState<PageTreeNode[]>([]);
  const [activePage, setActivePage] = useState<string>('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const getFileUrl = (storagePath: string): string => `/api/preview/files/${storagePath}`;

  const fetchPreviewInfo = useCallback(async () => {
    if (!shortId) return;
    setLoading(true);
    try {
      const data = await getPreviewInfo(shortId);
      setPreviewInfo(data);

      if (data.needs_password) {
        setShowPasswordForm(true);
      } else if (data.is_expired) {
        message.error('链接已过期');
      } else {
        if (data.type === 'drawio') {
          const resp = await fetch(getFileUrl(data.storage_path));
          setDrawioContent(await resp.text());
        }
        if (data.type === 'html' || data.type === 'axure') {
          await fetchPageTree();
        }
      }
    } catch {
      message.error('获取预览信息失败');
    } finally {
      setLoading(false);
    }
  }, [shortId]);

  const fetchPageTree = async () => {
    try {
      const resp = await fetch(`/api/preview/${shortId}/tree`);
      const d = await resp.json();
      if (d.success && d.data?.length > 0) {
        setPageTree(d.data);
        const firstPage = findFirstPage(d.data);
        if (firstPage) setActivePage(firstPage.path);
      }
    } catch {
      // 单文件没 tree 也正常
    }
  };

  const findFirstPage = (nodes: PageTreeNode[]): PageTreeNode | null => {
    for (const n of nodes) {
      if (n.type === 'page') return n;
      if (n.children) {
        const found = findFirstPage(n.children);
        if (found) return found;
      }
    }
    return null;
  };

  useEffect(() => {
    fetchPreviewInfo();
  }, [fetchPreviewInfo]);

  const handlePasswordSubmit = async () => {
    if (!password) { message.error('请输入密码'); return; }
    setPasswordLoading(true);
    try {
      const response = await verifyPassword(shortId!, password);
      if (response.success) {
        setPreviewInfo(response.data);
        setShowPasswordForm(false);
        message.success('验证成功');
        if (response.data.type === 'html' || response.data.type === 'axure') {
          await fetchPageTree();
        }
      } else {
        message.error('密码错误');
      }
    } catch {
      message.error('验证失败');
    } finally {
      setPasswordLoading(false);
    }
  };

  const getEntryUrl = (): string => {
    if (!previewInfo) return '';
    return getFileUrl(previewInfo.entry_path || previewInfo.storage_path);
  };

  const getFileTypeLabel = (type: FileType): string => {
    const labels: Record<FileType, string> = {
      html: 'HTML 原型', axure: 'Axure 原型', pdf: 'PDF 文档',
      drawio: '流程图', zip: '压缩包', folder: '文件夹', other: '其他',
    };
    return labels[type] || '原型';
  };

  const toTreeData = (nodes: PageTreeNode[]): DataNode[] =>
    nodes.map((n) => ({
      key: n.path,
      title: n.name,
      icon: n.type === 'folder' ? <FolderOutlined /> : <FileOutlined />,
      isLeaf: n.type === 'page',
      children: n.children ? toTreeData(n.children) : undefined,
      selectable: n.type === 'page',
    }));

  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);

  useEffect(() => {
    // 只默认展开第一层（项目根 + 直接子文件夹）
    if (pageTree.length > 0 && expandedKeys.length === 0) {
      const first = pageTree[0];
      const keys: React.Key[] = [first.path];
      if (first.children) {
        first.children.forEach((c) => keys.push(c.path));
      }
      setExpandedKeys(keys);
    }
  }, [pageTree, expandedKeys.length]);

  const onTreeSelect = (keys: React.Key[]) => {
    if (keys.length > 0) setActivePage(String(keys[0]));
  };

  const renderContent = () => {
    if (!previewInfo) return null;
    if (previewInfo.is_expired) {
      return <Alert message="链接已过期" type="error" showIcon style={{ margin: 40 }} />;
    }

    const entryUrl = getEntryUrl();
    const fileUrl = getFileUrl(previewInfo.storage_path);

    switch (previewInfo.type) {
      case 'html':
      case 'axure': {
        if (pageTree.length > 0) {
          return (
            <div className="preview-layout">
              <div className={`preview-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
                <div className="preview-sidebar-header">
                  <span className="preview-project-name">{previewInfo.name}</span>
                  <button className="preview-sidebar-toggle" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
                    {sidebarCollapsed ? '☰' : '✕'}
                  </button>
                </div>
                <div className="preview-sidebar-body">
                  <Tree
                    showIcon
                    expandedKeys={expandedKeys}
                    onExpand={(keys) => setExpandedKeys(keys)}
                    treeData={toTreeData(pageTree)}
                    selectedKeys={activePage ? [activePage] : []}
                    onSelect={onTreeSelect}
                    switcherIcon={<FolderOpenOutlined />}
                  />
                </div>
              </div>
              <div className="preview-main">
                <iframe
                  src={activePage ? getFileUrl(activePage) : entryUrl}
                  className="preview-iframe"
                  title={previewInfo.name}
                  sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
                />
              </div>
            </div>
          );
        }
        return (
          <iframe src={entryUrl} className="preview-iframe-full" title={previewInfo.name}
            sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts" />
        );
      }
      case 'pdf':
        return <iframe src={fileUrl} className="preview-iframe-full" title={previewInfo.name} />;
      case 'drawio':
        return <DrawioViewer xml={drawioContent} />;
      default:
        return (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <p>暂不支持此文件类型的在线预览</p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (showPasswordForm) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
        <Card style={{ width: 400 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Title level={2} style={{ margin: 0 }}>ProtoHub</Title>
            <p style={{ color: '#999', marginTop: 8 }}>原型预览</p>
          </div>
          <Alert message="此原型需要密码才能访问" type="info" showIcon style={{ marginBottom: 16 }} />
          <Form layout="vertical" onFinish={handlePasswordSubmit}>
            <Form.Item>
              <Input.Password prefix={<LockOutlined />} placeholder="请输入访问密码"
                value={password} onChange={(e) => setPassword(e.target.value)} onPressEnter={handlePasswordSubmit} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={passwordLoading}>验证密码</Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    );
  }

  return (
    <div className="preview-page">
      <div className="preview-topbar">
        <span className="preview-topbar-title">{previewInfo?.name || 'ProtoHub'}</span>
        <span className="preview-topbar-type">{previewInfo ? getFileTypeLabel(previewInfo.type) : ''}</span>
      </div>
      {renderContent()}
    </div>
  );
}
