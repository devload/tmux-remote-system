const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:8080/ws');

ws.on('open', function open() {
    console.log('Connected to Relay Server');

    // Request session list
    console.log('Sending listSessions request...');
    ws.send(JSON.stringify({ type: 'listSessions' }));

    // Register as viewer after a short delay
    setTimeout(() => {
        console.log('Registering as viewer for test-machine/dev...');
        ws.send(JSON.stringify({
            type: 'register',
            role: 'viewer',
            session: 'test-machine/dev'
        }));
    }, 500);

    // Send a test command after 2 seconds
    setTimeout(() => {
        console.log('Sending test keys: "echo hello"...');
        ws.send(JSON.stringify({
            type: 'keys',
            session: 'test-machine/dev',
            payload: 'echo hello from websocket test\n'
        }));
    }, 2000);

    // Close after 5 seconds
    setTimeout(() => {
        console.log('Test complete, closing connection');
        ws.close();
        process.exit(0);
    }, 5000);
});

ws.on('message', function incoming(data) {
    const msg = JSON.parse(data);
    console.log(`Received: type=${msg.type}`);

    if (msg.type === 'sessionList') {
        console.log(`  Sessions: ${JSON.stringify(msg.sessions, null, 2)}`);
    } else if (msg.type === 'screen') {
        const decoded = Buffer.from(msg.payload, 'base64').toString('utf8');
        console.log(`  Screen data (first 200 chars): ${decoded.substring(0, 200).replace(/\n/g, '\\n')}`);
    } else if (msg.type === 'sessionStatus') {
        console.log(`  Session: ${msg.session}, Status: ${msg.status}`);
    }
});

ws.on('error', function error(err) {
    console.error('WebSocket error:', err);
    process.exit(1);
});

ws.on('close', function close() {
    console.log('Connection closed');
});
