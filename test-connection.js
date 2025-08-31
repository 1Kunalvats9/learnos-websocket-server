const WebSocket = require('ws');

console.log('Testing WebSocket connection...');

const ws = new WebSocket('ws://localhost:3001');

ws.onopen = () => {
  console.log('✅ WebSocket connection successful!');
  ws.close();
};

ws.onerror = (error) => {
  console.error('❌ WebSocket connection failed:', error);
};

ws.onclose = () => {
  console.log('WebSocket connection closed');
  process.exit(0);
};
