const http = require('http');
const fs = require('fs');
const path = require('path');

// 创建HTTP服务器
const server = http.createServer((req, res) => {
    console.log(`Request for ${req.url}`);
    
    // 处理根路径请求
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }
    
    // 获取文件扩展名
    const extname = String(path.extname(filePath)).toLowerCase();
    
    // 设置MIME类型
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.wav': 'audio/wav',
        '.mp4': 'video/mp4',
        '.woff': 'application/font-woff',
        '.ttf': 'application/font-ttf',
        '.eot': 'application/vnd.ms-fontobject',
        '.otf': 'application/font-otf',
        '.wasm': 'application/wasm'
    };
    
    const contentType = mimeTypes[extname] || 'application/octet-stream';
    
    // 读取文件并发送响应
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code == 'ENOENT') {
                // 文件不存在，返回404
                fs.readFile('./index.html', (error, content) => {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(content, 'utf-8');
                });
            } else {
                // 服务器错误，返回500
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`);
            }
        } else {
            // 文件存在，返回文件内容
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// 服务器监听端口8080
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log('Press Ctrl+C to stop the server');
});
