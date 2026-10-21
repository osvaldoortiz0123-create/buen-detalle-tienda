// Servidor estático mínimo para las pruebas en navegador.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.join(__dirname, '..');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.csv': 'text/csv; charset=utf-8' };

function servidor() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const pedido = decodeURIComponent(req.url.split('?')[0]);
      const ruta = path.join(RAIZ, pedido === '/' ? 'index.html' : pedido);
      if (!ruta.startsWith(RAIZ) || !fs.existsSync(ruta) || fs.statSync(ruta).isDirectory()) {
        res.writeHead(404);
        return res.end();
      }
      res.writeHead(200, { 'Content-Type': TIPOS[path.extname(ruta)] || 'application/octet-stream' });
      fs.createReadStream(ruta).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

// En entornos con proxy (HTTPS_PROXY) Chromium lo usa, excepto para el servidor local.
const opcionesNavegador = () => (process.env.HTTPS_PROXY
  ? { args: [`--proxy-server=${process.env.HTTPS_PROXY}`, '--proxy-bypass-list=127.0.0.1;localhost'] }
  : {});

module.exports = { servidor, opcionesNavegador, RAIZ };
