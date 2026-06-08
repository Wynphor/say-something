# Actions 加固 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 加固现有 GitHub Actions，让投稿自动化更安全、更稳定。

**Architecture:** 保持仓库现有的 GitHub Actions 架构，不新增运行时或外部依赖。每个 workflow 在自身文件内完成输入校验、文件生成和错误处理，避免把用户内容当作 shell 语法执行。

**Tech Stack:** GitHub Actions YAML、`actions/github-script@v7`、Ubuntu shell、Git。

---

## 文件结构

- Modify: `.github/workflows/auto-merge.yml`  
  负责判断 wall 投稿 PR 是否符合自动合并条件，并执行 squash merge。
- Modify: `.github/workflows/featured-to-wall.yml`  
  负责将打上 `精选` 标签的 Issue 搬运到 `wall/` 下的 Markdown 文件，并回到 Issue 留言。
- Modify: `.github/workflows/update-readme.yml`  
  负责根据最近新增的 `wall/*.md` 文件更新 `README.md` 的最近上墙区域。

---

### Task 1: 收紧自动合并条件

**Files:**
- Modify: `.github/workflows/auto-merge.yml`

- [ ] **Step 1: 读取当前 workflow**

Run:

```powershell
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new(); Get-Content -Encoding UTF8 -Path '.github\workflows\auto-merge.yml'
```

Expected: 输出当前 `pull_request_target` workflow，能看到标题条件 `contains(github.event.pull_request.title, 'wall/')`。

- [ ] **Step 2: 修改 auto-merge workflow**

将 `.github/workflows/auto-merge.yml` 改为：

```yaml
name: 壁报墙 - 自动合并

on:
  pull_request_target:
    types: [opened, synchronize]

permissions:
  contents: write
  pull-requests: write

jobs:
  auto-merge:
    runs-on: ubuntu-latest
    if: github.event.pull_request.base.ref == github.event.repository.default_branch
    steps:
      - name: 检查并合并 PR
        uses: actions/github-script@v7
        with:
          script: |
            const pr = context.payload.pull_request;

            const { data: files } = await github.rest.pulls.listFiles({
              owner: context.repo.owner,
              repo: context.repo.repo,
              pull_number: pr.number,
              per_page: 100,
            });

            if (files.length === 0) {
              core.info('PR 没有文件变更，跳过自动合并');
              return;
            }

            const unsupported = files.filter((file) => {
              const inWall = file.filename.startsWith('wall/');
              const supportedType =
                file.filename.endsWith('.md') || file.filename.endsWith('/.gitkeep');
              return !inWall || !supportedType;
            });

            if (unsupported.length > 0) {
              core.info('PR 包含 wall/ 目录外的文件或不支持的文件类型，跳过自动合并');
              for (const file of unsupported) {
                core.info(`不支持的文件: ${file.filename}`);
              }
              return;
            }

            try {
              await github.rest.pulls.merge({
                owner: context.repo.owner,
                repo: context.repo.repo,
                pull_number: pr.number,
                merge_method: 'squash',
              });
              core.info(`PR #${pr.number} 已自动合并`);

              await github.rest.issues.addLabels({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: pr.number,
                labels: ['壁报墙', '已上墙'],
              });
            } catch (error) {
              core.warning(`自动合并失败: ${error.message}`);
            }
```

- [ ] **Step 3: 静态检查改动点**

Run:

```powershell
Select-String -Path '.github\workflows\auto-merge.yml' -Pattern "contains\(github.event.pull_request.title|unsupported|endsWith\('/.gitkeep'\)"
```

Expected: 不再匹配标题条件；能匹配 `unsupported` 和 `.gitkeep` 文件类型判断。

- [ ] **Step 4: 提交 Task 1**

Run:

```powershell
git add -- '.github/workflows/auto-merge.yml'
git commit -m "🔒 Harden wall PR auto merge"
```

Expected: 生成一个只包含 `auto-merge.yml` 改动的提交。

---

### Task 2: 安全搬运精选 Issue

**Files:**
- Modify: `.github/workflows/featured-to-wall.yml`

- [ ] **Step 1: 读取当前 workflow**

Run:

```powershell
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new(); Get-Content -Encoding UTF8 -Path '.github\workflows\featured-to-wall.yml'
```

Expected: 输出当前 workflow，能看到 `echo '${{ steps.issue.outputs.content }}'` 写文件方式。

- [ ] **Step 2: 修改 featured-to-wall workflow**

将 `.github/workflows/featured-to-wall.yml` 改为：

```yaml
name: 精选上墙

