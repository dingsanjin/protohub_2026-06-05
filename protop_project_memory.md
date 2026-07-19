# ProtoHub 原型托管平台 — 项目记忆

> 项目目录：`~/Desktop/AI工作空间/trae/20260604protope`
> 项目代号：protope_2026-06-05 / protope-20260604
> 技术栈：React 19 + TypeScript + Vite 8 + Ant Design v6（前端）；Node.js + Express + TypeScript + SQLite（后端）

## Hard Constraints（项目级强约束）
- A2A tools must include source field (e.g., 本平台, 江苏省厅, 镇江市局)
- Agent功能 must be merged into A2A tools category
- Tool调用 blocks in chat must be collapsible by default
- Project memory files must be organized in dedicated folders per project
- Global configuration settings apply across all projects
- Memory files require name + date suffix for easy searching
- AGENTS.md is the sole project rules source; .trae/rules/project-rules.md is deprecated
- Development must follow four-stage process: requirements analysis & design planning, development implementation, testing verification (mandatory), acceptance delivery
- Testing verification stage requires generating test case table based on requirements and design, and passing unit, function, and regression tests before delivery
- 系统文案需符合产品经理使用场景，避免设计师相关表述，如将"原型的家"改为"圆形托管"等简洁实用名称
- 状态名称需统一：将"全部原型"更新为"全部"
- GitHub repository name must use English (no Chinese/ spaces), e.g., "xiaozhi-requirement-prototype"
- 仓库页面标题可显示中文，但URL中的仓库名必须为英文

## Engineering Conventions
- @mention dropdown tabs: 全部 / MCP工具 / Skill / A2A工具
- Chat workflow: single message bubble containing sequential tool calls, results, and final report
- Skill management page: display creator info in 部门-姓名 format
- Project structure: one project = one folder with multiple files for different information types
- AGENTS.md must follow six-section structure: tech stack, directory structure, coding standards, build commands, Never rules, context management
- Vite build output is standard static site (index.html + assets/); single-file HTML is for manual delivery only
- 智能体中心新建弹窗 uses 3-column layout: left (基础信息) / middle (可滚动配置) / right (调试预览)
- 技能调用展示: 顶层显示业务推理+结论, 详细动作默认折叠
- MCP工具管理 uses Tabs for categorization (内置文件系统工具 / 用户交互工具)
- 智能体关联工具分组: MCP / A2A / Skill (API merged into MCP)
- Test case table format: | 编号 | 功能模块 | 测试场景 | 预期结果 | 实际结果 | 状态 |

## 业务里程碑（提炼自 6/5-6/11 多次会话）
- ✅ **完成**：管理员登录、文件上传（HTML/Axure/PDF/Draw.io/文件夹/压缩包，最大500MB）、文件管理（列表/网格视图切换、搜索、筛选、排序、编辑、删除）、文件夹管理、分享功能（公开链接/密码保护/有效期）、预览（HTML/Axure RP/Draw.io/PDF/解压后文件夹）、管理员管理
- ✅ **部署**：deploy.sh 已写好，含 Nginx + PM2 + 前后端构建（依赖用户提供腾讯云服务器公网IP + SSH 密码）
- ⏳ **未完成**：阶段 4 文件夹管理（拖拽归类、访问统计、界面优化）、阶段 5 测试部署
- 🔮 **规划中（V1.1）**：文件版本管理
- 🐛 **已知修复**：getFileUrl 路径从 `/files/` 改 `/api/preview/files/`；`path.join` 改 `path.resolve`；文件默认 `share_mode` 改 `public`；过期文件返回信息+前端提示
- 🐛 **已知修复**：vite.config.ts proxy 需 bypass 函数避免干扰前端路由；页面标题 "全部原型" → "全部"

## Lessons Learned
- UI layout issues often stem from incorrect menu structure placement; prioritize reference interface menu hierarchy
- TRAE IDE Skill installation requires manual interface clicks as no CLI exists
- GitHub MCP configuration requires user-provided personal access token for security reasons
- Long conversation context may cause image attachment loss; use file system for critical screenshots
- Using koa-connect wrapper caused ctx leaks; native Koa rewrite is required instead of wrapping Express middleware
- macOS keychain may retain revoked GitHub PATs; 403 errors indicate need for new PAT
- React Router 直接打开本地 HTML 用 `createHashRouter`（URL 含 #）可避免 404
- Vite preview 模式默认 417 端口，前端跑 8083/8080；后端 3000
