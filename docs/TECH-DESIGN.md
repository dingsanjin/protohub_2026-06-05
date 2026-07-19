# ProtoHub 技术方案文档

## 1. 技术选型

### 1.1 前端技术栈

| 技术 | 版本 | 说明 |
|---|---|---|
| React | 19 | 前端框架 |
| TypeScript | 6 | 类型安全 |
| Vite | 8 | 构建工具 |
| Ant Design | 6 | UI 组件库 |
| React Router | 7 | 路由管理 |
| Axios | 1.x | HTTP 客户端 |
| PDF.js | 4.x | PDF 渲染 |
| JWT Decode | 4.x | JWT token 解析 |

### 1.2 后端技术栈

| 技术 | 版本 | 说明 |
|---|---|---|
| Node.js | 20.x | 运行环境 |
| Express | 4.x | Web 框架 |
| TypeScript | 6 | 类型安全 |
| SQLite | 3.x | 数据库（轻量，零配置） |
| Knex.js | 3.x | SQL 查询构建器 |
| bcrypt | 5.x | 密码加密 |
| jsonwebtoken | 9.x | JWT 认证 |
| multer | 1.x | 文件上传中间件 |
| extract-zip | 2.x | ZIP 文件解压 |
| shortid | 2.x | 短链 ID 生成 |

### 1.3 部署技术

| 技术 | 说明 |
|---|---|
| Nginx | 反向代理、静态文件托管 |
| PM2 | Node.js 进程管理 |
| Ubuntu 22.04 | 服务器操作系统 |

---

## 2. 架构设计

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                      前端（React + TypeScript）                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  LoginPage    Workbench   FileDetail   ShareSettings     │  │
│  │  AdminUsers   PreviewPage PasswordPage                   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                            │                                   │
│                            ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                     API 层 (Axios)                        │  │
│  │  auth  |  users  |  files  |  folders  |  share  | preview│  │
│  └───────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────┘
                                │ HTTP/HTTPS
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Nginx 反向代理                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  静态文件托管 (前端 build)                                  │  │
│  │  路由转发: /api → Node.js 后端                              │  │
│  │  路由转发: /p/:shortId → Node.js 后端                      │  │
│  │  静态文件: /files → 文件存储目录                             │  │
│  └───────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      后端（Node.js + Express）                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Middleware: auth, error handling, cors                  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                            │                                   │
│  ┌─────────────────────────┼─────────────────────────────────┐  │
│  │                         ▼                                 │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │                    Router 层                        │  │  │
│  │  │  auth.router | users.router | files.router          │  │  │
│  │  │  folders.router | share.router | preview.router     │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                            │                               │  │
│  │  ┌─────────────────────────┼─────────────────────────────┐  │  │
│  │  │                         ▼                             │  │  │
│  │  │  ┌─────────────────────────────────────────────────┐  │  │  │
│  │  │  │                    Controller 层                 │  │  │  │
│  │  │  │  AuthController | UsersController | FileController│  │  │  │
│  │  │  │  FolderController | ShareController | PreviewController│  │  │  │
│  │  │  └─────────────────────────────────────────────────┘  │  │  │
│  │  │                            │                           │  │  │
│  │  │  ┌─────────────────────────┼─────────────────────────┐  │  │  │
│  │  │  │                         ▼                         │  │  │  │
│  │  │  │  ┌─────────────────────────────────────────────┐  │  │  │  │
│  │  │  │  │                    Service 层                │  │  │  │  │
│  │  │  │  │  AuthService | UsersService | FileService   │  │  │  │  │
│  │  │  │  │  FolderService | ShareService | PreviewService│  │  │  │  │
│  │  │  │  └─────────────────────────────────────────────┘  │  │  │  │
│  │  │  │                            │                       │  │  │  │
│  │  │  │  ┌─────────────────────────┼─────────────────────┐  │  │  │  │
│  │  │  │  │                         ▼                     │  │  │  │  │
│  │  │  │  │  ┌─────────────────────────────────────────┐  │  │  │  │  │
│  │  │  │  │  │                    Repository 层         │  │  │  │  │  │
│  │  │  │  │  │  UserRepository | FileRepository       │  │  │  │  │  │
│  │  │  │  │  │  FolderRepository | FileFolderRepository│  │  │  │  │  │
│  │  │  │  │  └─────────────────────────────────────────┘  │  │  │  │  │
│  │  │  │  └─────────────────────────────────────────────┘  │  │  │  │
│  │  │  └─────────────────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      数据存储                                   │
│  ┌─────────────────────────┬─────────────────────────────────┐  │
│  │                         │                                 │  │
│  │  SQLite Database        │  File Storage                   │  │
│  │  (/data/protohub/       │  (/data/protohub/files/)       │  │
│  │   database/protohub.db) │                                 │  │
│  └─────────────────────────┴─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 分层架构说明

