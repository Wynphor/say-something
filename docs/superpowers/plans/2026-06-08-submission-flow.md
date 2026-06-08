# 投稿体验闭环 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 补齐 wall 投稿校验、标签同步和精选上墙结果反馈。

**Architecture:** 把投稿校验放到 `.github/scripts/wall-submission-validator.js`，由测试、PR 检查和自动合并共同使用。标签定义放到 `.github/labels.json`，由同步 workflow 创建或更新。精选上墙 workflow 继续负责写 wall 文件，但额外输出链接、加标签和评论。

**Tech Stack:** GitHub Actions、actions/github-script、Node.js built-in test runner、Python/PyYAML。

---

## Tasks

- [ ] 新增 wall 投稿校验模块和测试。
- [ ] 接入 `validate-wall-submission.yml` 和 `auto-merge.yml`。
- [ ] 新增标签配置、标签配置测试和 `sync-labels.yml`。
- [ ] 更新 `featured-to-wall.yml` 的成功反馈。
- [ ] 运行 Node 测试、YAML 解析、静态检查和 Git 状态检查。
