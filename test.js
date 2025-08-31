const WebSocket = require('ws');
const http = require('http');
const fetch = require('node-fetch');

// Test the API connection
async function testApiConnection() {
  try {
    console.log('Testing API connection to Next.js backend...');
    const response = await fetch('http://localhost:3000/api/communities');
    console.log('API Status:', response.status);
    if (response.ok) {
      const data = await response.json();
      console.log('API Response:', data);
    }
  } catch (error) {
    console.error('API test failed:', error.message);
  }
}

// Test the websocket server
function testWebSocketServer() {
  console.log('Testing WebSocket server...');
  
  const server = http.createServer();
  const wss = new WebSocket.Server({ server });
  
  wss.on('connection', (ws) => {
    console.log('WebSocket connection established');
    ws.send(JSON.stringify({ type: 'test', message: 'Hello from WebSocket server' }));
  });
  
  server.listen(3001, () => {
    console.log('WebSocket test server running on port 3001');
    
    // Test the connection
    const testWs = new WebSocket('ws://localhost:3001');
    testWs.onopen = () => {
      console.log('Test WebSocket client connected');
      testWs.close();
    };
    testWs.onmessage = (event) => {
      console.log('Received test message:', JSON.parse(event.data));
    };
  });
}

// Run tests
async function runTests() {
  await testApiConnection();
  testWebSocketServer();
}

runTests();
