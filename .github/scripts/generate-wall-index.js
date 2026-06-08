const fs = require('node:fs');
const path = require('node:path');

const CATEGORIES = [
  ['whisper', '心事', '深夜碎碎念，说不出口的小情绪。'],
  ['story', '故事', '故事、回忆和值得被记住的经历。'],
  ['unsaid', '没说出口的话', '后来才想明白、没来得及讲的话。'],
  ['poetry', '诗和散文', '诗、散文和文艺创作。'],
  ['daily', '日常', '天气、路上的猫、吃到好吃的东西。'],
  ['gratitude', '感谢', '被温柔对待过的瞬间。'],
  ['archive', '摘录', '转载的触动文字，请注明出处。'],
];

function encodeRelativeLink(parts) {
  return parts.map((part) => encodeURIComponent(part)).join('/');
}

function readTitle(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const firstLine = content.split(/\r?\n/, 1)[0].trim();
  return firstLine.replace(/^#\s*/, '').trim() || path.basename(filePath, '.md');
}

function listMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));
}

function generateWallIndex(rootDir = process.cwd()) {
  const lines = [
    '# 壁报墙',
    '',
    '这里放着已经留下来的文字。',
    '',
    '如果你只是路过，可以随便翻翻。',
    '',
    '如果你也想留一句，回到 [README](../README.md) 就好。',
    '',
    '---',
    '',
  ];

  for (const [slug, title, description] of CATEGORIES) {
    lines.push(`## ${title}`, '', description, '');

    const categoryDir = path.join(rootDir, 'wall', slug);
    const files = listMarkdownFiles(categoryDir);

    if (files.length === 0) {
      lines.push('这里还空着。', '');
      continue;
    }

    for (const file of files) {
      const postTitle = readTitle(path.join(categoryDir, file));
      const link = encodeRelativeLink([slug, file]);
      lines.push(`- [${postTitle}](${link})`);
    }

    lines.push('');
  }

  return `${lines.join('\n').trimEnd()}\n`;
}

function main() {
  const rootDir = process.cwd();
  const outputPath = path.join(rootDir, 'wall', 'README.md');
  fs.writeFileSync(outputPath, generateWallIndex(rootDir), 'utf8');
}

if (require.main === module) {
  main();
}

module.exports = {
  CATEGORIES,
  generateWallIndex,
};
