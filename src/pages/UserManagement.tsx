import { useState, useEffect, useCallback } from 'react';
import { Button, Modal, Form, Input, Select, Space, message, Popconfirm, Table, Tag, Checkbox, Divider, Collapse } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, KeyOutlined, MenuOutlined, FolderOutlined } from '@ant-design/icons';
import { getUserList, createUser, updateUser, deleteUser } from '@/api/users';
import { ROLE_MAP, STATUS_MAP } from '@/utils/constants';
import { formatDateTime } from '@/utils/format';
import type { User, CreateUserRequest, UpdateUserRequest } from '@/types';

const MENU_PERMISSIONS: Array<{ key: string; label: string; desc: string }> = [
  { key: 'can_access_dashboard', label: '原型托管', desc: '可访问原型托管页面' },
  { key: 'can_access_users', label: '成员管理', desc: '可访问成员管理页面' },
];

const BUTTON_PERMISSIONS: Array<{ key: string; label: string; desc: string; page: string }> = [
  { key: 'can_upload', label: '上传原型', desc: '可上传新文件', page: '原型托管' },
  { key: 'can_delete', label: '删除文件', desc: '可删除自己上传的文件', page: '原型托管' },
  { key: 'can_share', label: '分享链接', desc: '可生成公开/密码分享', page: '原型托管' },
  { key: 'can_manage_folders', label: '管理文件夹', desc: '可新建/编辑/删除文件夹', page: '原型托管' },
];

type UserMenuPermissions = string[];
type UserButtonPermissions = string[];

const DEFAULT_MENU_PERMISSIONS: UserMenuPermissions = ['can_access_dashboard'];
const DEFAULT_BUTTON_PERMISSIONS: UserButtonPermissions = ['can_upload', 'can_delete', 'can_share', 'can_manage_folders'];

