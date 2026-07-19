import { useState } from 'react';
import { Form, Input, Button, Alert, Spin } from 'antd';
import { UserOutlined, LockOutlined, ArrowRightOutlined, FolderOutlined, ShareAltOutlined, EyeOutlined, TeamOutlined } from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();

  const handleSubmit = async (values: { username: string; password: string }) => {
    setLoading(true);
    setError(null);
    try {
      const success = await login(values);
      if (success) {
        setTimeout(() => { window.location.href = '/dashboard'; }, 100);
      } else {
        setError('用户名或密码错误');
      }
    } catch {
      setError('登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: <FolderOutlined />, label: '文件夹归类管理原型' },
    { icon: <ShareAltOutlined />, label: '链接分享可设密码与过期' },
    { icon: <EyeOutlined />, label: '追踪每一次访问记录' },
    { icon: <TeamOutlined />, label: '团队协作与权限分配' },
  ];

  return (
    <div className="login-canvas">
      <div className="login-hero">
        <div className="login-hero-inner">
          <div className="login-brand-row">
            <span className="login-brand-mark">
              <span className="login-brand-dot" />
              <span className="login-brand-dot" />
              <span className="login-brand-dot" />
            </span>
            <span className="login-brand-name">ProtoHub</span>
          </div>

          <h1 className="login-hero-title">
            原型托管<br />
            <span className="login-hero-highlight">本该如此简单</span>
          </h1>

          <p className="login-hero-desc">
            上传、管理、分享你的产品原型。支持 Axure RP、HTML、Draw.io、PDF 等多种格式，一站式原型资产管理平台。
          </p>

          <div className="login-hero-illustration">
            <div className="login-illus-shape shape-1" />
            <div className="login-illus-shape shape-2" />
            <div className="login-illus-shape shape-3" />
            <div className="login-illus-shape shape-4" />
            <div className="login-illus-browser">
              <div className="illus-browser-bar">
                <span /><span /><span />
              </div>
              <div className="illus-browser-body">
                <div className="illus-sidebar">
                  <div className="illus-folder" />
                  <div className="illus-folder" />
                  <div className="illus-folder short" />
                </div>
                <div className="illus-content">
                  <div className="illus-card" />
                  <div className="illus-card" />
                  <div className="illus-card small" />
                </div>
              </div>
            </div>
          </div>

          <ul className="login-hero-features">
            {features.map((f, i) => (
              <li key={i} className="login-hero-feature-item">
                <span className="login-hero-feature-icon">{f.icon}</span>
                <span>{f.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="login-form-side">
        <div className="login-form-card">
          <div className="login-form-header">
            <span className="login-form-eyebrow">欢迎回来</span>
            <h2 className="login-form-title">登录到工作台</h2>
            <p className="login-form-sub">请输入您的账号信息</p>
          </div>

          {error && (
            <Alert message={error} type="error" showIcon className="login-alert" />
          )}

          <Form
            name="login"
            layout="vertical"
            onFinish={handleSubmit}
            autoComplete="off"
            initialValues={{ username: 'admin' }}
            className="login-form"
          >
            <Form.Item
              name="username"
              label="用户名"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input
                size="large"
                prefix={<UserOutlined />}
                placeholder="请输入用户名"
                className="login-input"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                size="large"
                prefix={<LockOutlined />}
                placeholder="请输入密码"
                className="login-input"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={loading}
                className="login-submit"
              >
                {loading ? <Spin size="small" /> : <>登录 <ArrowRightOutlined /></>}
              </Button>
            </Form.Item>
          </Form>

          <p className="login-hint">
            演示账号 <code>admin</code> / <code>admin123</code>
          </p>
        </div>

        <p className="login-footer">ProtoHub · Prototype Library · Est. 2026</p>
      </div>
    </div>
  );
}
