const { spawn } = require('child_process');
const http = require('http');

async function main() {
    const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
        '--headless=new',
        '--remote-debugging-port=9227',
        '--disable-gpu',
        'about:blank'
    ]);

    await new Promise(r => setTimeout(r, 1500));

    http.get('http://127.0.0.1:9227/json', (res) => {
        let data = '';
        res.on('data', d => data += d);
        res.on('end', async () => {
            const targets = JSON.parse(data);
            const pageTarget = targets.find(t => t.type === 'page');
            const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

            ws.onopen = async () => {
                ws.send(JSON.stringify({ id: 1, method: 'Page.enable' }));
                ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));
                ws.send(JSON.stringify({ id: 3, method: 'Log.enable' }));

                ws.onmessage = (msg) => {
                    const parsed = JSON.parse(msg.data);
                    if (parsed.method === 'Runtime.consoleAPICalled') {
                        console.log('CONSOLE:', parsed.params.type, parsed.params.args.map(a => a.value || a.description).join(' '));
                    }
                    if (parsed.method === 'Runtime.exceptionThrown') {
                        console.error('EXCEPTION:', parsed.params.exceptionDetails.text, parsed.params.exceptionDetails.exception?.description);
                    }
                };

                // Navigate to faculty-materials.html
                ws.send(JSON.stringify({
                    id: 4,
                    method: 'Page.navigate',
                    params: { url: 'http://localhost:3000/faculty-materials.html' }
                }));

                await new Promise(r => setTimeout(r, 4000));

                ws.close();
                chrome.kill();
                process.exit(0);
            };
        });
    });
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
