const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function getMimeType(filePath) {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream';
}

function resolveInsideRoot(rootDir, candidatePath) {
  const root = path.resolve(rootDir);
  const normalizedCandidate = candidatePath.replace(/^[\\/]+/, '');
  const resolved = path.resolve(root, normalizedCandidate);

  if (resolved === root || resolved.startsWith(`${root}${path.sep}`)) {
    return resolved;
  }

  return null;
}

function findFile(rootDir, pathname) {
  const hasExtension = path.posix.extname(pathname) !== '';
  const cleanPath = pathname === '/' ? 'index.html' : pathname.replace(/^[\\/]+/, '');
  const candidates = pathname === '/' ? ['index.html'] : [cleanPath];

  if (!hasExtension) {
    candidates.push(`${cleanPath}.html`);
    candidates.push(path.join(cleanPath, 'index.html'));
  }

  for (const candidate of candidates) {
    const resolved = resolveInsideRoot(rootDir, candidate);

    if (resolved && fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
      return resolved;
    }
  }

  if (!hasExtension) {
    const fallback = resolveInsideRoot(rootDir, 'index.html');

    if (fallback && fs.existsSync(fallback) && fs.statSync(fallback).isFile()) {
      return fallback;
    }
  }

  return null;
}

function serveFile(res, filePath) {
  const headers = {
    'Content-Type': getMimeType(filePath),
  };

  if (filePath.endsWith('.html')) {
    headers['Cache-Control'] = 'no-store';
  } else if (filePath.includes(`${path.sep}_next${path.sep}static${path.sep}`)) {
    headers['Cache-Control'] = 'public, max-age=31536000, immutable';
  }

  res.writeHead(200, headers);

  const stream = fs.createReadStream(filePath);
  stream.on('error', () => {
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    }
    res.end('Failed to read static asset.');
  });
  stream.pipe(res);
}

function createStaticServer(rootDir, { host = '127.0.0.1', port = 3000 } = {}) {
  const resolvedRoot = path.resolve(rootDir);

  if (!fs.existsSync(resolvedRoot)) {
    throw new Error(`Static output folder not found: ${resolvedRoot}. Run "npm run build" first.`);
  }

  const server = http.createServer((req, res) => {
    try {
      if (!req.url) {
        throw new Error('Missing request URL.');
      }

      const requestUrl = new URL(req.url, 'http://localhost');
      const pathname = decodeURIComponent(requestUrl.pathname);
      const filePath = findFile(resolvedRoot, pathname);

      if (!filePath) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not found.');
        return;
      }

      serveFile(res, filePath);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected server error.';
      const statusCode = message.includes('URI malformed') ? 400 : 500;
      res.writeHead(statusCode, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(message);
    }
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      const address = server.address();

      if (!address || typeof address === 'string') {
        reject(new Error('Unable to determine server address.'));
        return;
      }

      resolve({
        close: () =>
          new Promise((closeResolve) => {
            server.close(() => closeResolve());
          }),
        port: address.port,
        server,
        url: `http://${host}:${address.port}`,
      });
    });
  });
}

if (require.main === module) {
  const rootDir = process.argv[2] ? path.resolve(process.argv[2]) : path.join(process.cwd(), 'out');
  const portArg = Number(process.env.PORT ?? process.argv[3] ?? 3000);
  const port = Number.isFinite(portArg) && portArg >= 0 ? portArg : 3000;

  createStaticServer(rootDir, { host: '127.0.0.1', port })
    .then(({ url }) => {
      console.log(`Bilquo static server running at ${url}`);
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}

module.exports = {
  createStaticServer,
};
