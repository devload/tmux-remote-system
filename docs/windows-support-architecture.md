# SessionCast Windows Support Architecture

## Overview

Windows에서 TMUX를 사용하기 위해 **itmux** (Cygwin + TMUX 번들)를 사용합니다.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      SessionCast Agent                          │
│                    (Java Spring Boot)                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐                    │
│  │ TmuxExecutor    │    │ TmuxExecutor    │                    │
│  │   (Unix)        │    │   (Windows)     │                    │
│  │                 │    │                 │                    │
│  │ ProcessBuilder  │    │ ProcessBuilder  │                    │
│  │ "tmux", "..."   │    │ "cmd", "/c",    │                    │
│  │                 │    │ "itmux\\bin\\   │                    │
│  │                 │    │  tmux.exe"      │                    │
│  └────────┬────────┘    └────────┬────────┘                    │
│           │                      │                              │
│           └──────────┬───────────┘                              │
│                      │                                          │
│           ┌──────────▼──────────┐                               │
│           │  TmuxSessionHandler │                               │
│           │  (Platform Agnostic)│                               │
│           └─────────────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Relay Server                               │
└─────────────────────────────────────────────────────────────────┘
```

## itmux Structure

```
itmux/
├── bin/
│   ├── tmux.exe          # TMUX 실행 파일
│   ├── cygwin1.dll       # Cygwin 런타임
│   ├── mintty.exe        # 터미널 에뮬레이터 (선택)
│   └── ...               # 기타 의존성
├── etc/
│   └── ...               # 설정 파일
├── tmp/                  # 임시 파일
├── tmux.cmd              # 시작 스크립트
└── STARTER_GUIDE.md
```

## Implementation Plan

### 1. TmuxExecutor Interface

```java
public interface TmuxExecutor {
    List<String> listSessions();
    String capturePane(String session);
    void sendKeys(String session, String keys);
    void sendSpecialKey(String session, String key);
    void resizeWindow(String session, int cols, int rows);
    void killSession(String session);
    void createSession(String session, String workingDir);
}
```

### 2. Unix Implementation (Existing)

```java
public class UnixTmuxExecutor implements TmuxExecutor {
    @Override
    public List<String> listSessions() {
        ProcessBuilder pb = new ProcessBuilder("tmux", "ls", "-F", "#{session_name}");
        // ...
    }
}
```

### 3. Windows Implementation (New)

```java
public class WindowsTmuxExecutor implements TmuxExecutor {
    private final String itmuxPath;  // e.g., "C:\\itmux"

    @Override
    public List<String> listSessions() {
        // itmux requires running through Cygwin environment
        ProcessBuilder pb = new ProcessBuilder(
            itmuxPath + "\\bin\\bash.exe", "-l", "-c",
            "tmux ls -F '#{session_name}'"
        );
        // Set Cygwin environment
        pb.environment().put("CYGWIN", "nodosfilewarning");
        pb.environment().put("HOME", "/home/" + System.getProperty("user.name"));
        // ...
    }
}
```

### 4. Factory Pattern

```java
@Component
public class TmuxExecutorFactory {
    public TmuxExecutor create() {
        if (isWindows()) {
            String itmuxPath = findItmuxPath();
            return new WindowsTmuxExecutor(itmuxPath);
        }
        return new UnixTmuxExecutor();
    }

    private boolean isWindows() {
        return System.getProperty("os.name").toLowerCase().contains("win");
    }

    private String findItmuxPath() {
        // 1. Check environment variable
        String envPath = System.getenv("ITMUX_HOME");
        if (envPath != null) return envPath;

        // 2. Check common locations
        String[] locations = {
            System.getProperty("user.home") + "\\itmux",
            "C:\\itmux",
            System.getProperty("user.dir") + "\\itmux"
        };
        for (String loc : locations) {
            if (new File(loc + "\\bin\\tmux.exe").exists()) {
                return loc;
            }
        }
        throw new RuntimeException("itmux not found. Please install itmux.");
    }
}
```

## Configuration

### agent-config.yml

```yaml
# Platform-specific settings
platform:
  # Windows-only settings
  windows:
    # Path to itmux installation
    itmuxPath: "C:\\itmux"
    # Use ConPTY for native terminal (future)
    useConPty: false
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ITMUX_HOME` | Path to itmux installation | Auto-detect |
| `SESSIONCAST_SHELL` | Shell to use in sessions | `bash` (itmux) / `$SHELL` (Unix) |

## Known Limitations

1. **Performance**: Cygwin layer adds overhead (~10-20ms per command)
2. **Path Translation**: Windows paths need to be converted to Unix paths for itmux
3. **Signal Handling**: Ctrl+C/Ctrl+D behavior may differ slightly
4. **Color Support**: 256 colors supported, true color may have issues

## Future Improvements

1. **Native ConPTY Support**: For sessions that don't need tmux features
2. **Hybrid Mode**: Use ConPTY for simple sessions, itmux for multi-window
3. **WezTerm Integration**: Alternative multiplexer with native Windows support

## Installation Guide (Windows)

```powershell
# 1. Download itmux
Invoke-WebRequest -Uri "https://github.com/itefixnet/itmux/releases/latest/download/itmux.zip" -OutFile "itmux.zip"

# 2. Extract to C:\itmux
Expand-Archive -Path "itmux.zip" -DestinationPath "C:\itmux"

# 3. Set environment variable
[System.Environment]::SetEnvironmentVariable("ITMUX_HOME", "C:\itmux", "User")

# 4. Verify installation
C:\itmux\bin\bash.exe -l -c "tmux -V"
```

## Testing

```powershell
# Test session creation
C:\itmux\bin\bash.exe -l -c "tmux new-session -d -s test-session"

# Test session listing
C:\itmux\bin\bash.exe -l -c "tmux ls"

# Test capture
C:\itmux\bin\bash.exe -l -c "tmux capture-pane -t test-session -p"

# Cleanup
C:\itmux\bin\bash.exe -l -c "tmux kill-session -t test-session"
```
