const WebSocket = require('ws');
const http = require('http');
const url = require('url');
const cors = require('cors');
const fetch = require('node-fetch');

// Create HTTP server
const server = http.createServer();

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Store connected clients by community
const communityClients = new Map();

// CORS middleware
const corsMiddleware = cors({
  origin: 'http://localhost:3000',
  credentials: true
});

// Keep-alive function to prevent Render from stopping the server
function startKeepAliveCron() {
  const KEEP_ALIVE_INTERVAL = parseInt(process.env.KEEP_ALIVE_INTERVAL) || 10 * 60 * 1000; // 10 minutes default
  const SERVER_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${process.env.PORT || 3001}`;
  
  console.log(`Starting keep-alive cron job. Server URL: ${SERVER_URL}`);
  console.log(`Will ping server every ${KEEP_ALIVE_INTERVAL / 1000 / 60} minutes`);
  
  const keepAlive = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/keep-alive`, {
        method: 'GET',
        headers: {
          'User-Agent': 'WebSocket-Server-KeepAlive/1.0',
          'X-Keep-Alive': 'true'
        },
        timeout: 10000 // 10 second timeout
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Keep-alive ping successful: ${data.message} at ${new Date().toISOString()}`);
      } else {
        console.warn(`Keep-alive ping failed with status: ${response.status}`);
      }
    } catch (error) {
      console.error('Keep-alive ping error:', error.message);
    }
  };
  
  // Start the cron job
  const intervalId = setInterval(keepAlive, KEEP_ALIVE_INTERVAL);
  
  // Initial ping after 30 seconds
  setTimeout(keepAlive, 30000);
  
  // Return the interval ID for cleanup
  return intervalId;
}

// Helper function to make API calls to Next.js backend
async function makeApiCall(endpoint, options = {}) {
  try {
    const response = await fetch(`http://localhost:3000/api${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'WebSocket-Server/1.0',
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      console.error(`API call failed: ${response.status} - ${response.statusText}`);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`API call failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
}

// Handle WebSocket connections
wss.on('connection', (ws, request) => {
  const { query } = url.parse(request.url, true);
  const { communityId, userId } = query;

  console.log('WebSocket connection attempt:', { communityId, userId });

  if (!communityId || !userId) {
    console.log('WebSocket connection rejected: Missing communityId or userId');
    ws.close(1008, 'Missing communityId or userId');
    return;
  }

  console.log(`User ${userId} connected to community ${communityId}`);

  // Add client to community room
  if (!communityClients.has(communityId)) {
    communityClients.set(communityId, new Set());
  }
  communityClients.get(communityId).add(ws);

  // Store user info on websocket
  ws.communityId = communityId;
  ws.userId = userId;

  // Handle incoming messages
  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data);
      
      if (message.type === 'broadcast') {
        console.log('Broadcasting message from user:', userId, 'in community:', communityId);
        
        // Broadcast message to all clients in the community (except sender)
        const communityRoom = communityClients.get(communityId);
        if (communityRoom) {
          const messageToBroadcast = {
            type: 'message',
            message: message.message
          };

          communityRoom.forEach((client) => {
            if (client.readyState === WebSocket.OPEN && client !== ws) {
              client.send(JSON.stringify(messageToBroadcast));
            }
          });
        }
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });

  // Handle client disconnection
  ws.on('close', () => {
    console.log(`User ${userId} disconnected from community ${communityId}`);
    
    // Remove client from community room
    const communityRoom = communityClients.get(communityId);
    if (communityRoom) {
      communityRoom.delete(ws);
      
      // Clean up empty community rooms
      if (communityRoom.size === 0) {
        communityClients.delete(communityId);
      }
    }
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error for user', userId, 'in community', communityId, ':', error);
  });
});

// HTTP request handler
server.on('request', (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Keep-Alive');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      communities: communityClients.size,
      totalClients: Array.from(communityClients.values()).reduce((sum, clients) => sum + clients.size, 0),
      timestamp: new Date().toISOString()
    }));
  } else if (req.url === '/keep-alive') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'alive',
      message: 'Server is active and responding',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage()
    }));
  } else if (req.headers.upgrade && req.headers.upgrade.toLowerCase() === 'websocket') {
    // Let the WebSocket server handle WebSocket upgrade requests
    return;
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

const PORT = process.env.PORT || 3001;

// Start the keep-alive cron job
let keepAliveIntervalId = null;

server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
  console.log(`Keep-alive endpoint available at http://localhost:${PORT}/keep-alive`);
  console.log(`Using Next.js API at http://localhost:3000/api for data operations`);
  
  // Start the keep-alive cron job
  keepAliveIntervalId = startKeepAliveCron();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  
  // Clear the keep-alive interval
  if (keepAliveIntervalId) {
    clearInterval(keepAliveIntervalId);
    console.log('Keep-alive cron job stopped');
  }
  
  wss.close(() => {
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  
  // Clear the keep-alive interval
  if (keepAliveIntervalId) {
    clearInterval(keepAliveIntervalId);
    console.log('Keep-alive cron job stopped');
  }
  
  wss.close(() => {
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
});
