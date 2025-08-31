# WebSocket Server Deployment Guide

## Render Deployment

This WebSocket server includes a built-in keep-alive mechanism to prevent Render from stopping the service due to inactivity.

### Environment Variables

Set these environment variables in your Render dashboard:

- `PORT`: The port your server will run on (Render will set this automatically)
- `RENDER_EXTERNAL_URL`: Your Render app's external URL (e.g., `https://your-app-name.onrender.com`)
- `KEEP_ALIVE_INTERVAL`: Optional - interval in milliseconds for keep-alive pings (default: 600000 = 10 minutes)

### Keep-Alive Mechanism

The server automatically:
1. Sends a ping to its own `/keep-alive` endpoint every 10 minutes
2. Logs successful pings with timestamps
3. Handles errors gracefully if pings fail
4. Cleans up the cron job on graceful shutdown

### Endpoints

- `/health` - Health check endpoint (returns server status and client counts)
- `/keep-alive` - Keep-alive endpoint (returns server uptime and memory usage)
- WebSocket connections on the root path

### Deployment Steps

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set the build command: `npm install`
4. Set the start command: `npm start`
5. Add environment variables as needed
6. Deploy!

### Monitoring

Check your Render logs to see keep-alive ping messages:
```
Keep-alive ping successful: Server is active and responding at 2024-01-15T10:30:00.000Z
```

### Customization

To change the keep-alive interval, set the `KEEP_ALIVE_INTERVAL` environment variable (in milliseconds).

Example: Set to 15 minutes = 900000 milliseconds