function loadMenuPermissions(userId: number): UserMenuPermissions {
  try {
    const raw = localStorage.getItem(`protohub_menu_permissions_${userId}`);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return DEFAULT_MENU_PERMISSIONS;
}

function saveMenuPermissions(userId: number, permissions: UserMenuPermissions) {
  localStorage.setItem(`protohub_menu_permissions_${userId}`, JSON.stringify(permissions));
}

function loadButtonPermissions(userId: number): UserButtonPermissions {
  try {
    const raw = localStorage.getItem(`protohub_button_permissions_${userId}`);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return DEFAULT_BUTTON_PERMISSIONS;
}

function saveButtonPermissions(userId: number, permissions: UserButtonPermissions) {
  localStorage.setItem(`protohub_button_permissions_${userId}`, JSON.stringify(permissions));
}

const groupedButtonPermissions = BUTTON_PERMISSIONS.reduce((acc, item) => {
  if (!acc[item.page]) {
    acc[item.page] = [];
  }
  acc[item.page].push(item);
  return acc;
}, {} as Record<string, typeof BUTTON_PERMISSIONS>);

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();
  const [menuPermissionsOf, setMenuPermissionsOf] = useState<Record<number, UserMenuPermissions>>({});
  const [buttonPermissionsOf, setButtonPermissionsOf] = useState<Record<number, UserButtonPermissions>>({});

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUserList();
      setUsers(data);
      const menuNext: Record<number, UserMenuPermissions> = {};
      const buttonNext: Record<number, UserButtonPermissions> = {};
      data.forEach((u) => {
        menuNext[u.id] = loadMenuPermissions(u.id);
        buttonNext[u.id] = loadButtonPermissions(u.id);
      });
      setMenuPermissionsOf(menuNext);
      setButtonPermissionsOf(buttonNext);
    } catch {
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      username: user.username,
      email: (user as User & { email?: string }).email || '',
      status: user.status,
      menuPermissions: menuPermissionsOf[user.id] || DEFAULT_MENU_PERMISSIONS,
      buttonPermissions: buttonPermissionsOf[user.id] || DEFAULT_BUTTON_PERMISSIONS,
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values: CreateUserRequest & { email?: string; status?: string; menuPermissions?: UserMenuPermissions; buttonPermissions?: UserButtonPermissions }) => {
    try {
      if (editingUser) {
        const updateData: UpdateUserRequest & { email?: string } = {
          username: values.username,
          status: values.status as 'active' | 'disabled',
          email: values.email || undefined,
        };
        if (values.password) {
          updateData.password = values.password;
        }
        await updateUser(editingUser.id, updateData);

        if (values.menuPermissions) {
          saveMenuPermissions(editingUser.id, values.menuPermissions);
        }
        if (values.buttonPermissions) {
          saveButtonPermissions(editingUser.id, values.buttonPermissions);
        }
        message.success('用户更新成功');
      } else {
          const user = await createUser({
            username: values.username,
            password: values.password,
            email: values.email,
          } as CreateUserRequest & { email?: string });

        if (values.menuPermissions) {
          saveMenuPermissions(user.id, values.menuPermissions);
        }
        if (values.buttonPermissions) {
          saveButtonPermissions(user.id, values.buttonPermissions);
        }
        message.success('用户创建成功');
      }
      setModalVisible(false);
      fetchUsers();
    } catch {
      message.error('操作失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteUser(id);
      message.success('用户删除成功');
      fetchUsers();
    } catch {
      message.error('删除失败');
    }
  };

  const columns = [
    {
      title: '成员',
      key: 'user',
      width: 280,
      render: (_: unknown, record: User) => (
        <div className="member-cell">
          <div className="member-avatar">{record.username[0]?.toUpperCase()}</div>
          <div className="member-id">
            <strong>{record.username}</strong>
            <small>
              {record.role === 'super_admin' ? '超级管理员' : ROLE_MAP[record.role] || record.role}
            </small>
          </div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'success' : 'default'} className="status-tag">
          {STATUS_MAP[status] || status}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: '最近更新',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 160,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_: unknown, record: User) => (
        <Space size={4}>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="确定要删除该用户吗？"
            okText="删除"
            cancelText="取消"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="users-modern">
      <div className="users-hero">
        <div>
          <span className="eyebrow">成员与权限</span>
          <h1>团队成员</h1>
          <p>管理成员账号与每个成员可以使用的功能。</p>
        </div>
        <button className="primary-cta" onClick={handleAdd}>
          <PlusOutlined /> 添加成员
        </button>
      </div>

      <div className="users-table-card">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={users}
          loading={loading}
          pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 位成员` }}
        />
      </div>

      <Modal
        key={editingUser ? `user-${editingUser.id}` : 'new-user'}
        title={editingUser ? '编辑成员' : '添加成员'}
        open={modalVisible}
        destroyOnClose
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={640}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item name="email" label="邮箱">
            <Input prefix={<KeyOutlined />} placeholder="选填，用于接收通知" />
          </Form.Item>

          {!editingUser ? (
            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password placeholder="请输入密码" />
            </Form.Item>
          ) : (
            <Form.Item name="password" label="新密码">
              <Input.Password placeholder="留空则不修改密码" />
            </Form.Item>
          )}

          {editingUser && (
            <Form.Item
              name="status"
              label="状态"
              rules={[{ required: true, message: '请选择状态' }]}
            >
              <Select
                options={[
                  { value: 'active', label: '启用' },
                  { value: 'disabled', label: '禁用' },
                ]}
              />
            </Form.Item>
          )}

          {editingUser && editingUser.role !== 'super_admin' && (
            <>
              <Divider />
              <div className="permissions-section">
                <div className="permissions-header">
                  <MenuOutlined />
                  <span>菜单权限</span>
                  <small>控制用户可以访问哪些页面</small>
                </div>
                <Form.Item name="menuPermissions" noStyle>
                  <Checkbox.Group
                    options={MENU_PERMISSIONS.map((item) => ({
                      label: (
                        <div className="permission-item">
                          <span className="permission-label">{item.label}</span>
                          <span className="permission-desc">{item.desc}</span>
                        </div>
                      ),
                      value: item.key,
                    }))}
                  />
                </Form.Item>
              </div>

              <Divider />
              <div className="permissions-section">
                <div className="permissions-header">
                  <KeyOutlined />
                  <span>按钮权限</span>
                  <small>控制用户可以使用哪些功能按钮</small>
                </div>
                <Collapse
                  defaultActiveKey={Object.keys(groupedButtonPermissions)}
                  items={Object.entries(groupedButtonPermissions).map(([page, permissions]) => ({
                    key: page,
                    label: (
                      <span>
                        <FolderOutlined style={{ marginRight: 8 }} />
                        {page}
                      </span>
                    ),
                    children: (
                      <Form.Item name="buttonPermissions" noStyle>
                        <Checkbox.Group
                          options={permissions.map((item) => ({
                            label: (
                              <div className="permission-item">
                                <span className="permission-label">{item.label}</span>
                                <span className="permission-desc">{item.desc}</span>
                              </div>
                            ),
                            value: item.key,
                          }))}
                        />
                      </Form.Item>
                    ),
                  }))}
                />
              </div>
            </>
          )}

          {editingUser && editingUser.role === 'super_admin' && (
            <div className="super-admin-tip">
              <Tag color="gold">超级管理员拥有所有权限，无需配置</Tag>
            </div>
          )}

          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">保存</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
