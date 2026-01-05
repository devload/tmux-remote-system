# SessionCast macOS Installer

macOS용 SessionCast Agent 올인원 설치 프로그램입니다.

## 포함 구성요소

| 구성요소 | 버전 | 용도 |
|---------|------|------|
| SessionCast Agent | 1.0.0 | 터미널 스트리밍 에이전트 |
| tmux | latest | 터미널 멀티플렉서 (Homebrew) |
| Java (Temurin) | 17 LTS | Java Agent 런타임 |
| Node.js | 20 LTS | Node Agent 런타임 |

## 설치 방법

### 방법 1: 원라인 설치 (권장)

```bash
curl -fsSL https://raw.githubusercontent.com/user/sessioncast/main/installer/macos/install.sh | bash
```

### 방법 2: 로컬 실행

```bash
./install.sh
```

## 설치 옵션

```bash
# Java Agent만 설치
./install.sh --agent-type java

# Node Agent만 설치
./install.sh --agent-type node

# 전체 설치 (기본값)
./install.sh --agent-type all

# 설치 경로 지정
./install.sh --install-path ~/sessioncast

# tmux 설치 건너뛰기 (이미 설치된 경우)
./install.sh --skip-tmux

# 제거
./install.sh --uninstall
```

## 설치 디렉토리 구조

```
/usr/local/sessioncast/
├── bin/
│   ├── sessioncast-agent      # Java Agent 실행 스크립트
│   └── sessioncast-node       # Node Agent 실행 스크립트
├── java/                      # Embedded Java Runtime
│   └── bin/
│       └── java
├── node/                      # Embedded Node.js
│   └── bin/
│       └── node
├── lib/
│   └── sessioncast-agent.jar  # Java Agent JAR
├── config/
│   └── agent-config.yml       # 에이전트 설정
└── logs/                      # 로그 디렉토리
```

## 환경 변수

설치 시 자동 설정되는 환경 변수:

| 변수 | 값 | 설명 |
|------|-----|------|
| `SESSIONCAST_HOME` | `/usr/local/sessioncast` | 설치 루트 경로 |
| `PATH` | `+/usr/local/sessioncast/bin` | 실행 파일 경로 추가 |

## 시스템 요구사항

- macOS 10.15 (Catalina) 이상
- Apple Silicon (M1/M2) 또는 Intel x64
- 최소 500MB 디스크 공간
- 인터넷 연결 (설치 시)

## 아키텍처 지원

| 아키텍처 | 지원 |
|---------|------|
| Apple Silicon (arm64) | ✅ |
| Intel x64 | ✅ |

## 문제 해결

### Homebrew 설치 실패
```bash
# 수동 설치
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### tmux 설치 실패
```bash
brew install tmux
```

### 권한 오류
```bash
# sudo로 실행
sudo ./install.sh
```

### PATH가 적용되지 않음
```bash
# 터미널 재시작 또는
source ~/.zshrc  # zsh 사용시
source ~/.bashrc # bash 사용시
```

## 제거

```bash
# 스크립트로 제거
./install.sh --uninstall

# 또는 수동 제거
sudo rm -rf /usr/local/sessioncast

# 쉘 프로파일에서 SESSIONCAST_HOME 관련 라인 제거
```

## DMG 설치 (GUI)

`SessionCast-Installer.dmg` 파일을 다운로드하여:
1. DMG 파일 더블클릭
2. SessionCast 아이콘을 Applications 폴더로 드래그
3. 터미널에서 `sessioncast-agent` 실행
