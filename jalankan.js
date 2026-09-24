// Melayani webapp/ dan memproksikan /sap/* ke sap.ilmuprogram.com.
// Proksi ada karena halaman berjalan di 127.0.0.1 sementara layanannya di domain
// lain — tanpa ini peramban menolaknya sebagai pelanggaran CORS.
//
//   export SAP_USER='...' SAP_PASS='...'
//   node jalankan.js            → layani, biarkan hidup
//
// Sandi tidak pernah sampai ke peramban: proksi yang memasang header Authorization.

const http = require('http');
const https = require('https');
const path = require('path');
const fs = require('fs');

const HOST   = process.env.SAP_HOST   || 'sap.ilmuprogram.com';
const CLIENT = process.env.SAP_CLIENT || '777';
const USER   = process.env.SAP_USER;
const PASS   = process.env.SAP_PASS;
const PORT   = Number(process.env.PORT || 8090);
const WEBAPP = path.join(__dirname, 'webapp');

if (!USER || !PASS) {
  console.error("Setel dulu:  export SAP_USER='...' SAP_PASS='...'");
  process.exit(1);
}

const TIPE = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8', '.json': 'application/json',
  '.properties': 'text/plain; charset=utf-8', '.css': 'text/css',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  const jalur = decodeURIComponent(req.url.split('?')[0]);

  if (jalur.startsWith('/sap/')) {
    // sap-client wajib disisipkan: tanpa itu gateway memakai client bawaan sistem.
    const pisah = req.url.includes('?') ? '&' : '?';
    const target = req.url + pisah + 'sap-client=' + CLIENT;
    const r = https.request({
      hostname: HOST, port: 443, path: target, method: req.method,
      headers: {
        Authorization: 'Basic ' + Buffer.from(USER + ':' + PASS).toString('base64'),
        Accept: req.headers.accept || 'application/json',
        'Content-Type': req.headers['content-type'] || 'application/json',
        'x-csrf-token': req.headers['x-csrf-token'] || '',
      },
    }, (u) => {
      res.writeHead(u.statusCode, {
        'Content-Type': u.headers['content-type'] || 'application/json',
        'x-csrf-token': u.headers['x-csrf-token'] || '',
      });
      u.pipe(res);
    });
    r.on('error', (e) => { res.writeHead(502); res.end('proksi gagal: ' + e.message); });
    req.pipe(r);
    return;
  }

  const berkas = path.join(WEBAPP, jalur === '/' ? '/index.html' : jalur);
  if (!berkas.startsWith(WEBAPP) || !fs.existsSync(berkas) || fs.statSync(berkas).isDirectory()) {
    res.writeHead(404); return res.end('404 ' + jalur);
  }
  res.writeHead(200, { 'Content-Type': TIPE[path.extname(berkas)] || 'application/octet-stream' });
  res.end(fs.readFileSync(berkas));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`sistem  : ${HOST}  client ${CLIENT}  pengguna ${USER}`);
  console.log(`layanan : /sap/opu/odata/sap/C_PURCHASEORDER_FS_SRV/`);
  console.log(`alamat  : http://127.0.0.1:${PORT}/index.html`);
  console.log(`          http://127.0.0.1:${PORT}/index.html?sap-ui-language=id  (bahasa Indonesia)`);
  console.log('\nCtrl+C untuk berhenti.');
});
