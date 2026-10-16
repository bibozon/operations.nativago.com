const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');

test('deployment root redirects to the CMS without changing its base path', () => {
  const root = path.resolve(__dirname, '../..');
  const config = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
  const nextConfig = require(path.join(root, 'next.config.js'));
  assert.deepEqual(config.redirects, [
    { source: '/', destination: '/cms', permanent: false },
  ]);
  assert.equal(nextConfig.basePath, '/cms');
  assert.equal(nextConfig.env.NEXT_PUBLIC_BASE_PATH, '/cms');
});
