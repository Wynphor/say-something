const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

const workflow = fs.readFileSync('.github/workflows/featured-to-wall.yml', 'utf8');

test('featured workflow exposes the created wall file link', () => {
  assert.match(workflow, /core\.setOutput\('wall-url'/);
  assert.match(workflow, /core\.setOutput\('filename'/);
});

test('featured workflow labels moved issues as 已上墙', () => {
  assert.match(workflow, /addLabels/);
  assert.match(workflow, /已上墙/);
});

test('featured workflow comments with the wall file link', () => {
  assert.match(workflow, /WALL_URL/);
  assert.match(workflow, /\[.+\]\(\$\{process\.env\.WALL_URL\}\)/);
});
