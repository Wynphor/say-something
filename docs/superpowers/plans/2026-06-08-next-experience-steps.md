# Next Experience Steps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 依次降低普通投稿门槛、补充投稿状态说明、生成 `wall/README.md` 内容索引，并推送后检查 GitHub Actions。

**Architecture:** README 和 CONTRIBUTING 负责降低参与门槛与解释状态；`.github/scripts/generate-wall-index.js` 负责生成 `wall/README.md`，由本地测试和 workflow 复用；新增 workflow 在 `wall/**` 变更时更新索引页。

**Tech Stack:** Markdown、Node.js built-in test runner、GitHub Actions、GitHub CLI。

---

## Tasks

- [ ] 调整 README 和 CONTRIBUTING：优先推荐 Issue 投稿，PR 作为进阶方式。
- [ ] 在 CONTRIBUTING 中新增投稿状态说明：提交后、精选后、上墙后分别会发生什么。
- [ ] 用 TDD 新增 wall 索引生成脚本和测试，生成 `wall/README.md`。
- [ ] 新增 `update-wall-index.yml`，在 `wall/**` 变更时刷新索引。
- [ ] 运行 Node 测试和 workflow YAML 解析。
- [ ] 提交、推送，并用 GitHub CLI 查看 Actions 运行结果。
