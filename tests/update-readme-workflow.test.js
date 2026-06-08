const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

const workflow = fs.readFileSync('.github/workflows/update-readme.yml', 'utf8');

test('recent wall list excludes the wall index page', () => {
  assert.match(workflow, /grep -v '\^wall\/README\\.md\$'/);
});

test('recent wall list only keeps markdown files inside category folders', () => {
  assert.match(workflow, /grep '\^wall\/\[\^\/\]\*\/\.\*\\\.md\$'/);
});
