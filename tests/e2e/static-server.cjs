const { createReadStream, existsSync, statSync } = require('node:fs');
const { createServer } = require('node:http');
const { extname, resolve, sep } = require('node:path');

const host = '127.0.0.1';
const port = 4173;
const root = resolve(process.cwd());
const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

function resolveRequestPath(rawUrl) {
  const url = new URL(rawUrl, `http://${host}:${port}`);
  const pathname = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
  const filePath = resolve(root, `.${pathname}`);

  if (filePath !== root && !filePath.startsWith(`${root}${sep}`)) {
    return null;
  }
  return filePath;
}

const server = createServer((request, response) => {
  if (request.method === 'POST' && request.url === '/__playwright/stop') {
    response.writeHead(204).end();
    server.close();
    return;
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405).end();
    return;
  }

  const filePath = resolveRequestPath(request.url ?? '/');
  if (!filePath || !existsSync(filePath) || statSync(filePath).isDirectory()) {
    response.writeHead(404).end('Not found');
    return;
  }

  response.writeHead(200, { 'content-type': types[extname(filePath)] ?? 'application/octet-stream' });
  if (request.method === 'HEAD') {
    response.end();
    return;
  }
  createReadStream(filePath).pipe(response);
});

server.listen(port, host, () => {
  console.log(`Static test server listening at http://${host}:${port}`);
});
