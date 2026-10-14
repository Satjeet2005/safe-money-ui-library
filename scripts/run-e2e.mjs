import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.resolve(REPO_ROOT, 'apps/transfer-demo/dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

export function createStaticServer(options = {}) {
  const rootDir = options.distDir || DIST_DIR;

  const server = http.createServer((req, res) => {
    const rawUrl = req.url || '/';
    const parsedPath = rawUrl.split('?')[0] || '/';
    const safePath = path.normalize(parsedPath).replace(/^(\.\.[/\\])+/, '');
    let filePath = path.join(rootDir, safePath);

    // If directory, look for index.html
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    // SPA fallback: if file doesn't exist, serve root index.html
    if (!fs.existsSync(filePath)) {
      filePath = path.join(rootDir, 'index.html');
    }

    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found: dist folder has not been built.');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    try {
      const content = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`Internal server error: ${err.message}`);
    }
  });

  return server;
}

export async function startServer(port = 5173, distDir = DIST_DIR, maxRetries = 5) {
  let currentPort = port;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const server = createStaticServer({ distDir });
    try {
      await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(currentPort, '127.0.0.1', () => {
          resolve();
        });
      });

      const address = server.address();
      const actualPort = typeof address === 'object' && address ? address.port : currentPort;

      return {
        server,
        port: actualPort,
        close: () => new Promise((resolve) => server.close(resolve)),
      };
    } catch (err) {
      if (err.code === 'EADDRINUSE' && attempt < maxRetries && !process.env.PORT) {
        currentPort++;
        continue;
      }
      throw err;
    }
  }
}

export async function runE2ePipeline() {
  const requestedPort = parseInt(process.env.PORT || '5173', 10);
  const { port, close } = await startServer(requestedPort);

  console.log(`[E2E] Serving production build on http://127.0.0.1:${port}`);

  const forwardedArgs = process.argv.slice(2);
  const cypressArgs = ['exec', 'cypress', 'run', ...forwardedArgs];

  const child = spawn('pnpm', cypressArgs, {
    cwd: path.resolve(REPO_ROOT, 'apps/transfer-demo'),
    stdio: 'inherit',
    env: {
      ...process.env,
      CYPRESS_BASE_URL: `http://localhost:${port}`,
    },
  });

  const cleanup = async () => {
    await close();
  };

  process.on('SIGINT', async () => {
    child.kill('SIGINT');
    await cleanup();
    process.exit(130);
  });

  process.on('SIGTERM', async () => {
    child.kill('SIGTERM');
    await cleanup();
    process.exit(143);
  });

  child.on('close', async (code) => {
    await cleanup();
    process.exit(code ?? 0);
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  runE2ePipeline().catch((err) => {
    console.error('[E2E] Pipeline failed:', err);
    process.exit(1);
  });
}
