const assert = require('node:assert/strict');
const test = require('node:test');

const { validateWallSubmission } = require('../.github/scripts/wall-submission-validator');

test('accepts a new markdown post in an allowed wall category', () => {
  const result = validateWallSubmission([
    {
      filename: 'wall/whisper/一个路过的人-20260603.md',
      status: 'added',
    },
  ]);

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test('accepts dashed ISO dates in markdown filenames', () => {
  const result = validateWallSubmission([
    {
      filename: 'wall/story/五楼的灯-2026-06-03.md',
      status: 'added',
    },
  ]);

  assert.equal(result.valid, true);
});

test('rejects files outside wall', () => {
  const result = validateWallSubmission([
    {
      filename: 'README.md',
      status: 'modified',
    },
  ]);

  assert.equal(result.valid, false);
  assert.match(result.errors.join('\n'), /不在 wall\/ 目录下/);
});

test('rejects unknown wall categories', () => {
  const result = validateWallSubmission([
    {
      filename: 'wall/random/随便写写-20260603.md',
      status: 'added',
    },
  ]);

  assert.equal(result.valid, false);
  assert.match(result.errors.join('\n'), /不支持的 wall 分类/);
});

test('rejects non-markdown content files', () => {
  const result = validateWallSubmission([
    {
      filename: 'wall/daily/photo.png',
      status: 'added',
    },
  ]);

  assert.equal(result.valid, false);
  assert.match(result.errors.join('\n'), /只支持 Markdown 文件/);
});

test('rejects markdown files without date suffix', () => {
  const result = validateWallSubmission([
    {
      filename: 'wall/daily/今天的云很好看.md',
      status: 'added',
    },
  ]);

  assert.equal(result.valid, false);
  assert.match(result.errors.join('\n'), /文件名需要形如/);
});

test('rejects modified markdown files for auto wall submissions', () => {
  const result = validateWallSubmission([
    {
      filename: 'wall/daily/今天的云很好看-20260603.md',
      status: 'modified',
    },
  ]);

  assert.equal(result.valid, false);
  assert.match(result.errors.join('\n'), /只支持新增 Markdown 投稿/);
});
