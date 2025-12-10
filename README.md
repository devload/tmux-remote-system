# TMUX Remote System

Real-time remote control system for tmux sessions across multiple machines, accessible via web browser.

## Architecture

```
┌─────────────┐     WebSocket      ┌──────────────┐     WebSocket      ┌─────────────┐
│  Host Agent │ ◄──────────────────► Relay Server ◄───────────────────► │   Web UI    │
│  (per PC)   │                    │   (central)  │                    │  (browser)  │
└─────────────┘                    └──────────────┘                    └─────────────┘
      │                                                                       │
      ▼                                                                       ▼
┌─────────────┐                                                        ┌─────────────┐
│    tmux     │                                                        │   xterm.js  │
│  sessions   │                                                        │  terminal   │
└─────────────┘                                                        └─────────────┘
```

- **Relay Server**: Central WebSocket hub that routes messages between hosts and viewers
- **Host Agent**: Runs on each machine, auto-discovers tmux sessions, streams terminal output
- **Web UI**: React app with xterm.js, shows all sessions grouped by machine

## Quick Start

### Prerequisites

- Java 17+
- Maven 3.6+
- Node.js 18+
- tmux

### 1. Start Relay Server

```bash
cd relay-spring
mvn spring-boot:run
```

Relay runs on `ws://localhost:8080/ws`

### 2. Configure Host Agent

Create `~/.tmux-remote.yml`:

```yaml
machineId: my-desktop    # Unique name for this machine
relay: ws://localhost:8080/ws   # Relay server URL
```

For remote machines, use the relay server's IP:
```yaml
machineId: my-laptop
relay: ws://192.168.1.100:8080/ws
```

### 3. Start Host Agent

```bash
cd agent-spring
mvn spring-boot:run
```

The agent automatically discovers all tmux sessions and streams them to the relay.

### 4. Start Web UI

```bash
cd web-react
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

## Features

- **Auto-discovery**: Agent automatically detects new tmux sessions (scans every 5 seconds)
- **Multi-machine support**: Sessions grouped by machineId in sidebar
- **Real-time streaming**: Terminal output streamed via WebSocket
- **Full input support**: Keyboard input including Ctrl+C, Ctrl+D, arrow keys
- **Unicode support**: Proper UTF-8 handling for box-drawing characters, emojis, etc.
- **Reconnection**: Automatic reconnect with exponential backoff

## Configuration

### ~/.tmux-remote.yml

| Field | Required | Description |
|-------|----------|-------------|
| machineId | Yes | Unique identifier for this machine |
| relay | Yes | WebSocket URL of the relay server |

### Environment Variables (Relay Server)

| Variable | Default | Description |
|----------|---------|-------------|
| SERVER_PORT | 8080 | HTTP/WebSocket port |

## Project Structure

```
tmux-remote-system/
├── relay-spring/       # Relay server (Spring Boot WebSocket)
├── agent-spring/       # Host agent (Spring Boot CLI)
├── web-react/          # Web UI (React + xterm.js)
└── docs/               # Additional documentation
```

## Protocol

Messages are JSON over WebSocket:

### Host → Relay
```json
{"type": "register", "role": "host", "session": "machine/session", "label": "session", "machineId": "machine"}
{"type": "screen", "session": "machine/session", "payload": "<base64-encoded-terminal-output>"}
```

### Viewer → Relay
```json
{"type": "register", "role": "viewer", "session": "machine/session"}
{"type": "keys", "session": "machine/session", "payload": "ls -la\n"}
{"type": "listSessions"}
```

### Relay → Viewer
```json
{"type": "sessionList", "sessions": [...]}
{"type": "screen", "session": "machine/session", "payload": "<base64>"}
{"type": "sessionStatus", "session": "machine/session", "status": "online|offline"}
```

## Development

### Build All

```bash
# Relay
cd relay-spring && mvn package

# Agent
cd agent-spring && mvn package

# Web UI
cd web-react && npm run build
```

### Run Tests

```bash
cd relay-spring && mvn test
cd agent-spring && mvn test
cd web-react && npm test
```

## License

MIT