| 层级 | 职责 |
|---|---|
| **Frontend** | 用户界面、交互逻辑、状态管理 |
| **API Layer** | 前端 API 调用封装 |
| **Router** | 路由分发、参数校验 |
| **Controller** | 请求处理、响应封装、参数验证 |
| **Service** | 业务逻辑处理 |
| **Repository** | 数据库访问、SQL 查询 |
| **Database** | 数据持久化 |
| **File Storage** | 文件存储与管理 |

---

## 3. 目录结构

### 3.1 项目根目录

```
protohub/
├── src/                    # 前端源码
│   ├── components/         # 通用组件
│   ├── pages/              # 页面组件
│   ├── hooks/              # 自定义 Hooks
│   ├── router/             # 路由配置
│   ├── api/                # API 接口封装
│   ├── utils/              # 工具函数
│   ├── types/              # TypeScript 类型定义
│   ├── assets/             # 静态资源
│   ├── App.tsx             # 应用入口
│   ├── main.tsx            # 启动入口
│   └── index.css           # 全局样式
├── server/                 # 后端源码
│   ├── src/
│   │   ├── controllers/    # 控制器
│   │   ├── services/       # 服务层
│   │   ├── repositories/   # 数据访问层
│   │   ├── routes/         # 路由定义
│   │   ├── middleware/     # 中间件
│   │   ├── models/         # 数据模型
│   │   ├── config/         # 配置文件
│   │   ├── utils/          # 工具函数
│   │   ├── database/       # 数据库初始化
│   │   └── server.ts       # 服务启动文件
│   └── package.json
├── docs/                   # 文档目录
│   ├── PRD.md              # 产品需求文档
│   ├── TECH-DESIGN.md      # 技术方案文档
│   └── TASKS.md            # 开发任务拆解
├── public/                 # 前端静态资源
├── data/                   # 运行时数据目录（部署后创建）
│   ├── protohub/
│   │   ├── files/          # 文件存储
│   │   └── database/       # 数据库文件
├── nginx/                  # Nginx 配置
├── package.json            # 前端依赖
├── tsconfig.json           # TypeScript 配置
├── vite.config.ts          # Vite 配置
└── .gitignore              # Git 忽略文件
```

### 3.2 前端目录详情

```
src/
├── components/
│   ├── Layout/             # 布局组件
│   ├── FileCard/           # 文件卡片组件
│   ├── FileList/           # 文件列表组件
│   ├── UploadZone/         # 上传区域组件
│   ├── ShareModal/         # 分享弹窗组件
│   ├── PreviewToolbar/     # 预览工具栏组件
│   └── ...
├── pages/
│   ├── Login/              # 登录页
│   ├── Workbench/          # 工作台
│   ├── FileDetail/         # 文件详情页
│   ├── ShareSettings/      # 分享设置页
│   ├── AdminUsers/         # 管理员管理页
│   ├── Preview/            # 预览页
│   └── Password/           # 密码验证页
├── hooks/
│   ├── useAuth.ts          # 认证 Hook
│   ├── useFiles.ts         # 文件管理 Hook
│   └── ...
├── router/
│   └── index.tsx           # 路由配置
├── api/
│   ├── auth.ts             # 认证接口
│   ├── users.ts            # 用户管理接口
│   ├── files.ts            # 文件管理接口
│   ├── folders.ts          # 文件夹接口
│   ├── share.ts            # 分享接口
│   └── preview.ts          # 预览接口
├── utils/
│   ├── format.ts           # 格式化工具
│   ├── constants.ts        # 常量定义
│   └── ...
└── types/
    ├── index.ts            # 类型定义
    ├── user.ts             # 用户类型
    ├── file.ts             # 文件类型
    └── ...
```

