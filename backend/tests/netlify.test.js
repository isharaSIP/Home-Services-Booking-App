const { test } = require('node:test');
const assert = require('node:assert/strict');
process.env.MONGO_URI = 'mongodb://fixture.invalid/test';
process.env.JWT_SECRET = 'isolated-test-only';
let connections = 0, indexes = 0, fail = true;
const db = require.resolve('../config/database');
require.cache[db] = { id: db, filename: db, loaded: true, exports: async () => {
  connections++;
  if (fail) throw new Error('fixture unavailable');
} };
require('../models/Booking').init = async () => { indexes++; };
require('../models/Complaint').init = async () => { indexes++; };
const { handler } = require('../netlify/functions/api');
const event = (path, body = '') => ({ path, httpMethod: 'GET', headers: {}, queryStringParameters: {}, body, isBase64Encoded: false });
test('startup retries, concurrent initialization, routes, auth, and upload guard', async () => {
  assert.equal(connections, 0, 'import must not connect or listen');
  const failed = await handler(event('/'), {});
  assert.equal(failed.statusCode, 503);
  assert.equal(failed.headers['Retry-After'], '10');
  fail = false;
  const responses = await Promise.all([handler(event('/'), {}), handler(event('/.netlify/functions/api'), {})]);
  for (const response of responses) {
    assert.equal(response.statusCode, 200);
    assert.match(JSON.parse(response.body).message, /FixMate/);
  }
  assert.equal(connections, 2);
  assert.equal(indexes, 2);
  for (const path of ['/api/auth/me', '/.netlify/functions/api/api/auth/me']) {
    assert.equal((await handler(event(path), {})).statusCode, 401);
  }
  assert.equal((await handler(event('/api/missing'), {})).statusCode, 404);
  const large = await handler(event('/api/auth/register', 'x'.repeat(4 * 1024 * 1024 + 1)), {});
  assert.equal(large.statusCode, 413);
  assert.match(JSON.parse(large.body).message, /smaller photos/);
});
