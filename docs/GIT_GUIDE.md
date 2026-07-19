# Git 日常使用手册

> 外行速通版。每次改完代码照着 3 步走就行。

## 🎯 Git 的作用（不只备份）

| 功能 | 怎么用 |
|---|---|
| **版本备份** | 每次改完代码提交一次，永久保存 |
| **版本回滚** | 代码改崩了，一键回到任意历史版本 |
| **多设备同步** | 在公司电脑改完，回家电脑 `git pull` 就有 |
| **变更记录** | 随时查"上周改了什么"、"谁动了这行代码" |
| **分支实验** | 试新功能不影响主代码，满意再合并 |

## 📋 日常 3 步流程

### 步骤 1：改代码

正常在 IDE 里改代码、测试、保存。

### 步骤 2：提交（commit）

在 TRAE 的 AI 对话里说：

```
我刚改完了，帮我提交到 GitHub
```

我会自动：
- `git add .` 添加所有修改
- `git commit -m "描述改了什么"` 生成规范的 commit 信息
- `git push` 推送到 GitHub

或者你想自己手动，在终端里跑：

```bash
cd /Users/dingxin/Desktop/AI工作空间/trae/20260604protope
git add .
git commit -m "描述改了什么，比如：修复登录页样式"
git push
```

⚠️ 第一次 push 时 macOS 会弹窗问 GitHub 用户名密码，**密码栏填你的 PAT（不是 GitHub 登录密码）**。勾选"始终允许"后会保存到 keychain，以后不再问。

### 步骤 3：查看结果

打开 https://github.com/dingsanjin/20260604protope 看 commit 历史和文件变更。

## 🔧 常用命令速查

| 我想… | 终端命令 | 在 AI 对话里怎么说 |
|---|---|---|
| 看改了什么 | `git status` | "我改了什么" |
| 看具体改动 | `git diff` | "给我看具体改了什么" |
| 提交并推送 | `git add . && git commit -m "xxx" && git push` | "提交并推送" |
| 看历史 | `git log --oneline` | "最近改了什么" |
| 撤销修改 | `git restore 文件名` | "撤销这个文件的修改" |
| 回滚到某版本 | `git checkout 提交id -- 文件` | "回到上一版" |
| 拉取最新代码 | `git pull` | "拉取最新代码" |
| 写 commit 不知道说啥 | — | "帮我写 commit message"（用 git-commit 技能） |

## 🆘 出问题了怎么办

| 问题 | 解决 |
|---|---|
| 推送失败：Authentication failed | PAT 过期或没填对，重新生成 |
| 推送失败：rejected (non-fast-forward) | 先 `git pull` 再 push |
| 不小心删了文件 | `git restore 文件名` 撤销 |
| 想回到昨天版本 | `git log` 找 commit id → "回到 commit xxx" 告诉我 |
| commit 写错了 | "帮我修改上一条 commit 信息" |
| 不小心 commit 了敏感信息 | 立刻去 GitHub 撤销 token，**改完密码再继续** |

## ⚠️ 不要做的事

- ❌ 不要把 .env 里的密码写进代码或 commit 信息
- ❌ 不要用 `git push --force`（会覆盖远程历史）
- ❌ 不要在没保存的情况下 `git restore`
- ❌ 不要 commit node_modules 或 dist（会变成巨型仓库）

## 📚 进阶（需要时再学）

- **分支**：试新功能时建分支，不影响主代码
- **PR**：让别人审查你的代码再合并
- **Tag**：给重要版本打标签（如 v1.0.0）
- **Stash**：临时保存修改但不提交

这些等你熟悉了基础再说。