### 3.3 后端目录详情

```
server/src/
├── controllers/
│   ├── AuthController.ts   # 认证控制器
│   ├── UsersController.ts  # 用户管理控制器
│   ├── FilesController.ts  # 文件管理控制器
│   ├── FoldersController.ts# 文件夹控制器
│   ├── ShareController.ts  # 分享控制器
│   └── PreviewController.ts# 预览控制器
├── services/
│   ├── AuthService.ts      # 认证服务
│   ├── UsersService.ts     # 用户管理服务
│   ├── FilesService.ts     # 文件管理服务
│   ├── FoldersService.ts   # 文件夹服务
│   ├── ShareService.ts     # 分享服务
│   └── PreviewService.ts   # 预览服务
├── repositories/
│   ├── UserRepository.ts   # 用户数据访问
│   ├── FileRepository.ts   # 文件数据访问
│   ├── FolderRepository.ts # 文件夹数据访问
│   └── FileFolderRepository.ts # 文件-文件夹关联
├── routes/
│   ├── auth.router.ts      # 认证路由
│   ├── users.router.ts     # 用户管理路由
│   ├── files.router.ts     # 文件管理路由
│   ├── folders.router.ts   # 文件夹路由
│   ├── share.router.ts     # 分享路由
│   └── preview.router.ts   # 预览路由
├── middleware/
│   ├── auth.middleware.ts  # 认证中间件
│   ├── role.middleware.ts  # 角色权限中间件
│   ├── error.middleware.ts # 错误处理中间件
│   └── cors.middleware.ts  # CORS 中间件
├── models/
│   ├── User.ts             # 用户模型
│   ├── File.ts             # 文件模型
│   └── Folder.ts           # 文件夹模型
├── config/
│   ├── db.ts               # 数据库配置
│   ├── server.ts           # 服务器配置
│   └── security.ts         # 安全配置
├── utils/
│   ├── hash.ts             # 哈希工具
│   ├── token.ts            # JWT 工具
│   ├── file.ts             # 文件处理工具
│   ├── shortid.ts          # 短链 ID 生成
│   └── ...
├── database/
│   ├── migrations/         # 数据库迁移
│   └── seeds/              # 初始化数据
└── server.ts               # 服务器启动
```

---

## 4. 数据库设计

### 4.1 表结构

#### 4.1.1 users 表

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'admin',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
```

#### 4.1.2 files 表

```sql
CREATE TABLE files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  size INTEGER NOT NULL,
  storage_path VARCHAR(500) NOT NULL,
  short_id VARCHAR(50) NOT NULL UNIQUE,
  share_mode VARCHAR(20) NOT NULL DEFAULT 'private',
  share_password VARCHAR(255),
  expire_at DATETIME,
  visit_count INTEGER NOT NULL DEFAULT 0,
  last_visited_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_files_short_id ON files(short_id);
CREATE INDEX idx_files_type ON files(type);
CREATE INDEX idx_files_share_mode ON files(share_mode);
CREATE INDEX idx_files_expire_at ON files(expire_at);
```

#### 4.1.3 folders 表

```sql
CREATE TABLE folders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name VARCHAR(100) NOT NULL,
  parent_id INTEGER,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
);

