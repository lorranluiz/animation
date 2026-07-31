const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT = __dirname;

const MIME = {
  '.svg': 'image/svg+xml',
  '.js': 'application/javascript',
  '.html': 'text/html',
  '.css': 'text/css',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.json': 'application/json',
  '.wasm': 'application/wasm'
};

http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url.startsWith('/convert')) {
    const urlParts = new URL(req.url, 'http://localhost');
    const resParam = urlParts.searchParams.get('res') || 'full';
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      const webm = Buffer.concat(chunks);
      console.log('POST /convert recebido: ' + webm.length + ' bytes, res=' + resParam);
      const webmPath = '/tmp/input.webm';
      const mp4Path = '/tmp/output.mp4';
      fs.writeFileSync(webmPath, webm);

      try {
        const { execFileSync } = require('child_process');
        const result = execFileSync(path.join(ROOT, '.venv/bin/python3'), [path.join(ROOT, 'convert.py'), webmPath, mp4Path, resParam], {
          cwd: ROOT, timeout: 120000, encoding: 'utf-8',
          stdio: ['ignore', 'pipe', 'pipe']
        });
        console.log('Conversão OK: ' + result);
        const mp4 = fs.readFileSync(mp4Path);
        console.log('MP4 tamanho: ' + mp4.length + ' bytes');
        res.writeHead(200, {
          'Content-Type': 'video/mp4',
          'Content-Disposition': 'attachment; filename="animacao.mp4"',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(mp4);
      } catch(e) {
        console.error('Erro conversão:', e.message, e.stderr ? e.stderr.toString() : '');
        res.writeHead(500, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
        res.end('Conversion failed: ' + e.message);
      }
      try { fs.unlinkSync(webmPath); } catch(e) {}
      try { fs.unlinkSync(mp4Path); } catch(e) {}
    });
    return;
  }

  let filePath = path.join(ROOT, req.url === '/' ? '/test/zoom-imagem.svg' : decodeURIComponent(req.url.split('?')[0]));

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404');
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`http://localhost:${PORT}/`);
});
