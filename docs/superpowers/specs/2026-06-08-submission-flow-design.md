# 投稿体验闭环设计

## 目标

按当前仓库形态补齐投稿体验的三个缺口：

1. 给 `wall/` 投稿 PR 加明确校验，避免自动合并奇怪文件。
2. 建立 GitHub 标签配置，让 Issue 模板和 workflow 依赖的标签可同步。
3. 精选 Issue 上墙后，给投稿者一个明确结果：加 `已上墙` 标签，并在评论里附上 wall 文件链接。

## 设计

### 投稿校验

新增一个可测试的 JS 校验模块 `.github/scripts/wall-submission-validator.js`。它只处理 GitHub PR 文件列表数据，返回是否通过和错误原因。

规则：

- 所有文件必须位于 `wall/` 下。
- 只允许 `wall/<分类>/<文件名>.md` 和 `.gitkeep`。
- 分类必须是现有目录之一：`whisper`、`story`、`unsaid`、`poetry`、`daily`、`gratitude`、`archive`。
- Markdown 投稿只允许新增文件。
- Markdown 文件名需要形如 `名字-20260603.md` 或 `名字-2026-06-03.md`。

新增 `validate-wall-submission.yml` 作为 PR 检查；同时让 `auto-merge.yml` 复用同一校验模块，避免检查通过但自动合并逻辑不同步。

### 标签体系

新增 `.github/labels.json` 保存标签名称、颜色和说明。

新增 `sync-labels.yml`：

- 支持手动运行。
- 当 `.github/labels.json` 或同步 workflow 自身变更推送到 `main` 时自动运行。
- 只创建或更新配置中的标签，不删除仓库里其他标签。

### 精选上墙闭环

更新 `featured-to-wall.yml`：

- 输出生成的 wall 文件路径和 GitHub URL。
- 提交成功后给 Issue 添加 `已上墙` 标签。
- 评论里附上 wall 文件链接。
- 不自动关闭 Issue，保留后续留言空间。

## 验证

- 使用 Node 内置测试运行投稿校验和标签配置测试。
- 使用 PyYAML 解析所有 workflow。
- 检查 `featured-to-wall.yml` 的评论包含 wall 文件链接输出。
- 检查工作区干净后再推送。