CREATE INDEX idx_folders_user_id ON folders(user_id);
CREATE INDEX idx_folders_parent_id ON folders(parent_id);
```

#### 4.1.4 file_folder 表

```sql
CREATE TABLE file_folder (
  file_id INTEGER NOT NULL,
  folder_id INTEGER NOT NULL,
  PRIMARY KEY (file_id, folder_id),
  FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
  FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE
);

CREATE INDEX idx_file_folder_file_id ON file_folder(file_id);
CREATE INDEX idx_file_folder_folder_id ON file_folder(folder_id);
```

### 4.2 初始化数据

```sql
INSERT INTO users (username, password, role, status) VALUES 
('admin', '$2b$10$...', 'super_admin', 'active');
```

注：初始管理员密码由环境变量配置，部署时自动生成。

---

## 5. API 详细设计

### 5.1 认证接口

#### 5.1.1 登录

- **URL**: `POST /api/auth/login`
- **请求体**:
```json
{
  "username": "string (必填，3-50字符)",
  "password": "string (必填，6-128字符)"
}
```
- **成功响应** (200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "admin",
    "role": "super_admin",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```
- **失败响应** (401):
```json
{
  "success": false,
  "message": "用户名或密码错误"
}
```

#### 5.1.2 获取当前用户

- **URL**: `GET /api/auth/me`
- **Headers**: `Authorization: Bearer {token}`
- **成功响应** (200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "admin",
    "role": "super_admin",
    "status": "active"
  }
}
```

#### 5.1.3 登出

- **URL**: `POST /api/auth/logout`
- **Headers**: `Authorization: Bearer {token}`
- **成功响应** (200):
```json
{
  "success": true,
  "message": "登出成功"
}
```

### 5.2 用户管理接口

#### 5.2.1 获取管理员列表

- **URL**: `GET /api/users`
- **Headers**: `Authorization: Bearer {token}`
- **权限**: 仅超级管理员
- **成功响应** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "username": "admin",
      "role": "super_admin",
      "status": "active",
      "created_at": "2026-06-08T10:00:00Z"
    }
  ]
}
```

#### 5.2.2 创建管理员

- **URL**: `POST /api/users`
- **Headers**: `Authorization: Bearer {token}`
- **权限**: 仅超级管理员
- **请求体**:
```json
{
  "username": "string (必填，3-50字符)",
  "password": "string (必填，6-128字符)"
}
```
- **成功响应** (201):
```json
{
  "success": true,
  "data": {
    "id": 2,
    "username": "newadmin",
    "role": "admin",
    "status": "active"
  }
}
```

#### 5.2.3 更新管理员

- **URL**: `PUT /api/users/:id`
- **Headers**: `Authorization: Bearer {token}`
- **权限**: 仅超级管理员
- **请求体**:
```json
{
  "username": "string (可选)",
  "password": "string (可选)",
  "status": "string (可选，active/disabled)"
}
```
- **成功响应** (200):
```json
{
  "success": true,
  "data": {
    "id": 2,
    "username": "newadmin",
    "role": "admin",
    "status": "disabled"
  }
}
```

#### 5.2.4 删除管理员

- **URL**: `DELETE /api/users/:id`
- **Headers**: `Authorization: Bearer {token}`
- **权限**: 仅超级管理员
- **成功响应** (200):
```json
{
  "success": true,
  "message": "删除成功"
}
```

### 5.3 文件管理接口

#### 5.3.1 获取文件列表

- **URL**: `GET /api/files`
- **Headers**: `Authorization: Bearer {token}`
- **查询参数**:
  - `page`: 页码（默认1）
  - `pageSize`: 每页数量（默认20）
  - `search`: 搜索关键词
  - `type`: 文件类型筛选
  - `folderId`: 文件夹ID