on:
  issues:
    types: [labeled]

permissions:
  contents: write
  issues: write

jobs:
  move-to-wall:
    if: github.event.label.name == '精选'
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: 获取 Issue 内容并写入壁报墙
        id: issue
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const path = require('path');

            const { data: issue } = await github.rest.issues.get({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
            });

            const dirMap = {
              '心事': 'whisper',
              '故事': 'story',
              '遗憾': 'unsaid',
              '日常': 'daily',
              '感恩': 'gratitude',
              '摘录': 'archive',
            };

            const labels = issue.labels.map((label) => label.name);
            let dir = 'whisper';
            for (const [label, folder] of Object.entries(dirMap)) {
              if (labels.includes(label)) {
                dir = folder;
                break;
              }
            }

            let body = issue.body || '';
            body = body.replace(/<!--[\s\S]*?-->/g, '').trim();

            const date = new Date().toISOString().slice(0, 10);
            const safeTitle = issue.title
              .replace(/[\x00-\x1f\x7f]/g, '')
              .replace(/[\\/:*?"<>|]/g, '')
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-')
              .replace(/^-|-$/g, '')
              .slice(0, 30) || '匿名';

            const wallDir = path.join('wall', dir);
            fs.mkdirSync(wallDir, { recursive: true });

            let filename = `${safeTitle}-${date}.md`;
            let filePath = path.join(wallDir, filename);
            if (fs.existsSync(filePath)) {
              filename = `${safeTitle}-${date}-issue-${issue.number}.md`;
              filePath = path.join(wallDir, filename);
            }

            const content = `# ${issue.title}\n\n${body}\n\n---\n*来自 [Issue #${issue.number}](${issue.html_url})，${date}*\n`;
            fs.writeFileSync(filePath, content, 'utf8');

            core.setOutput('dir', dir);
            core.setOutput('filename', filename);
            core.setOutput('title', issue.title);

      - name: 提交并推送
        run: |
          git config user.name "say-something-bot"
          git config user.email "bot@say-something.dev"
          git add wall/
          git diff --cached --quiet && exit 0
          git commit -m "📖 壁报墙上新：${{ steps.issue.outputs.title }}"
          git push

      - name: 在 Issue 留言通知
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: `📖 这篇已经被搬到壁报墙了，永久珍藏。\n\n谢谢你的文字。`,
            });
```

- [ ] **Step 3: 检查 shell 注入点已移除**

Run:

```powershell
Select-String -Path '.github\workflows\featured-to-wall.yml' -Pattern "echo '\\$\\{\\{|steps.issue.outputs.content|fs.writeFileSync|issues: write"
```

Expected: 不匹配 `echo '${{` 和 `steps.issue.outputs.content`；能匹配 `fs.writeFileSync` 和 `issues: write`。

- [ ] **Step 4: 提交 Task 2**

Run:

```powershell
git add -- '.github/workflows/featured-to-wall.yml'
git commit -m "🔒 Harden featured issue publishing"
```

Expected: 生成一个只包含 `featured-to-wall.yml` 改动的提交。

---

### Task 3: 修正 README 最近列表生成

**Files:**
- Modify: `.github/workflows/update-readme.yml`

- [ ] **Step 1: 读取当前 workflow**

Run:

```powershell
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new(); Get-Content -Encoding UTF8 -Path '.github\workflows\update-readme.yml'
```

Expected: 输出当前 workflow，能看到 `echo "## 最新上墙" > recent.md`。

- [ ] **Step 2: 修改 update-readme workflow**

将 `.github/workflows/update-readme.yml` 改为：

