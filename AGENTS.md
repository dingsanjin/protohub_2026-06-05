---
alwaysApply: true
---

# Protope 项目智能体规则

> 全局规则（设计规范、修改范围、任务流程、消息队列、上下文管理、图片处理、用户偏好）见 user_profile.md。
> 全局技能使用规范（必用场景、调用顺序）见 skills-guide.md。

## 技术栈
- React 19 + TypeScript 6 + Vite 8
- React Router DOM v7 (createBrowserRouter)
- Ant Design v6 + dayjs
- 包管理器：npm

## 项目结构
```
src/
  components/     # 通用组件（PascalCase）
  pages/          # 页面组件
  hooks/          # 自定义 Hooks（useXxx）
  router/         # 路由配置
  layout/         # 布局组件
  utils/          # 工具函数
  assets/         # 静态资源
```

## 编码规范
- 函数组件 + Hooks，禁止 Class 组件
- TypeScript 严格模式，禁止 any
- 组件文件 PascalCase，函数 camelCase，常量 SCREAMING_SNAKE_CASE
- UI 优先 Ant Design，自定义样式用 CSS Modules
- 路由懒加载：`lazy(() => import('./pages/xxx'))`

## 构建命令
- `npm run dev` - 开发服务
- `npm run build` - 生产构建
- `npm run lint` - ESLint 检查

## Never 规则
- Never 修改 dist/ 目录
- Never 修改 node_modules/
- Never 使用内联样式 `style={{}}`，除非动态计算
- Never 在列表渲染中省略 key 属性
- Never 在组件内使用 any 类型
- Never 提交 .env 等敏感文件

## 模型选择策略（强约束）
- 用户自定义模型配置与策略记录在 [config.json](file:///Users/dingxin/Desktop/AI工作空间/trae/20260604protope/model-strategy/config.json)
- 默认优先级：MiniMax-M3 → ARC-Auto → Doubao-Seed-2.0-Code → GLM-5.1
- MiniMax-M3：第一优先级，适合写代码、设计原型、写 PPT、写文档
- ARC-Auto：第二优先级，适合简单任务和通用自动切换
- Doubao-Seed-2.0-Code：第三优先级，适合代码开发；当前两个优先模型额度用完后使用
- GLM-5.1：兜底备选模型，前三个不可用或额度不足时使用
- 简单任务优先使用 ARC-Auto，其次 MiniMax-M3
- 代码、设计、文档、PPT 等复杂产出优先使用 MiniMax-M3
- 如果实际客户端当前模型与策略不一致，先提醒用户切换到建议模型；不得假装已经自动切换
