# TMUX Remote System

A real-time remote control system for tmux sessions across multiple PCs, accessible via web and mobile interfaces.

## Architecture

```
[PC A] host-agent (Spring Boot)
        └─ ProcessBuilder("tmux attach -t <session>")
        └─ stdout → Relay(screen)
        └─ Relay(keys) → stdin

[PC B] host-agent (Spring Boot)
        └─ Same structure

                         ↓ WebSocket(JSON)

[AWS Relay Server] (Spring Boot WebSocket)
        └─ /ws endpoint
        └─ sessionId → { host, viewers } memory storage
        └─ host → screen → viewer broadcast
        └─ viewer → keys → host forward
        └─ listSessions API

                         ↓ WebSocket(JSON)

[WEB UI: React + xterm.js]
        └─ GPT Chat style UI + Real-time terminal rendering

[MOBILE APP]
        └─ Same message protocol
```

## Components

### 1. Relay Server (`relay-spring/`)
Spring Boot WebSocket server that routes messages between hosts and viewers.

### 2. Host Agent (`agent-spring/`)
Spring Boot application that runs on each PC to expose tmux sessions.

### 3. Web UI (`web-react/`)
React application with xterm.js for terminal rendering.

### 4. Mobile App (`mobile-app/`)
Design specifications for mobile clients.

## Quick Start

### 1. Start the Relay Server

```bash
cd relay-spring
./mvnw spring-boot:run
```

The server will start on `http://localhost:8080`.

### 2. Configure and Start Host Agent

Create a configuration file at `~/.tmux-remote.yml`:

```yaml
machineId: home
relay: ws://localhost:8080/ws

sessions:
  - id: home/work
    tmuxSession: work
    label: "Home · Work"
  - id: home/play
    tmuxSession: play
    label: "Home · Play"
```

Create tmux sessions:
```bash
tmux new-session -d -s work
tmux new-session -d -s play
```

Start the agent:
```bash
cd agent-spring
./mvnw spring-boot:run
```

### 3. Start the Web UI

```bash
cd web-react
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

## Protocol Specification

### Message Types

#### Host → Relay

**Register Host**
```json
{
  "type": "register",
  "role": "host",
  "session": "home/work",
  "meta": {
    "label": "Home · Work",
    "machineId": "home"
  }
}
```

**Screen Stream**
```json
{
  "type": "screen",
  "session": "home/work",
  "payload": "<base64 encoded ANSI data>"
}
```

#### Viewer → Relay

**Register Viewer**
```json
{
  "type": "register",
  "role": "viewer",
  "session": "home/work"
}
```

**Send Keys**
```json
{
  "type": "keys",
  "session": "home/work",
  "payload": "ls -la\n"
}
```

**Request Session List**
```json
{
  "type": "listSessions"
}
```

#### Relay → Viewer

**Session List**
```json
{
  "type": "sessionList",
  "sessions": [
    {
      "id": "home/work",
      "label": "Home · Work",
      "machineId": "home",
      "status": "online"
    }
  ]
}
```

**Screen Stream**
```json
{
  "type": "screen",
  "session": "home/work",
  "payload": "<base64 encoded ANSI data>"
}
```

**Session Status Update**
```json
{
  "type": "sessionStatus",
  "session": "home/work",
  "status": "offline"
}
```

## Configuration

### Host Agent Configuration (`~/.tmux-remote.yml`)

| Field | Description |
|-------|-------------|
| `machineId` | Unique identifier for this machine |
| `relay` | WebSocket URL of the relay server |
| `sessions` | List of tmux sessions to expose |
| `sessions[].id` | Unique session ID (format: `machineId/sessionName`) |
| `sessions[].tmuxSession` | Name of the tmux session to attach |
| `sessions[].label` | Display label for the session |

### Environment Variables

| Variable | Description |
|----------|-------------|
| `TMUX_REMOTE_CONFIG` | Custom path to configuration file |

## Security Considerations

- Use TLS (wss://) for production deployments
- Implement authentication for the relay server
- Consider IP whitelisting for host agents
- Use secure session IDs

## Development

### Requirements

- Java 21+
- Node.js 18+
- Maven 3.9+
- tmux

### Building

**Relay Server:**
```bash
cd relay-spring
./mvnw clean package
```

**Host Agent:**
```bash
cd agent-spring
./mvnw clean package
```

**Web UI:**
```bash
cd web-react
npm run build
```

## License

MIT