- **成功响应** (200):
```json
{
  "success": true,
  "data": {
    "list": [
      {
        "id": 1,
        "name": "产品原型v1",
        "original_name": "product_prototype.zip",
        "type": "axure",
        "size": 52428800,
        "share_mode": "public",
        "visit_count": 15,
        "created_at": "2026-06-08T10:00:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 20
  }
}
```

#### 5.3.2 上传文件

- **URL**: `POST /api/files/upload`
- **Headers**: `Authorization: Bearer {token}`
- **Content-Type**: `multipart/form-data`
- **请求体**:
  - `file`: 文件（必填）
- **成功响应** (201):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "产品原型v1",
    "original_name": "product_prototype.zip",
    "type": "axure",
    "size": 52428800,
    "short_id": "abc123",
    "share_mode": "private"
  }
}
```

#### 5.3.3 获取文件详情

- **URL**: `GET /api/files/:id`
- **Headers**: `Authorization: Bearer {token}`
- **成功响应** (200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "产品原型v1",
    "original_name": "product_prototype.zip",
    "type": "axure",
    "size": 52428800,
    "storage_path": "/data/protohub/files/1/1/",
    "short_id": "abc123",
    "share_mode": "public",
    "expire_at": null,
    "visit_count": 15,
    "last_visited_at": "2026-06-08T15:00:00Z",
    "created_at": "2026-06-08T10:00:00Z",
    "updated_at": "2026-06-08T10:00:00Z"
  }
}
```

#### 5.3.4 更新文件

- **URL**: `PUT /api/files/:id`
- **Headers**: `Authorization: Bearer {token}`
- **Content-Type**: `multipart/form-data`
- **请求体**:
  - `file`: 新文件（可选，用于替换）
  - `name`: 新文件名（可选）
- **成功响应** (200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "产品原型v2",
    "original_name": "product_prototype_v2.zip",
    "type": "axure",
    "size": 62914560,
    "updated_at": "2026-06-08T16:00:00Z"
  }
}
```

#### 5.3.5 删除文件

- **URL**: `DELETE /api/files/:id`
- **Headers**: `Authorization: Bearer {token}`
- **成功响应** (200):
```json
{
  "success": true,
  "message": "删除成功"
}
```

#### 5.3.6 搜索文件

- **URL**: `GET /api/files/search`
- **Headers**: `Authorization: Bearer {token}`
- **查询参数**:
  - `keyword`: 搜索关键词（必填）
- **成功响应** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "产品原型v1",
      "type": "axure"
    }
  ]
}
```

### 5.4 文件夹管理接口

#### 5.4.1 获取文件夹列表

- **URL**: `GET /api/folders`
- **Headers**: `Authorization: Bearer {token}`
- **查询参数**:
  - `parentId`: 父文件夹ID（可选）
- **成功响应** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "项目A",
      "parent_id": null,
      "created_at": "2026-06-08T10:00:00Z"
    }
  ]
}
```

#### 5.4.2 创建文件夹

- **URL**: `POST /api/folders`
- **Headers**: `Authorization: Bearer {token}`
- **请求体**:
```json
{
  "name": "string (必填，1-100字符)",
  "parentId": "number (可选)"
}
```
- **成功响应** (201):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "项目A",
    "parent_id": null
  }
}
```

#### 5.4.3 更新文件夹

