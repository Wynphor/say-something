# Actions 加固设计

## 背景

这个仓库是一个基于 GitHub 的文字社区。主要用户流程是：

- 用户通过 Issue 写下短内容。
- 维护者给精选 Issue 添加 `精选` 标签，将其搬运到 `wall/`。
- 投稿者通过 PR 向 `wall/` 下添加内容。
- GitHub Actions 负责自动回应 Issue、自动合并壁报墙投稿 PR、搬运精选 Issue，并更新 `README.md` 的最新上墙列表。

项目目前没有应用运行时。GitHub Actions 是这个仓库最核心的执行入口。

## 目标

- 让 Issue 上墙流程能安全处理多行内容、引号、反引号和其他 shell 敏感字符。
- 确保 workflow 拥有当前行为所需权限，同时避免不必要的权限。
- 减少误自动合并：自动合并判断应基于实际变更文件，而不是 PR 标题。
- 让 `README.md` 的最新上墙区域更新更稳定，避免出现重复标题。
- 本次改动只聚焦 workflow 加固，不引入新的产品功能。

## 非目标

- 不重写 README 或投稿说明文案。
- 不新增投稿分类。
- 不增加网页 UI 或应用运行时。
- 不新增超出现有 `精选` 标签流程之外的审核自动化。
- 除非 workflow 校验需要，否则不修改已有 `wall/` 内容。

## Workflow 变更

### `featured-to-wall.yml`

精选上墙 workflow 继续保持当前触发方式：当 Issue 收到 `精选` 标签后，根据分类标签在对应 `wall/` 目录下创建 Markdown 文件，并回到 Issue 留言。

需要修改：

- 在权限中增加 `issues: write`，因为 workflow 会给 Issue 留言。
- 停止通过 `echo '${{ ... }}'` 这种 shell 插值方式写入 Issue 正文。
- 改为在 JavaScript 中生成并写入目标文件，让 Issue 正文始终被当作数据处理，而不是 shell 语法。
- 生成文件名时清理或归一化控制字符、斜杠、重复空白和其他不适合路径的字符。
- 如果目标文件名已存在，使用带 Issue 编号的确定性后缀，避免覆盖已有内容。
- 保留现有分类映射：
  - `心事` -> `whisper`
  - `故事` -> `story`
  - `遗憾` -> `unsaid`
  - `日常` -> `daily`
  - `感恩` -> `gratitude`
  - `摘录` -> `archive`

### `update-readme.yml`

README 更新 workflow 继续保持当前触发方式：`main` 分支上 `wall/**` 发生变更时运行。

需要修改：

- 只生成插入到 `<!-- recent -->` 和 `<!-- /recent -->` 之间的列表内容。
- 不再在标记区域内部额外生成 `## 最新上墙` 标题，避免 README 出现重复标题。
- 如果没有找到上墙内容，写入现有占位文案。
- 最近上墙列表仍然只展示 `wall/` 下最近新增的 5 个 Markdown 文件。
- 保持现有分类 emoji 映射不变。

### `auto-merge.yml`

自动合并 workflow 仍然在 PR 打开和同步更新时运行。

需要修改：

- 移除“PR 标题必须包含 `wall/`”的判断。
- 是否允许自动合并只根据实际变更文件决定。
- 只有当所有变更文件都位于 `wall/` 下时，才允许自动合并。
- `wall/` 下只允许自动合并 Markdown 内容文件和 `.gitkeep` 文件。
- 保留现有 squash merge 行为，以及合并成功后添加标签的行为。

## 错误处理

- 如果 PR 包含非 `wall/` 文件或不支持的文件类型，自动合并 workflow 记录原因并退出，不执行合并。
- 如果精选 Issue 没有匹配到已知分类标签，继续默认写入 `wall/whisper/`。
- 如果生成的精选上墙文件名和已有文件冲突，workflow 使用包含 Issue 编号的确定性文件名。
- 如果 README 中没有最新上墙标记区域，保留现有兜底行为：在文件末尾追加标记区域。

## 验证

本次改动完成后需要做以下本地验证：

- 使用 Python/PyYAML 解析所有 workflow YAML 文件。
- 检查修改后的 workflow 脚本，确认 Issue 正文不再通过 shell 插值写入文件。
- 查看 `git diff`，确认实现改动范围只包含预期的 workflow 文件。

如果本地可用 `actionlint`，则运行 `actionlint`。如果本地未安装，需要在最终实现报告中说明这个限制。
