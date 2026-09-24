import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const assets = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/api.js', ['api.js', 'text/javascript; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/register.css', ['register.css', 'text/css; charset=utf-8']],
]);
export function createServer(backend = 'http://127.0.0.1:8000') {
  const origin = new URL(backend);
  return http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    if (req.url.startsWith('/api/')) {
      const path = req.url.slice(4);
      if (!/^\/(?:\?|$|auth\/?(?:token)?(?:\?|$)|todo(?:\/\d+(?:\/status)?)?(?:\?|$))/.test(path)) {
        res.writeHead(404).end(); return;
      }
      if (req.headers.origin && req.headers.origin !== `http://${req.headers.host}`) {
        res.writeHead(403).end(); return;
      }
      try {
        const chunks = []; let size = 0;
        for await (const chunk of req) {
          size += chunk.length;
          if (size > 16384) { res.writeHead(413).end(); return; }
          chunks.push(chunk);
        }
        const headers = {};
        for (const name of ['authorization', 'content-type']) {
          if (req.headers[name]) headers[name] = req.headers[name];
        }
        const upstream = await fetch(new URL(path, origin), {
          method: req.method, headers, redirect: 'manual',
          body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks),
          signal: AbortSignal.timeout(10000),
        });
        res.statusCode = upstream.status;
        res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
        res.end(Buffer.from(await upstream.arrayBuffer()));
      } catch {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ detail: 'Não foi possível acessar a API. Confira se o backend está em execução.' }));
      }
      return;
    }
    const asset = assets.get(req.url.split('?')[0]);
    if (!asset || !['GET', 'HEAD'].includes(req.method)) { res.writeHead(404).end(); return; }
    try {
      const content = await readFile(new URL(`./${asset[0]}`, import.meta.url));
      res.writeHead(200, { 'Content-Type': asset[1] });
      res.end(req.method === 'HEAD' ? undefined : content);
    } catch { res.writeHead(500).end('Falha ao carregar o frontend.'); }
  });
}
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const port = Number(process.env.PORT || 5173);
  createServer(process.env.API_TARGET).listen(port, '127.0.0.1', () => console.log(`TodoApp: http://127.0.0.1:${port}`));
}