- **URL**: `PUT /api/folders/:id`
- **Headers**: `Authorization: Bearer {token}`
- **请求体**:
```json
{
  "name": "string (必填，1-100字符)"
}
```
- **成功响应** (200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "项目A-新版"
  }
}
```

#### 5.4.4 删除文件夹

- **URL**: `DELETE /api/folders/:id`
- **Headers**: `Authorization: Bearer {token}`
- **成功响应** (200):
```json
{
  "success": true,
  "message": "删除成功"
}
```

### 5.5 分享接口

#### 5.5.1 获取分享信息

- **URL**: `GET /api/files/:id/share`
- **Headers**: `Authorization: Bearer {token}`
- **成功响应** (200):
```json
{
  "success": true,
  "data": {
    "short_id": "abc123",
    "share_mode": "password",
    "expire_at": "2026-06-15T10:00:00Z",
    "url": "http://公网IP:8080/p/abc123"
  }
}
```

#### 5.5.2 更新分享设置

- **URL**: `PUT /api/files/:id/share`
- **Headers**: `Authorization: Bearer {token}`
- **请求体**:
```json
{
  "share_mode": "string (必填，public/password/private)",
  "password": "string (share_mode为password时必填，6-32字符)",
  "expire_at": "string (可选，ISO8601格式，如 '2026-06-15T10:00:00Z')"
}
```
- **成功响应** (200):
```json
{
  "success": true,
  "data": {
    "short_id": "abc123",
    "share_mode": "password",
    "expire_at": "2026-06-15T10:00:00Z",
    "url": "http://公网IP:8080/p/abc123"
  }
}
```

### 5.6 预览接口

#### 5.6.1 验证预览权限

- **URL**: `GET /api/preview/:shortId`
- **成功响应** (200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "产品原型v1",
    "type": "axure",
    "storage_path": "/data/protohub/files/1/1/",
    "needs_password": true,
    "is_expired": false
  }
}
```
- **失败响应** (404):
```json
{
  "success": false,
  "message": "链接不存在或已过期"
}
```

#### 5.6.2 验证密码

- **URL**: `POST /api/preview/:shortId/verify-password`
- **请求体**:
```json
{
  "password": "string (必填)"
}
```
- **成功响应** (200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "产品原型v1",
    "type": "axure",
    "storage_path": "/data/protohub/files/1/1/"
  }
}
```
- **失败响应** (401):
```json
{
  "success": false,
  "message": "密码错误"
}
```

---

## 6. 部署方案

### 6.1 服务器配置

| 项目 | 配置 |
|---|---|
| 服务器 | 腾讯云轻量应用服务器 |
| 规格 | 2核 CPU / 2GB 内存 / 50GB SSD |
| 地域 | 上海 |
| 操作系统 | Ubuntu 22.04 LTS |
| 端口 | 8080（ProtoHub 服务） |

### 6.2 部署步骤

#### 6.2.1 服务器环境准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 Nginx
sudo apt install -y nginx

# 安装 PM2
sudo npm install -g pm2

# 创建项目目录
sudo mkdir -p /data/protohub/files
sudo mkdir -p /data/protohub/database
sudo chown -R $(whoami) /data/protohub
```

#### 6.2.2 前端部署

```bash
# 克隆代码
git clone <仓库地址> /opt/protohub
cd /opt/protohub

# 安装前端依赖
npm install

# 构建前端
npm run build

# 复制到 Nginx 目录
sudo cp -r dist/* /var/www/html/
```

#### 6.2.3 后端部署

```bash
# 安装后端依赖
cd server
npm install

# 构建后端
npm run build

# 创建环境变量文件
cat > .env << EOF
PORT=3000
JWT_SECRET=<随机生成的密钥>
ADMIN_PASSWORD=<初始管理员密码>
DATA_DIR=/data/protohub
EOF

# 使用 PM2 启动
pm2 start dist/server.js --name protohub-server
pm2 save
pm2 startup
```

#### 6.2.4 Nginx 配置

```nginx
# /etc/nginx/sites-available/protohub
server {
    listen 8080;
    server_name _;

    # 前端静态文件
    location / {
        root /var/www/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # 文件预览路由
    location /p/ {
        proxy_pass http://127.0.0.1:3000/p/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # 静态文件托管（原型文件）
    location /files/ {
        root /data/protohub;
        expires 1d;
        add_header Cache-Control "public";
    }
}
```

