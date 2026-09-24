const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain; charset=utf-8'
};

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    try {
        const decodedUrl = decodeURI(req.url.split('?')[0]);
        let safePath = path.normalize(decodedUrl).replace(/^(\.\.[\/\\])+/, '');
        if (safePath === '/' || safePath === '\\') {
            safePath = '/index.html';
        }

        let filePath = path.join(ROOT, safePath);

        // Security check
        if (!filePath.startsWith(ROOT)) {
            res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('403 Forbidden');
            return;
        }

        fs.stat(filePath, (err, stats) => {
            if (err) {
                // If file doesn't exist, check if adding .html helps
                if (!path.extname(filePath)) {
                    const htmlPath = filePath + '.html';
                    if (fs.existsSync(htmlPath)) {
                        filePath = htmlPath;
                    } else {
                        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                        res.end('404 Not Found');
                        return;
                    }
                } else {
                    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                    res.end('404 Not Found');
                    return;
                }
            } else if (stats.isDirectory()) {
                filePath = path.join(filePath, 'index.html');
                if (!fs.existsSync(filePath)) {
                    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                    res.end('404 Not Found');
                    return;
                }
            }

            const ext = path.extname(filePath).toLowerCase();
            const contentType = MIME_TYPES[ext] || 'application/octet-stream';

            fs.readFile(filePath, (readErr, content) => {
                if (readErr) {
                    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
                    res.end('500 Server Error');
                    return;
                }
                res.writeHead(200, {
                    'Content-Type': contentType,
                    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                });
                res.end(content);
            });
        });
    } catch (e) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('500 Server Error: ' + e.message);
    }
});

server.listen(PORT, '127.0.0.1', () => {
    console.log(`[AITU Server] Server running at http://localhost:${PORT}/`);
    console.log(`[AITU Server] Dashboard: http://localhost:${PORT}/dashboard.html`);
    console.log(`[AITU Server] Repository: http://localhost:${PORT}/repository.html`);
    console.log(`[AITU Server] Login: http://localhost:${PORT}/login.html`);
});
