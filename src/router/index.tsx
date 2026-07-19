import { createBrowserRouter, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { lazy, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { setNavigate } from '@/utils/navigate';

const Login = lazy(() => import('@/pages/Login'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const FileManagement = lazy(() => import('@/pages/FileManagement'));
const UserManagement = lazy(() => import('@/pages/UserManagement'));
const FolderManagement = lazy(() => import('@/pages/FolderManagement'));
const Preview = lazy(() => import('@/pages/Preview'));

function SetupNavigate() {
  const navigate = useNavigate();
  useEffect(() => {
    setNavigate(navigate);
  }, [navigate]);
  return <Outlet />;
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return null;
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return null;
  }
  
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

function RequireSuperAdmin({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isSuperAdmin, loading } = useAuth();
  
  if (loading) {
    return null;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (!isSuperAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    element: <SetupNavigate />,
    children: [
      {
        path: '/login',
        element: (
          <PublicRoute>
            <Login />
          </PublicRoute>
        ),
      },
      {
        path: '/',
        element: (
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        ),
        children: [
          {
            path: '/',
            element: <Navigate to="/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: <FileManagement />,
          },
          {
            path: 'files',
            element: <FileManagement />,
          },
          {
            path: 'users',
            element: (
              <RequireSuperAdmin>
                <UserManagement />
              </RequireSuperAdmin>
            ),
          },
          {
            path: 'folders',
            element: <FolderManagement />,
          },
        ],
      },
      {
        path: '/p/:shortId',
        element: <Preview />,
      },
    ],
  },
]);
