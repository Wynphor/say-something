const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

const labels = JSON.parse(fs.readFileSync('.github/labels.json', 'utf8'));

test('defines every workflow and issue-template label', () => {
  const required = [
    '心事',
    '故事',
    '遗憾',
    '日常',
    '感恩',
    '摘录',
    '精选',
    '已上墙',
    '壁报墙',
  ];
  const names = new Set(labels.map((label) => label.name));

  for (const name of required) {
    assert.equal(names.has(name), true, `missing label: ${name}`);
  }
});

test('does not define duplicate label names', () => {
  const names = labels.map((label) => label.name);
  assert.equal(new Set(names).size, names.length);
});

test('uses six-character GitHub label colors', () => {
  for (const label of labels) {
    assert.match(label.color, /^[0-9a-fA-F]{6}$/, `${label.name} has invalid color`);
  }
});
