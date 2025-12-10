# Mobile App Design Specification

## Overview

The mobile app provides the same functionality as the web UI, optimized for mobile devices.

## Technology Options

- **React Native**: Cross-platform, JavaScript/TypeScript
- **Flutter**: Cross-platform, Dart

## Screens

### Screen 1: Session List

```
┌─────────────────────────────────────┐
│  ≡  TMUX Remote              ⟳  ⚙  │
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────────┐  │
│  │ 🖥️ HOME                       │  │
│  ├───────────────────────────────┤  │
│  │ 🟢 Home · Work               >│  │
│  │ 🟢 Home · Play               >│  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ 🖥️ OFFICE                     │  │
│  ├───────────────────────────────┤  │
│  │ 🟢 Office · Dev              >│  │
│  │ 🔴 Office · Build (Offline)  >│  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ 🖥️ SERVER                     │  │
│  ├───────────────────────────────┤  │
│  │ 🟢 Server · Main             >│  │
│  └───────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

#### Components

- **Header**: App title, refresh button, settings button
- **Machine Groups**: Collapsible sections grouped by machineId
- **Session Cards**:
  - Status indicator (green/red dot)
  - Session label
  - Navigation arrow
- **Pull-to-refresh**: Refresh session list

### Screen 2: Terminal View

```
┌─────────────────────────────────────┐
│  ←  Home · Work          🟢 Online │
├─────────────────────────────────────┤
│                                     │
│  user@home:~$ ls -la                │
│  total 32                           │
│  drwxr-xr-x  5 user user 4096 ...  │
│  drwxr-xr-x  3 user user 4096 ...  │
│  -rw-r--r--  1 user user  220 ...  │
│  -rw-r--r--  1 user user 3771 ...  │
│  user@home:~$ _                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ [ls] [git status] [Ctrl+C] [clear] │
├─────────────────────────────────────┤
│ ┌───────────────────────┐  ┌────┐  │
│ │ Enter command...      │  │Send│  │
│ └───────────────────────┘  └────┘  │
└─────────────────────────────────────┘
```

#### Components

- **Header**: Back button, session label, status indicator
- **Terminal Area**:
  - Scrollable terminal output
  - Monospace font
  - ANSI color support
- **Quick Commands Bar**:
  - Horizontal scrollable
  - Customizable buttons
- **Command Input**:
  - Text input field
  - Send button
  - Keyboard extension for special keys

## Navigation Flow

```
┌──────────────┐     tap session     ┌──────────────┐
│              │ ─────────────────> │              │
│ Session List │                    │ Terminal View│
│              │ <───────────────── │              │
└──────────────┘     back button     └──────────────┘
```

## Data Flow

```
┌─────────────┐
│  App State  │
├─────────────┤
│ - sessions  │
│ - current   │
│ - wsStatus  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│          WebSocket Manager          │
├─────────────────────────────────────┤
│ - connect()                         │
│ - disconnect()                      │
│ - send(message)                     │
│ - onMessage(callback)               │
│ - autoReconnect                     │
└─────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│           Relay Server              │
└─────────────────────────────────────┘
```

## WebSocket Integration

```typescript
// React Native example
import { useState, useEffect, useRef } from 'react';

function useWebSocket(url: string) {
  const [status, setStatus] = useState('disconnected');
  const [sessions, setSessions] = useState([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      setStatus('connected');
      ws.send(JSON.stringify({ type: 'listSessions' }));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      // Handle messages...
    };

    ws.onclose = () => {
      setStatus('disconnected');
      // Reconnect logic...
    };

    wsRef.current = ws;
    return () => ws.close();
  }, [url]);

  return { status, sessions, ws: wsRef.current };
}
```

## Terminal Rendering

### React Native Options

1. **react-native-terminal-component**: Basic terminal emulation
2. **Custom View with Text**: Manual ANSI parsing
3. **WebView with xterm.js**: Full xterm.js support

### Flutter Options

1. **flutter_terminal**: Terminal widget
2. **Custom Widget**: Parse ANSI and render

## Quick Commands Configuration

```json
{
  "quickCommands": [
    { "label": "ls", "command": "ls -la\n" },
    { "label": "git status", "command": "git status\n" },
    { "label": "Ctrl+C", "command": "\u0003" },
    { "label": "Ctrl+D", "command": "\u0004" },
    { "label": "clear", "command": "clear\n" }
  ]
}
```

## Settings Screen

```
┌─────────────────────────────────────┐
│  ←  Settings                        │
├─────────────────────────────────────┤
│                                     │
│  CONNECTION                         │
│  ┌───────────────────────────────┐  │
│  │ Relay Server URL              │  │
│  │ ws://relay.example.com/ws     │  │
│  └───────────────────────────────┘  │
│                                     │
│  DISPLAY                            │
│  ┌───────────────────────────────┐  │
│  │ Font Size              14     │  │
│  │ Theme                  Dark  >│  │
│  └───────────────────────────────┘  │
│                                     │
│  QUICK COMMANDS                     │
│  ┌───────────────────────────────┐  │
│  │ Customize Commands           >│  │
│  └───────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

## Offline Support

- Cache session list locally
- Show last known status with timestamp
- Queue commands when offline (optional)
- Auto-reconnect on network restore

## Security

- Secure storage for server URL
- Optional PIN/biometric lock
- Clear terminal history option
- Certificate pinning for TLS

## Accessibility

- VoiceOver/TalkBack support
- Dynamic type support
- High contrast mode
- Keyboard navigation
