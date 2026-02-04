const http = require('http');

function testUrl(path, name) {
    const options = {
        hostname: '127.0.0.1',
        port: 5001,
        path: path,
        method: 'GET'
    };

    const req = http.request(options, (res) => {
        console.log(`[${name}] STATUS: ${res.statusCode}`);
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            console.log(`[${name}] First 50 chars: ${data.substring(0, 50)}`);
        });
    });

    req.on('error', (e) => {
        console.error(`[${name}] Error: ${e.message}`);
    });

    req.setTimeout(2000, () => {
        req.destroy();
        console.log(`[${name}] Timeout`);
    });

    req.end();
}

testUrl('/api', 'API Root');
testUrl('/socket.io/?EIO=4&transport=polling', 'Socket.IO');
