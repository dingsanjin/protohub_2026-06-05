import { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, Input, Space, message, Popconfirm, Tree } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, FolderOutlined } from '@ant-design/icons';
import { getFolderList, createFolder, updateFolder, deleteFolder } from '@/api/folders';
import { formatDateTime } from '@/utils/format';
import type { Folder, CreateFolderRequest, UpdateFolderRequest } from '@/types';

export default function FolderManagement() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [form] = Form.useForm();

  const fetchFolders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getFolderList();
      setFolders(data);
    } catch {
      message.error('获取文件夹列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  const handleAdd = () => {
    setEditingFolder(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (folder: Folder) => {
    setEditingFolder(folder);
    form.setFieldsValue({
      name: folder.name,
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values: CreateFolderRequest) => {
    try {
      if (editingFolder) {
        const updateData: UpdateFolderRequest = {
          name: values.name,
        };
        await updateFolder(editingFolder.id, updateData);
        message.success('文件夹更新成功');
      } else {
        await createFolder(values);
        message.success('文件夹创建成功');
      }
      setModalVisible(false);
      fetchFolders();
    } catch {
      message.error('操作失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteFolder(id);
      message.success('文件夹删除成功');
      fetchFolders();
    } catch {
      message.error('删除失败');
    }
  };

  const buildTreeData = (folderList: Folder[]): { key: string; title: string; children?: { key: string; title: string }[] }[] => {
    const map = new Map<number, { key: string; title: string; children: { key: string; title: string }[] }>();
    const root: { key: string; title: string; children: { key: string; title: string }[] }[] = [];

    folderList.forEach((folder) => {
      map.set(folder.id, {
        key: String(folder.id),
        title: folder.name,
        children: [],
      });
    });

    folderList.forEach((folder) => {
      const item = map.get(folder.id)!;
      if (folder.parent_id && map.has(folder.parent_id)) {
        map.get(folder.parent_id)!.children.push(item);
      } else {
        root.push(item);
      }
    });

    return root;
  };

  const columns = [
    {
      title: '文件夹名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FolderOutlined />
          {name}
        </span>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 180,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: unknown, record: Folder) => (
        <Space size="middle">
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定要删除该文件夹吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          创建文件夹
        </Button>
      </div>

      <div style={{ marginBottom: '24px', background: '#fff', padding: '16px', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: '12px' }}>文件夹结构</h3>
        <Tree
          treeData={buildTreeData(folders)}
          defaultExpandAll
          icon={<FolderOutlined />}
        />
      </div>

      <Table
        columns={columns}
        dataSource={folders}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title={editingFolder ? '编辑文件夹' : '创建文件夹'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="文件夹名称"
            rules={[{ required: true, message: '请输入文件夹名称' }]}
          >
            <Input placeholder="请输入文件夹名称" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">保存</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