```yaml
name: 更新最新上墙

on:
  push:
    branches: [main]
    paths: ['wall/**']

permissions:
  contents: write

jobs:
  update-readme:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: 生成最新上墙列表
        id: recent
        run: |
          : > recent.md

          git log --diff-filter=A --name-only --pretty=format: -- 'wall/*.md' \
            | grep '^wall/' \
            | head -5 \
            | while read file; do
                [ -z "$file" ] && continue
                [ ! -f "$file" ] && continue
                title=$(head -1 "$file" | sed 's/^# //')
                dir=$(echo "$file" | cut -d'/' -f2)
                case "$dir" in
                  whisper) emoji="💭" ;;
                  story) emoji="📖" ;;
                  unsaid) emoji="🤫" ;;
                  poetry) emoji="🌙" ;;
                  daily) emoji="🌤" ;;
                  gratitude) emoji="🙏" ;;
                  archive) emoji="📎" ;;
                  *) emoji="📝" ;;
                esac
                echo "- ${emoji} [${title}](./${file})" >> recent.md
              done

          if [ ! -s recent.md ]; then
            echo "*暂无，等待第一篇投稿*" > recent.md
          fi

      - name: 更新 README
        run: |
          if grep -q "<!-- recent -->" README.md; then
            sed -i '/<!-- recent -->/,/<!-- \/recent -->/{//!d;}' README.md
            sed -i '/<!-- recent -->/r recent.md' README.md
          else
            echo "" >> README.md
            echo "<!-- recent -->" >> README.md
            cat recent.md >> README.md
            echo "<!-- /recent -->" >> README.md
          fi

      - name: 提交更新
        run: |
          git config user.name "say-something-bot"
          git config user.email "bot@say-something.dev"
          git add README.md
          git diff --cached --quiet && exit 0
          git commit -m "📋 更新最新上墙"
          git push
```

- [ ] **Step 3: 检查重复标题生成已移除**

Run:

```powershell
Select-String -Path '.github\workflows\update-readme.yml' -Pattern '## 最新上墙|暂无，等待第一篇投稿|: > recent.md'
```

Expected: 不匹配 `## 最新上墙`；能匹配空列表提示文本和 `: > recent.md`。

- [ ] **Step 4: 提交 Task 3**

Run:

```powershell
git add -- '.github/workflows/update-readme.yml'
git commit -m "🔒 Harden recent wall list update"
```

Expected: 生成一个只包含 `update-readme.yml` 改动的提交。

---

### Task 4: 验证 workflow 语法和实施范围

**Files:**
- Read: `.github/workflows/*.yml`
- Read: `docs/superpowers/specs/2026-06-08-actions-hardening-design.md`

- [ ] **Step 1: 解析所有 workflow YAML**

Run:

```powershell
@'
import sys
from pathlib import Path
try:
    import yaml
except Exception as e:
    print('PyYAML not available:', e)
    sys.exit(1)

failed = False
for p in Path('.github/workflows').glob('*.yml'):
    try:
        yaml.safe_load(p.read_text(encoding='utf-8'))
        print(f'OK {p}')
    except Exception as e:
        failed = True
        print(f'ERR {p}: {e}')

sys.exit(1 if failed else 0)
'@ | python -
```

Expected: 所有 `.github/workflows/*.yml` 都输出 `OK`，命令退出码为 0。

- [ ] **Step 2: 检查 actionlint 是否可用**

Run:

```powershell
if (Get-Command actionlint -ErrorAction SilentlyContinue) { actionlint } else { 'actionlint not installed' }
```

Expected: 如果本机有 `actionlint`，命令退出码为 0；如果没有，输出 `actionlint not installed`，最终报告中说明未执行语义级 lint。

- [ ] **Step 3: 检查 Issue 正文不再通过 shell 插值写文件**

Run:

```powershell
Select-String -Path '.github\workflows\featured-to-wall.yml' -Pattern "echo '\\$\\{\\{|steps.issue.outputs.content"
```

Expected: 无输出。

- [ ] **Step 4: 检查实现范围**

Run:

```powershell
git diff --stat origin/main..HEAD
```

Expected: 只包含设计文档、计划文档和 3 个 workflow 文件。

- [ ] **Step 5: 查看最终状态**

Run:

```powershell
git status --short --branch
```

Expected: 工作区干净，`main` 相对 `origin/main` 领先多个本地提交。
