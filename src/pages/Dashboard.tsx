import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { canAccessUsers, canAccessDashboard } from '@/utils/permissions';

const navItems = [
  { key: '/dashboard', label: '原型托管', desc: 'Prototypes', permission: 'can_access_dashboard' },
  { key: '/users', label: '成员', desc: 'Members', permission: 'can_access_users' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isSuperAdmin } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const visible = navItems.filter((i) => {
    if (isSuperAdmin()) return true;
    if (i.permission === 'can_access_dashboard') return canAccessDashboard();
    if (i.permission === 'can_access_users') return canAccessUsers();
    return true;
  });
  const currentKey = visible.find((i) => location.pathname.startsWith(i.key))?.key || '/dashboard';

  return (
    <div className="app-shell">
      <header className={`app-topbar ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="topbar-left">
          <button className="brand" onClick={() => navigate('/dashboard')} aria-label="ProtoHub home">
            <span className="brand-mark">
              <span className="brand-dot" />
              <span className="brand-dot" />
              <span className="brand-dot" />
            </span>
            <span className="brand-text">
              <strong>ProtoHub</strong>
              <small>原型托管 / 分享 / 追踪</small>
            </span>
          </button>
        </div>

        <nav className="topbar-nav" aria-label="主导航">
          {visible.map((item) => (
            <button
              key={item.key}
              className={`topbar-link ${currentKey === item.key ? 'is-active' : ''}`}
              onClick={() => navigate(item.key)}
            >
              <span className="label">{item.label}</span>
              <span className="hint">{item.desc}</span>
            </button>
          ))}
        </nav>

        <div className="topbar-right">
          <button className="user-pill" onClick={logout}>
            <span className="avatar">{user?.username?.[0]?.toUpperCase() ?? 'U'}</span>
            <span className="meta">
              <strong>{user?.username}</strong>
              <small>退出登录</small>
            </span>
          </button>
        </div>
      </header>

      <main className="app-canvas">
        <Outlet />
      </main>
    </div>
  );
}
