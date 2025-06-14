# Architecture Deep Dive

## System Overview

The Matchmaking as a Service (MaaS) system is built on AWS serverless architecture, providing automatic scaling, high availability, and cost efficiency.

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Game      │────▶│ API Gateway  │────▶│   Lambda    │
│  Clients    │     │  (REST/WS)   │     │  Functions  │
└─────────────┘     └──────────────┘     └─────────────┘
                            │                     │
                            ▼                     ▼
                    ┌──────────────┐     ┌─────────────┐
                    │  WebSocket   │     │  DynamoDB   │
                    │ Connections  │     │   Tables    │
                    └──────────────┘     └─────────────┘
                                                 │
                    ┌──────────────┐             │
                    │     SQS      │◀────────────┘
                    │    Queue     │
                    └──────────────┘
```

## Core Components

### 1. API Gateway

**REST API**
- Handles all HTTP requests
- Rate limiting and throttling
- CORS enabled
- Request/response transformation

**WebSocket API**
- Real-time bidirectional communication
- Connection management
- Message routing

### 2. Lambda Functions

**Player Management**
- `registerPlayer`: Creates new player profiles
- `getPlayer`: Retrieves player data
- `updatePlayerStats`: Updates ratings and statistics

**Matchmaking Engine**
- `joinQueue`: Adds players to matchmaking queue
- `leaveQueue`: Removes players from queue
- `processMatchmaking`: Core matching algorithm (runs periodically)

**Lobby Management**
- `createLobby`: Creates custom game lobbies
- `joinLobby`: Handles player joining
- `leaveLobby`: Handles player leaving
- `startMatch`: Initiates game sessions

**WebSocket Handlers**
- `connect`: Establishes WebSocket connections
- `disconnect`: Cleans up connections
- `default`: Routes WebSocket messages

### 3. DynamoDB Tables

**Players Table**
```
PK: playerId (String)
Attributes:
- username
- skillRating
- wins/losses
- region
- preferences
GSI: SkillRatingIndex
```

**Matches Table**
```
PK: matchId (String)
Attributes:
- players[]