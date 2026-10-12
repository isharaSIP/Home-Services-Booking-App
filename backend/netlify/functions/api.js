const serverless = require('serverless-http');
const { app, initialize } = require('../../server');
const handle = serverless(app);
const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' };

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  // Leave room for the function event envelope below Netlify's 6 MB limit.
  if (Buffer.byteLength(event.body || '', 'utf8') > 4 * 1024 * 1024) {
    return { statusCode: 413, headers, body: JSON.stringify({ message: 'Upload is too large. Choose smaller photos or fewer documents and try again (4 MB total request limit).' }) };
  }
  try {
    if (!process.env.MONGO_URI || !process.env.JWT_SECRET) throw new Error('Missing server configuration');
    await initialize();
  } catch {
    return { statusCode: 503, headers: { ...headers, 'Retry-After': '10' }, body: JSON.stringify({ message: 'Service temporarily unavailable. Please try again shortly.' }) };
  }
  // Support both the friendly rewrite and direct function URL.
  const path = event.path.replace(/^\/\.netlify\/functions\/api(?=\/|$)/, '') || '/';
  return handle({ ...event, path }, context);
};