```bash
# 启用配置
sudo ln -s /etc/nginx/sites-available/protohub /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6.3 防火墙配置

```bash
# 开放 8080 端口
sudo ufw allow 8080/tcp
sudo ufw enable
```

---

## 7. 安全性设计

### 7.1 认证安全

- **密码加密**: 使用 bcrypt 算法，cost 因子为 10
- **JWT Token**: 使用 HS256 算法，有效期 24 小时
- **Token 存储**: 前端存储在 localStorage，每次请求携带 Authorization Header
- **Token 刷新**: 可选，后续可实现自动刷新机制

### 7.2 文件安全

- **类型校验**: 仅允许上传指定类型的文件（.html, .htm, .zip, .pdf, .drawio）
- **文件名处理**: 上传时对文件名进行 sanitize，防止路径遍历攻击
- **ZIP 解压安全**: 解压前检查 ZIP 文件内容，防止路径遍历攻击
- **文件大小限制**: 单文件最大 500MB
- **存储隔离**: 每个用户的文件存储在独立目录

### 7.3 访问控制

- **JWT 验证**: 所有管理接口需要 JWT Token 验证
- **角色权限**: 超级管理员可管理所有用户，普通管理员只能管理自己的文件
- **分享权限**: 公开分享可直接访问，密码分享需要验证密码
- **有效期检查**: 访问分享链接时检查是否过期

### 7.4 其他安全措施

- **CORS 配置**: 限制允许的 Origin
- **请求限流**: 防止暴力破解登录密码
- **错误处理**: 不返回详细错误信息给前端
- **日志记录**: 记录登录失败、文件上传等关键操作

---

## 8. 性能优化

### 8.1 前端优化

- **代码分割**: 使用 React.lazy 和 Suspense 实现路由懒加载
- **缓存策略**: 静态资源添加缓存头，使用版本号进行缓存更新
- **图片优化**: 使用 WebP 格式，按需加载
- **打包优化**: 使用 Vite 的生产构建优化

### 8.2 后端优化

- **数据库索引**: 为常用查询字段创建索引
- **文件上传**: 大文件使用分片上传
- **静态文件托管**: 使用 Nginx 直接托管静态文件，减轻 Node.js 压力
- **响应压缩**: 使用 gzip/brotli 压缩响应

### 8.3 部署优化

- **PM2 进程管理**: 自动重启、负载均衡
- **Nginx 反向代理**: 缓存静态资源、负载均衡
- **CDN 加速**: 后续可配置 CDN 加速文件访问

---

## 9. 开发环境配置

### 9.1 前端开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 9.2 后端开发

```bash
# 安装依赖
cd server
npm install

# 创建环境变量
cat > .env << EOF
PORT=3000
JWT_SECRET=dev_secret_key
ADMIN_PASSWORD=admin123
DATA_DIR=../data
EOF

# 启动开发服务器
npm run dev
```

### 9.3 数据库初始化

```bash
# 在后端目录执行
npm run db:migrate
npm run db:seed
```

---

## 10. 环境变量配置

### 10.1 后端环境变量

| 变量名 | 说明 | 默认值 |
|---|---|---|
| `PORT` | 后端服务端口 | 3000 |
| `JWT_SECRET` | JWT 签名密钥 | 必须设置 |
| `ADMIN_PASSWORD` | 初始管理员密码 | 必须设置 |
| `DATA_DIR` | 数据存储目录 | /data/protohub |
| `MAX_FILE_SIZE` | 最大文件大小（字节） | 524288000 (500MB) |
| `NODE_ENV` | 运行环境 | development |

### 10.2 前端环境变量

| 变量名 | 说明 | 默认值 |
|---|---|---|
| `VITE_API_BASE_URL` | API 基础地址 | /api |
| `VITE_APP_URL` | 应用访问地址 | http://localhost:8080 |

---

## 11. 代码规范

### 11.1 前端规范

- **组件命名**: PascalCase（如 `FileCard.tsx`）
- **函数命名**: camelCase（如 `useAuth`）
- **常量命名**: SCREAMING_SNAKE_CASE（如 `MAX_FILE_SIZE`）
- **样式**: CSS Modules
- **TypeScript**: 严格模式，禁止 `any`

### 11.2 后端规范

- **文件命名**: kebab-case（如 `auth.controller.ts`）
- **类命名**: PascalCase（如 `AuthController`）
- **函数命名**: camelCase（如 `login`）
- **常量命名**: SCREAMING_SNAKE_CASE（如 `JWT_SECRET`）
- **TypeScript**: 严格模式，禁止 `any`

---

## 12. 日志与监控

### 12.1 日志记录

- **访问日志**: Nginx 记录所有访问日志
- **应用日志**: PM2 记录 Node.js 应用日志
- **关键操作日志**: 登录、文件上传、删除等操作记录

### 12.2 监控

- **服务器监控**: 腾讯云控制台监控 CPU、内存、磁盘、带宽
- **应用监控**: PM2 监控应用状态、重启次数
- **告警**: 配置磁盘空间、CPU 使用率告警

---

## 13. 备份策略

### 13.1 数据库备份

```bash
# 每日自动备份脚本
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/data/protohub/backup"
mkdir -p $BACKUP_DIR
sqlite3 /data/protohub/database/protohub.db ".backup $BACKUP_DIR/protohub_$DATE.db"

