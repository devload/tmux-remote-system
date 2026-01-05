# SessionCast Windows Installer

Windows용 SessionCast Agent 올인원 설치 프로그램입니다.

## 포함 구성요소

| 구성요소 | 버전 | 용도 |
|---------|------|------|
| SessionCast Agent | 1.0.0 | 터미널 스트리밍 에이전트 |
| itmux | latest | Windows용 tmux (Cygwin 번들) |
| Java (Temurin) | 17 LTS | Java Agent 런타임 |
| Node.js | 20 LTS | Node Agent 런타임 |

## 설치 방법

### 방법 1: PowerShell 스크립트 (권장)

```powershell
# 관리자 권한으로 PowerShell 실행 후:
Set-ExecutionPolicy Bypass -Scope Process -Force
irm https://raw.githubusercontent.com/user/sessioncast/main/installer/windows/install.ps1 | iex
```

또는 로컬 실행:
```powershell
.\install.ps1
```

### 방법 2: GUI 설치 프로그램

`SessionCast-Setup.exe` 다운로드 후 실행

## 설치 옵션

```powershell
# Java Agent만 설치
.\install.ps1 -AgentType java

# Node Agent만 설치
.\install.ps1 -AgentType node

# 전체 설치 (기본값)
.\install.ps1 -AgentType all

# 설치 경로 지정
.\install.ps1 -InstallPath "D:\SessionCast"

# 자동 설치 (프롬프트 없음)
.\install.ps1 -Silent
```

## 설치 디렉토리 구조

```
C:\SessionCast\
├── bin\
│   ├── sessioncast-agent.jar      # Java Agent
│   ├── sessioncast-agent.cmd      # Java Agent 실행 스크립트
│   ├── sessioncast-node.cmd       # Node Agent 실행 스크립트
│   └── uninstall.cmd              # 제거 스크립트
├── itmux\                         # tmux + Cygwin 번들
│   ├── bin\
│   │   ├── bash.exe
│   │   ├── tmux.exe
│   │   └── ...
│   └── ...
├── java\                          # Embedded Java Runtime (선택)
│   └── jdk-17\
├── node\                          # Embedded Node.js (선택)
│   └── node-v20\
├── config\
│   └── agent-config.yml           # 에이전트 설정
└── logs\                          # 로그 디렉토리
```

## 환경 변수

설치 시 자동 설정되는 환경 변수:

| 변수 | 값 | 설명 |
|------|-----|------|
| `SESSIONCAST_HOME` | `C:\SessionCast` | 설치 루트 경로 |
| `ITMUX_HOME` | `C:\SessionCast\itmux` | itmux 경로 |
| `PATH` | `+C:\SessionCast\bin` | 실행 파일 경로 추가 |

## 시스템 요구사항

- Windows 10 (1809) 이상 또는 Windows Server 2019 이상
- 최소 500MB 디스크 공간
- 인터넷 연결 (설치 시)

## 문제 해결

### itmux가 시작되지 않음
```powershell
# Cygwin DLL 확인
C:\SessionCast\itmux\bin\cygcheck.exe -c
```

### Java Agent 실행 오류
```powershell
# Java 버전 확인
C:\SessionCast\java\jdk-17\bin\java.exe -version
```

### 방화벽 설정
WebSocket 연결을 위해 아웃바운드 포트 443, 8080 허용 필요

## 제거

```powershell
# 프로그램 제거
C:\SessionCast\bin\uninstall.cmd

# 또는 수동 제거
Remove-Item -Recurse -Force C:\SessionCast
[Environment]::SetEnvironmentVariable("SESSIONCAST_HOME", $null, "User")
```
