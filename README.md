# WebSocket Server for Community Chat

This is a WebSocket server that handles real-time messaging for the community chat feature.

## Features

- Real-time messaging for communities
- Room-based messaging (each community has its own room)
- Automatic reconnection on connection loss
- Health check endpoint
- CORS support for localhost:3000

## Installation

```bash
npm install
```

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## Configuration

The server runs on port 3001 by default. You can change this by setting the `PORT` environment variable.

## API Endpoints

### Health Check
- **GET** `/health` - Returns server status and connection statistics

## WebSocket Connection

Connect to the WebSocket server with the following URL format:
```
ws://localhost:3001?communityId=<community_id>&userId=<user_id>
```

### Message Format

#### Incoming Messages
```json
{
  "type": "message",
  "message": {
    "id": "message_id",
    "content": "message content",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "author": {
      "id": "user_id",
      "name": "User Name",
      "image": "profile_image_url"
    }
  }
}
```

## Security

- Only accepts connections from localhost:3000 (CORS)
- Requires communityId and userId parameters
- Validates user membership on the main application side

## Monitoring

The server provides a health check endpoint at `/health` that returns:
- Server status
- Number of active communities
- Total number of connected clients