# 保留最近7天的备份
find $BACKUP_DIR -name "*.db" -mtime +7 -delete
```

### 13.2 文件备份

- 定期使用 rsync 同步到备份服务器
- 或配置腾讯云 COS 自动同步

---

## 14. 常见问题与解决方案

### 14.1 文件上传失败

- **原因**: 文件大小超过限制、网络中断、服务器磁盘满
- **解决方案**: 检查文件大小、检查网络、清理磁盘空间

### 14.2 预览页面无法加载

- **原因**: 文件路径错误、文件类型不支持、权限不足
- **解决方案**: 检查文件存储路径、确认文件类型、检查分享权限

### 14.3 登录失败

- **原因**: 用户名密码错误、Token 过期、用户被禁用
- **解决方案**: 检查账号密码、重新登录、联系超级管理员

### 14.4 服务器内存不足

- **原因**: 大文件上传/解压消耗大量内存、Node.js 内存泄漏
- **解决方案**: 增加内存、优化上传逻辑、检查内存泄漏

---

## 15. 后续扩展

### 15.1 功能扩展

- [ ] Word 文档预览（需要 LibreOffice 后端转换）
- [ ] Excel 文档预览
- [ ] 图片预览（支持多种格式）
- [ ] 视频预览
- [ ] 文件版本管理
- [ ] 团队协作功能
- [ ] 访问统计图表
- [ ] 移动端 APP

### 15.2 架构扩展

- [ ] 使用 Redis 缓存
- [ ] 使用 MySQL/PostgreSQL 替代 SQLite
- [ ] 使用腾讯云 COS 存储文件
- [ ] 使用 CDN 加速
- [ ] 容器化部署（Docker）
- [ ] 多服务器负载均衡

---

## 附录

### A. 文件类型识别逻辑

```typescript
export function detectFileType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop();
  switch (ext) {
    case 'html':
    case 'htm':
      return 'html';
    case 'zip':
      return 'axure';
    case 'pdf':
      return 'pdf';
    case 'drawio':
    case 'xml':
      return 'drawio';
    default:
      return 'other';
  }
}
```

### B. 短链 ID 生成逻辑

```typescript
import shortid from 'shortid';

export function generateShortId(): string {
  return shortid.generate();
}
```

### C. 密码加密逻辑

```typescript
import bcrypt from 'bcrypt';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

### D. JWT 生成与验证

```typescript
import jwt from 'jsonwebtoken';

export function generateToken(userId: number, username: string, role: string): string {
  return jwt.sign(
    { userId, username, role },
    process.env.JWT_SECRET!,
    { expiresIn: '24h' }
  );
}

export function verifyToken(token: string): any {
  return jwt.verify(token, process.env.JWT_SECRET!);
}
```
