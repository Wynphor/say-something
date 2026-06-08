const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { generateWallIndex } = require('../.github/scripts/generate-wall-index');

test('generates a categorized wall index with titles and links', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wall-index-'));
  try {
    fs.mkdirSync(path.join(root, 'wall', 'whisper'), { recursive: true });
    fs.mkdirSync(path.join(root, 'wall', 'story'), { recursive: true });
    fs.writeFileSync(path.join(root, 'wall', 'whisper', '凌晨三点-20260603.md'), '# 凌晨三点\n\n正文', 'utf8');
    fs.writeFileSync(path.join(root, 'wall', 'story', '五楼的灯-20260603.md'), '# 五楼的灯\n\n正文', 'utf8');

    const markdown = generateWallIndex(root);

    assert.match(markdown, /# 壁报墙/);
    assert.match(markdown, /## 心事/);
    assert.match(markdown, /\[凌晨三点\]\(whisper\/%E5%87%8C%E6%99%A8%E4%B8%89%E7%82%B9-20260603\.md\)/);
    assert.match(markdown, /## 故事/);
    assert.match(markdown, /\[五楼的灯\]\(story\/%E4%BA%94%E6%A5%BC%E7%9A%84%E7%81%AF-20260603\.md\)/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('shows a quiet empty-state for categories without posts', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wall-index-empty-'));
  try {
    fs.mkdirSync(path.join(root, 'wall', 'daily'), { recursive: true });

    const markdown = generateWallIndex(root);

    assert.match(markdown, /## 日常/);
    assert.match(markdown, /这里还空着。/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
