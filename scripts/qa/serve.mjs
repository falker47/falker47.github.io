import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const siteRoot = fileURLToPath(new URL('../../_site/', import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };

export function localPath(root, pathname) {
  const decoded = decodeURIComponent(pathname);
  if (!decoded.startsWith('/') || /[\\:\0]/.test(decoded) || decoded.split('/').includes('..')) throw Error('Invalid site path');
  const file = resolve(root, '.' + decoded);
  if (file !== resolve(root) && !file.startsWith(resolve(root) + sep)) throw Error('Invalid site path');
  return file;
}

export async function fileStat(file) {
  try { return await stat(file); }
  catch (error) { if (['ENOENT', 'ENOTDIR'].includes(error.code)) return null; throw error; }
}

export async function startServer({ root = siteRoot, port = 0, holdDocument } = {}) {
  const server = createServer(async (request, response) => {
    try {
      if (!['GET', 'HEAD'].includes(request.method)) {
        response.writeHead(405, { Allow: 'GET, HEAD' }).end();
        return;
      }
      let url, file;
      try {
        if (!request.url.startsWith('/') || request.url.startsWith('//')) throw Error('Invalid request target');
        url = new URL(request.url, 'http://localhost');
        // A 204 lets the browser keep the real stub document after it attempts
        // location.replace or meta refresh. Its HTML and scripts stay untouched.
        if (holdDocument && url.pathname !== holdDocument && request.headers['sec-fetch-dest'] === 'document') {
          response.writeHead(204).end();
          return;
        }
        file = localPath(root, url.pathname);
      } catch { response.writeHead(400).end(); return; }
      let info = await fileStat(file);
      if (info?.isDirectory()) {
        if (!url.pathname.endsWith('/')) {
          response.writeHead(301, { Location: url.pathname + '/' + url.search }).end();
          return;
        }
        file = join(file, 'index.html');
        info = await fileStat(file);
      } else if (url.pathname.endsWith('/')) info = null;
      let status = 200;
      if (!info?.isFile()) {
        status = 404;
        file = join(root, '404.html');
        info = await fileStat(file);
        if (!info?.isFile()) { response.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found'); return; }
      }
      response.writeHead(status, { 'Content-Type': types[extname(file)] || 'application/octet-stream',
        'Content-Length': info.size, 'X-Content-Type-Options': 'nosniff' });
      if (request.method === 'HEAD') response.end();
      else createReadStream(file).on('error', error => response.destroy(error)).pipe(response);
    } catch { if (!response.headersSent) response.writeHead(500); response.end(); }
  });
  server.listen(port, '127.0.0.1');
  await once(server, 'listening');
  return { origin: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((done, reject) => {
    server.close(error => error ? reject(error) : done());
    server.closeIdleConnections();
  }) };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { origin } = await startServer();
  console.log(origin);
}
