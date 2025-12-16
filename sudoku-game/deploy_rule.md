# Sudoku-Game 배포 및 실행 가이드

## 목차
1. [게임 규칙 및 특징](#게임-규칙-및-특징)
2. [프로젝트 구조](#프로젝트-구조)
3. [기술 스택](#기술-스택)
4. [로컬 개발 환경 설정](#로컬-개발-환경-설정)
5. [Backend 실행](#backend-실행)
6. [Frontend 실행](#frontend-실행)
7. [프로덕션 배포](#프로덕션-배포)
8. [API 엔드포인트](#api-엔드포인트)
9. [데이터베이스 설정](#데이터베이스-설정)
10. [Git 및 GitHub 관리](#git-및-github-관리)
11. [트러블슈팅](#트러블슈팅)

---

## 게임 규칙 및 특징

### 핵심 컨셉

이 게임의 가장 큰 특징은 **"함께 푸는 퍼즐"** 입니다. 혼자 푸는 것이 아니라, 같은 시간대에 다른 플레이어들이 퍼즐을 푸는 모습을 실시간으로 볼 수 있습니다.

### 게임 플로우

```
┌─────────────────────────────────────────────────────────────────┐
│  1. 게임 선택                                                    │
│     ├─ 오늘 플레이 가능한 게임 확인                                │
│     └─ 이미 플레이한 게임은 "완료" 표시                            │
├─────────────────────────────────────────────────────────────────┤
│  2. 게임 시작 전                                                 │
│     └─ 게임 규칙 화면 표시 (How to Play)                          │
├─────────────────────────────────────────────────────────────────┤
│  3. 게임 진행 중                                                 │
│     ├─ 퍼즐 풀이                                                 │
│     ├─ 실시간 고스트 표시 (다른 플레이어 진행 상황)                  │
│     ├─ 타이머 & 실수 카운트                                       │
│     └─ 완료 시 점수 계산                                          │
├─────────────────────────────────────────────────────────────────┤
│  4. 게임 완료 후                                                 │
│     ├─ 내 점수 & 순위 표시                                        │
│     └─ 오늘의 랭킹 (1~5위) 표시                                   │
├─────────────────────────────────────────────────────────────────┤
│  5. 이미 완료한 게임 재방문 시                                     │
│     └─ 오늘의 랭킹 (1~5위) 바로 표시                               │
└─────────────────────────────────────────────────────────────────┘
```

### 일일 게임 제한

| 규칙 | 설명 |
|------|------|
| **하루 1게임** | 각 퍼즐 타입당 하루에 1번만 플레이 가능 |
| **리셋 시간** | 매일 자정(00:00) 기준으로 초기화 |
| **재도전 불가** | 한 번 완료한 게임은 당일 재도전 불가 |

### 실시간 고스트 시스템

이 게임의 핵심 차별점인 **고스트 시스템**은 다른 플레이어의 진행 상황을 실시간으로 보여줍니다.

#### 고스트 표시 방식

| 게임 | 고스트 표현 |
|------|------------|
| **Sudoku** | 다른 플레이어가 숫자를 입력한 셀에 이모티콘/아바타 표시 |
| **Streams** | 다른 플레이어가 연결한 경로가 반투명하게 표시 |
| **Hitori** | 다른 플레이어가 마킹한 셀에 표시 |
| **Nurikabe** | 다른 플레이어가 칠한 영역이 다른 색상으로 표시 |

#### 고스트 시스템 특징

- 실시간으로 다른 플레이어의 진행 상황 확인
- 경쟁심 유발 및 긴장감 조성
- 다른 플레이어의 풀이 방식 참고 가능
- 힌트 역할도 수행 (단, 틀린 답도 보일 수 있음)

```
예시: Sudoku 게임 화면

┌───┬───┬───┬───┬───┬───┐
│ 5 │ 3 │😀│ 6 │ 9 │ 8 │  ← 😀: 다른 플레이어가 입력한 위치
├───┼───┼───┼───┼───┼───┤
│ 6 │😎│ 2 │ 1 │ 5 │ 3 │  ← 😎: 또 다른 플레이어
├───┼───┼───┼───┼───┼───┤
│ 1 │ 9 │ 8 │ 3 │ 4 │ 2 │
├───┼───┼───┼───┼───┼───┤
│ 8 │ 5 │ 9 │ 7 │😀│ 1 │
├───┼───┼───┼───┼───┼───┤
│ 4 │ 2 │ 6 │ 8 │ 5 │😎│
├───┼───┼───┼───┼───┼───┤
│ 7 │ 1 │ 3 │ 9 │ 2 │ 4 │
└───┴───┴───┴───┴───┴───┘
```

### 랭킹 시스템

#### 점수 계산 공식

```
최종 점수 = 기본 점수 - 시간 패널티 - 실수 패널티 + 난이도 보너스
```

| 요소 | 설명 |
|------|------|
| **기본 점수** | 퍼즐 완료 시 기본 1000점 |
| **시간 패널티** | 소요 시간에 비례하여 감점 |
| **실수 패널티** | 틀린 횟수 × 50점 감점 |
| **난이도 보너스** | Easy: 0, Medium: +100, Hard: +200 |

#### 랭킹 표시

- 게임 완료 후 **1~5위** 리더보드 표시
- 자신의 순위 하이라이트
- 이미 완료한 게임 재방문 시에도 랭킹 확인 가능

### 지원 게임 종류

| 게임 | 설명 | 그리드 |
|------|------|--------|
| **Sudoku** | 숫자 배치 퍼즐 (중복 없이 채우기) | 6×6 |
| **Streams** | 1부터 순서대로 숫자 연결하기 | 가변 |
| **Hitori** | 중복 숫자를 검게 칠해 제거하기 | 가변 |
| **Nurikabe** | 섬과 바다를 구분하기 | 가변 |

### 난이도 및 제한 시간

| 난이도 | 제한 시간 | 특징 |
|--------|----------|------|
| **Easy** | 5분 | 많은 힌트, 적은 빈 칸 |
| **Medium** | 4분 | 중간 난이도 |
| **Hard** | 3분 | 적은 힌트, 많은 빈 칸 |

### 실수 규칙

- 최대 **3회** 실수 허용
- 3회 초과 시 게임 오버
- 실수 시 화면에 경고 표시

---

## 프로젝트 구조

```
sudoku-game/
├── backend/                    # Spring Boot REST API
│   ├── pom.xml                # Maven 설정
│   └── src/main/java/com/sudoku/
│       ├── SudokuBattleApplication.java  # 메인 애플리케이션
│       ├── config/            # 설정 (CORS 등)
│       ├── controller/        # REST 엔드포인트
│       ├── service/           # 비즈니스 로직
│       ├── entity/            # JPA 엔티티
│       ├── repository/        # 데이터 접근 계층
│       └── dto/               # 데이터 전송 객체
├── frontend/                   # 정적 웹 클라이언트
│   ├── index.html             # 메인 페이지
│   ├── styles.css             # 스타일시트
│   ├── game.js                # 메인 게임 로직
│   ├── sudoku.js              # 스도쿠 게임
│   ├── streams.js             # 스트림즈 게임
│   ├── hitori.js              # 히토리 게임
│   └── nurikabe.js            # 누리카베 게임
└── docs/
    └── GAME_DESIGN_DOCUMENT.md
```

---

## 기술 스택

| 구분 | 기술 | 버전 |
|------|------|------|
| **Backend Framework** | Spring Boot | 3.2.0 |
| **Language** | Java | 17 |
| **ORM** | JPA/Hibernate | - |
| **Database (Dev)** | H2 | - |
| **Database (Prod)** | PostgreSQL | - |
| **Build Tool** | Maven | - |
| **Frontend Rendering** | Pixi.js | 7.3.2 |
| **Frontend Language** | JavaScript (Vanilla) | ES6+ |

---

## 로컬 개발 환경 설정

### 필수 요구사항

- **Java 17** 이상
- **Maven 3.6** 이상
- **Node.js** (선택, 프론트엔드 서버용)
- **Python 3** (선택, 프론트엔드 서버용)

### Java 설치 확인

```bash
java -version
# openjdk version "17.x.x" 이상 필요

mvn -version
# Apache Maven 3.6.x 이상 필요
```

---

## Backend 실행

### 개발 환경 실행

```bash
# 프로젝트 디렉토리로 이동
cd sudoku-game/backend

# 의존성 설치 및 빌드
mvn clean install

# 애플리케이션 실행
mvn spring-boot:run
```

### JAR 파일로 실행

```bash
# JAR 빌드
mvn clean package -DskipTests

# JAR 실행
java -jar target/sudoku-battle-1.0.0.jar
```

### 실행 확인

- **API 서버**: http://localhost:8090
- **H2 콘솔**: http://localhost:8090/h2-console
  - JDBC URL: `jdbc:h2:file:./data/sudoku`
  - Username: `sa`
  - Password: (비어있음)

### 환경 변수 설정 (선택)

```bash
# 포트 변경
java -jar target/sudoku-battle-1.0.0.jar --server.port=8091

# 프로파일 지정
java -jar target/sudoku-battle-1.0.0.jar --spring.profiles.active=prod
```

---

## Frontend 실행

### 방법 1: Python 내장 서버 (권장)

```bash
cd sudoku-game/frontend

# Python 3
python3 -m http.server 8000

# Python 2 (레거시)
python -m SimpleHTTPServer 8000
```

### 방법 2: Node.js http-server

```bash
cd sudoku-game/frontend

# http-server 설치 (최초 1회)
npm install -g http-server

# 서버 실행
http-server -p 8000
```

### 방법 3: npx 사용 (설치 없이)

```bash
cd sudoku-game/frontend
npx http-server -p 8000
```

### 방법 4: Live Server (VS Code)

VS Code에서 `index.html`을 열고 우클릭 → "Open with Live Server"

### 접속 URL

- http://localhost:8000

---

## 프로덕션 배포

### Backend 배포 (Docker)

```dockerfile
# Dockerfile 예시
FROM openjdk:17-jdk-slim
WORKDIR /app
COPY target/sudoku-battle-1.0.0.jar app.jar
EXPOSE 8090
ENTRYPOINT ["java", "-jar", "app.jar"]
```

```bash
# Docker 빌드 및 실행
docker build -t sudoku-backend .
docker run -d -p 8090:8090 --name sudoku-api sudoku-backend
```

### Backend 배포 (PostgreSQL 설정)

`application.yml` 수정:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://${DB_HOST}:5432/${DB_NAME}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
    driver-class-name: org.postgresql.Driver
  jpa:
    hibernate:
      ddl-auto: update
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
```

환경 변수 설정:

```bash
export DB_HOST=your-db-host
export DB_NAME=sudoku_db
export DB_USERNAME=your-username
export DB_PASSWORD=your-password
```

### Frontend 배포

정적 파일이므로 다음 서비스에 배포 가능:

- **Nginx**: `/usr/share/nginx/html`에 파일 복사
- **AWS S3 + CloudFront**: 정적 웹 호스팅
- **Vercel/Netlify**: Git 연동 자동 배포
- **GitHub Pages**: 무료 호스팅

#### Nginx 설정 예시

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/sudoku-game/frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:8090/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## API 엔드포인트

### 게임 관련

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/game/start` | 게임 시작 |
| POST | `/api/game/move` | 이동 기록 |
| POST | `/api/game/complete` | 게임 완료 |
| GET | `/api/game/ghost/{puzzleId}` | 고스트 데이터 조회 |
| GET | `/api/game/leaderboard/{puzzleId}` | 리더보드 조회 |
| GET | `/api/game/puzzle/{puzzleId}` | 퍼즐 상세 조회 |
| GET | `/api/game/daily-status/{playerId}` | 일일 게임 상태 확인 |
| GET | `/api/game/today-ranking` | 오늘의 랭킹 |

### 플레이어 관련

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/player` | 플레이어 생성 |
| GET | `/api/player/{playerId}` | 플레이어 조회 |
| PUT | `/api/player/{playerId}` | 플레이어 수정 |

### 게임별 엔드포인트

- `/api/streams/*` - Streams 게임
- `/api/hitori/*` - Hitori 게임
- `/api/nurikabe/*` - Nurikabe 게임

---

## 데이터베이스 설정

### H2 (개발용)

```yaml
# application.yml
spring:
  datasource:
    url: jdbc:h2:file:./data/sudoku
    driver-class-name: org.h2.Driver
    username: sa
    password:
  h2:
    console:
      enabled: true
      path: /h2-console
```

### PostgreSQL (프로덕션)

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/sudoku_db
    username: sudoku_user
    password: your_password
    driver-class-name: org.postgresql.Driver
```

### 데이터베이스 스키마

JPA `ddl-auto: update` 설정으로 자동 생성됨.

주요 테이블:
- `player` - 플레이어 정보
- `puzzle` - 퍼즐 메타데이터
- `game_session` - 게임 세션
- `move_record` - 이동 기록
- `streams_puzzle` - Streams 퍼즐
- `hitori_puzzle` - Hitori 퍼즐
- `nurikabe_puzzle` - Nurikabe 퍼즐

---

## Git 및 GitHub 관리

### 저장소 정보

| 항목 | 값 |
|------|-----|
| **메인 브랜치** | `main` |
| **원격 저장소** | GitHub |
| **프로젝트 경로** | `tmux-remote-system/sudoku-game` |

### 커밋 방식 (gh CLI 우선)

GitHub CLI (`gh`)를 우선적으로 사용합니다. `gh`는 GitHub과의 통합이 더 원활하고, PR/Issue 관리가 편리합니다.

#### 우선순위

```
1순위: gh (GitHub CLI) - PR, Issue, 릴리즈 등 GitHub 기능 활용
2순위: git - 기본 버전 관리 작업
```

### 기본 Git 워크플로우

#### 1. 변경사항 확인

```bash
# 상태 확인
git status

# 변경 내용 확인
git diff

# 최근 커밋 확인
git log --oneline -10
```

#### 2. 커밋하기

```bash
# 파일 스테이징
git add <파일명>
git add .  # 전체 파일

# 커밋 (HEREDOC 방식 권장)
git commit -m "$(cat <<'EOF'
커밋 메시지 제목

상세 설명 (선택)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

#### 3. 푸시하기

```bash
# 원격 저장소에 푸시
git push origin main

# 새 브랜치 푸시 (업스트림 설정)
git push -u origin feature/새기능
```

### GitHub CLI (gh) 사용법

#### 설치 및 인증

```bash
# macOS 설치
brew install gh

# 인증
gh auth login
```

#### PR 생성 (권장 방식)

```bash
# PR 생성 (대화형)
gh pr create

# PR 생성 (옵션 지정)
gh pr create --title "PR 제목" --body "$(cat <<'EOF'
## Summary
- 변경사항 1
- 변경사항 2

## Test plan
- [ ] 테스트 항목 1
- [ ] 테스트 항목 2

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"

# draft PR 생성
gh pr create --draft --title "WIP: 기능 개발 중"
```

#### PR 관리

```bash
# PR 목록 확인
gh pr list

# PR 상세 보기
gh pr view <PR번호>

# PR 체크아웃 (로컬에서 테스트)
gh pr checkout <PR번호>

# PR 머지
gh pr merge <PR번호>

# PR 코멘트 확인
gh api repos/{owner}/{repo}/pulls/<PR번호>/comments
```

#### Issue 관리

```bash
# Issue 생성
gh issue create --title "버그: 문제 설명" --body "상세 내용"

# Issue 목록
gh issue list

# Issue 닫기
gh issue close <Issue번호>
```

#### 릴리즈 관리

```bash
# 릴리즈 생성
gh release create v1.0.0 --title "v1.0.0" --notes "릴리즈 노트"

# 릴리즈 목록
gh release list
```

### 브랜치 전략

```
main (프로덕션)
  │
  ├── develop (개발 통합)
  │     │
  │     ├── feature/기능명 (기능 개발)
  │     ├── fix/버그명 (버그 수정)
  │     └── hotfix/긴급수정 (긴급 패치)
  │
  └── release/v1.x.x (릴리즈 준비)
```

#### 브랜치 명명 규칙

| 타입 | 패턴 | 예시 |
|------|------|------|
| 기능 | `feature/기능명` | `feature/ghost-system` |
| 버그 | `fix/버그명` | `fix/ranking-display` |
| 핫픽스 | `hotfix/설명` | `hotfix/login-error` |
| 릴리즈 | `release/버전` | `release/v1.2.0` |

### 커밋 메시지 컨벤션

```
<타입>: <제목>

[본문 - 선택]

[푸터 - 선택]
```

#### 타입 종류

| 타입 | 설명 |
|------|------|
| `feat` | 새로운 기능 추가 |
| `fix` | 버그 수정 |
| `docs` | 문서 수정 |
| `style` | 코드 포맷팅 (기능 변화 없음) |
| `refactor` | 코드 리팩토링 |
| `test` | 테스트 추가/수정 |
| `chore` | 빌드, 설정 파일 수정 |

#### 예시

```bash
git commit -m "$(cat <<'EOF'
feat: 고스트 시스템 실시간 동기화 추가

- WebSocket을 통한 실시간 데이터 전송
- 플레이어별 아바타 이모티콘 표시
- 5초 간격 자동 동기화

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

### 자주 사용하는 명령어 모음

```bash
# === 상태 확인 ===
git status                      # 현재 상태
git log --oneline -5           # 최근 5개 커밋
git branch -a                   # 모든 브랜치

# === 브랜치 작업 ===
git checkout -b feature/새기능  # 새 브랜치 생성 및 이동
git checkout main              # main 브랜치로 이동
git merge feature/새기능       # 브랜치 머지

# === 원격 동기화 ===
git fetch origin               # 원격 변경사항 가져오기
git pull origin main           # 원격에서 pull
git push origin main           # 원격으로 push

# === gh CLI ===
gh pr create                   # PR 생성
gh pr list                     # PR 목록
gh pr merge                    # PR 머지
gh issue create                # Issue 생성
gh repo view --web             # 브라우저에서 저장소 열기
```

### .gitignore 권장 설정

```gitignore
# Backend
target/
*.jar
*.class
.idea/
*.iml

# Database
*.db
data/

# Frontend
node_modules/

# OS
.DS_Store
Thumbs.db

# Environment
.env
*.local

# Logs
*.log
logs/
```

---

## 트러블슈팅

### 포트 충돌

```bash
# 8090 포트 사용 중인 프로세스 확인
lsof -i :8090

# 프로세스 종료
kill -9 <PID>
```

### CORS 에러

`CorsConfig.java`에서 허용 origin 확인:

```java
@Bean
public WebMvcConfigurer corsConfigurer() {
    return new WebMvcConfigurer() {
        @Override
        public void addCorsMappings(CorsRegistry registry) {
            registry.addMapping("/api/**")
                .allowedOrigins("*")  // 프로덕션에서는 특정 도메인으로 제한
                .allowedMethods("GET", "POST", "PUT", "DELETE");
        }
    };
}
```

### H2 콘솔 접속 불가

`application.yml` 확인:

```yaml
spring:
  h2:
    console:
      enabled: true
      settings:
        web-allow-others: true  # 원격 접속 허용 (개발용)
```

### 빌드 실패

```bash
# Maven 캐시 정리
mvn clean
rm -rf ~/.m2/repository

# 재빌드
mvn clean install -U
```

### Frontend API 연결 실패

`game.js`에서 API URL 확인:

```javascript
const API_BASE = 'http://localhost:8090/api';
// 프로덕션에서는 실제 서버 URL로 변경
```

---

## 빠른 시작 스크립트

### start-dev.sh (개발용)

```bash
#!/bin/bash

# Backend 시작 (백그라운드)
cd backend
mvn spring-boot:run &
BACKEND_PID=$!

# Frontend 시작
cd ../frontend
python3 -m http.server 8000 &
FRONTEND_PID=$!

echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Backend: http://localhost:8090"
echo "Frontend: http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop all servers"

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
```

### stop-dev.sh (개발용)

```bash
#!/bin/bash

# 8090 포트 (Backend) 종료
lsof -ti:8090 | xargs kill -9 2>/dev/null

# 8000 포트 (Frontend) 종료
lsof -ti:8000 | xargs kill -9 2>/dev/null

echo "All servers stopped."
```

---

## 참고 사항

- 프로덕션 배포 시 CORS 설정을 특정 도메인으로 제한할 것
- H2는 개발용, 프로덕션에서는 PostgreSQL 사용 권장
- 일일 게임 제한: 플레이어당 퍼즐당 1회
- 게임 서버 포트: 8090 (변경 가능)
