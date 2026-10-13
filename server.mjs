import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve(import.meta.dirname);
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' };
let port = Number(process.env.PORT || 5173);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('PORT debe ser un número entre 1 y 65535.');
  process.exit(1);
}
const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    const relative = file.slice(root.length + 1);
    if (!file.startsWith(root + sep) || relative.split(/[\\/]/).some(part => part.startsWith('.')) || !mime[extname(file)]) {
      res.writeHead(403).end('Forbidden'); return;
    }
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': mime[extname(file)], 'Cache-Control': 'no-cache' }).end(body);
  } catch { res.writeHead(404).end('Not found'); }
});
let retries = 0;
server.on('error', error => {
  if (error.code === 'EADDRINUSE' && retries < 20 && port < 65535) {
    console.log(`El puerto ${port} está ocupado; probando ${port + 1}…`);
    retries += 1;
    port += 1;
    server.listen(port, '127.0.0.1');
    return;
  }
  console.error(`No se pudo iniciar el visor: ${error.message}`);
  process.exitCode = 1;
});
server.on('listening', () => console.log(`Teseracto: http://localhost:${port}`));
server.listen(port, '127.0.0.1');
