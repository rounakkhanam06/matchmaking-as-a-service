# Matchmaking as a Service API Documentation

## Base URL
```
https://your-api-gateway-url/dev
```

## Authentication
Currently, the API uses API keys. In production, integrate with AWS Cognito for user authentication.

## Endpoints

### Player Management

#### Register Player
```http
POST /players/register
```

**Request Body:**
```json
{
  "username": "PlayerName",
  "region": "us-east-1",
  "preferredGameMode": "ranked",
  "maxAcceptableLatency": 150
}
```

**Response:**
```json
{
  "message": "Player registered successfully",
  "player": {
    "playerId": "uuid",
    "username": "PlayerName",
    "skillRating": 1200,
    "region": "us-east-1"
  }
}
```

#### Get Player
```http
GET /players/{playerId}
```

**Response:**
```json
{
  "player": {
    "playerId": "uuid",
    "username": "PlayerName",
    "skillRating": 1200,
    "wins": 10,
    "losses": 5,
    "winRate": 66.67,
    "region": "us-east-1"
  }
}
```

#### Update Player Stats
```http
PUT /players/{playerId}/stats
```

**Request Body:**
```json
{
  "matchResult": "win",
  "opponentRating": 1300
}
```

### Matchmaking

#### Join Queue
```http
POST /matchmaking/queue
```

**Request Body:**
```json
{
  "playerId": "uuid",
  "gameMode": "ranked"
}
```

**Response:**
```json
{
  "message": "Successfully joined matchmaking queue",
  "queueData": {
    "playerId": "uuid",
    "gameMode": "ranked",
    "estimatedWaitTime": 30
  }
}
```

#### Leave Queue
```http
DELETE /matchmaking/queue/{playerId}
```

### Lobby Management

#### Create Lobby
```http
POST /lobbies
```

**Request Body:**
```json
{
  "hostPlayerId": "uuid",
  "gameMode": "casual",
  "maxPlayers": 10,
  "minPlayers": 2,
  "isPrivate": false
}
```

#### Join Lobby
```http
POST /lobbies/{lobbyId}/join
```

**Request Body:**
```json
{
  "playerId": "uuid",
  "password": "optional-for-private-lobbies"
}
```

#### Leave Lobby
```http
POST /lobbies/{lobbyId}/leave
```

**Request Body:**
```json
{
  "playerId": "uuid"
}
```

#### Start Match
```http
POST /lobbies/{lobbyId}/start
```

**Request Body:**
```json
{
  "playerId": "host-player-id"
}
```

### Match Management

#### Get Match
```http
GET /matches/{matchId}
```

#### Update Match
```http
PUT /matches/{matchId}
```

**Request Body:**
```json
{
  "updates": {
    "scores": [
      {"playerId": "uuid", "score": 100}
    ],
    "playerStatus": [
      {"playerId": "uuid", "status": "DISCONNECTED"}
    ]
  }
}
```

#### End Match
```http
POST /matches/{matchId}/end
```

**Request Body:**
```json
{
  "winningTeam": "TEAM_A"
}
```

## WebSocket Events

### Connection
```
wss://your-websocket-url
```

### Client -> Server Messages

#### Register
```json
{
  "action": "REGISTER",
  "playerId": "uuid"
}
```

#### Ready
```json
{
  "action": "READY",
  "lobbyId": "uuid",
  "playerId": "uuid"
}
```

### Server -> Client Messages

#### Match Found
```json
{
  "type": "MATCH_FOUND",
  "lobbyId": "uuid",
  "gameMode": "ranked",
  "players": [...]
}
```

#### Player Joined
```json
{
  "type": "PLAYER_JOINED",
  "player": {...},
  "lobbyId": "uuid"
}
```

#### Match Started
```json
{
  "type": "MATCH_STARTED",
  "matchId": "uuid",
  "gameServer": {
    "ip": "10.0.0.1",
    "port": 7777,
    "region": "us-east-1"
  }
}
```

## Error Codes

- `400` - Bad Request (missing or invalid parameters)
- `401` - Unauthorized
- `403` - Forbidden (insufficient permissions)
- `404` - Resource not found
- `409` - Conflict (e.g., player already in queue)
- `500` - Internal server error

## Rate Limiting

- 100 requests per minute per IP
- 1000 requests per hour per player
- WebSocket messages: 10 per second

## Testing

Use the provided Postman collection or curl commands in the examples folder.