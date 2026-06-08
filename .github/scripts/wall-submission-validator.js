const ALLOWED_CATEGORIES = new Set([
  'whisper',
  'story',
  'unsaid',
  'poetry',
  'daily',
  'gratitude',
  'archive',
]);

const DATE_SUFFIX_PATTERN = /^.+-(\d{8}|\d{4}-\d{2}-\d{2})\.md$/u;

function validateWallSubmission(files) {
  const errors = [];

  if (!Array.isArray(files) || files.length === 0) {
    return {
      valid: false,
      errors: ['PR 没有文件变更。'],
    };
  }

  for (const file of files) {
    const filename = file.filename || '';
    const status = file.status || '';
    const parts = filename.split('/');

    if (!filename.startsWith('wall/')) {
      errors.push(`${filename}: 不在 wall/ 目录下。`);
      continue;
    }

    if (filename.endsWith('/.gitkeep')) {
      continue;
    }

    if (parts.length !== 3) {
      errors.push(`${filename}: wall 投稿文件必须放在 wall/<分类>/ 文件下，不支持更深层目录。`);
      continue;
    }

    const category = parts[1];
    const basename = parts[2];

    if (!ALLOWED_CATEGORIES.has(category)) {
      errors.push(`${filename}: 不支持的 wall 分类 "${category}"。`);
      continue;
    }

    if (!basename.endsWith('.md')) {
      errors.push(`${filename}: 只支持 Markdown 文件。`);
      continue;
    }

    if (status !== 'added') {
      errors.push(`${filename}: 自动 wall 投稿只支持新增 Markdown 投稿。`);
      continue;
    }

    if (!DATE_SUFFIX_PATTERN.test(basename)) {
      errors.push(`${filename}: 文件名需要形如 "化名-20260603.md" 或 "化名-2026-06-03.md"。`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

module.exports = {
  ALLOWED_CATEGORIES,
  validateWallSubmission,
};
