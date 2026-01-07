# SessionCast Deployment

SessionCast 서비스 배포를 위한 스크립트 및 설정입니다.

## 구조

```
deploy/
├── README.md
├── config/
│   └── environments.yml    # 환경 설정
└── scripts/
    └── deploy.sh          # 배포 스크립트
```

## 빠른 시작

### OTE 상태 확인
```bash
./scripts/deploy.sh ote status
```

### OTE 배포
```bash
# 웹 배포
./scripts/deploy.sh ote web

# 릴레이 배포
./scripts/deploy.sh ote relay

# 에이전트 배포
./scripts/deploy.sh ote agent

# 전체 배포
./scripts/deploy.sh ote all
```

### Production 배포
```bash
# 웹 배포 (S3 + CloudFront)
./scripts/deploy.sh production web

# 릴레이 배포 (ECS)
./scripts/deploy.sh production relay
```

## 환경

### OTE (개발 테스트 서버)

| 항목 | 값 |
|------|-----|
| Host | 43.200.173.78 |
| User | ec2-user |
| Web | http://43.200.173.78 |
| Relay | ws://43.200.173.78:8080/ws |
| Platform | http://43.200.173.78:8081 |

### Production (AWS)

| 서비스 | 도메인 | 호스팅 |
|--------|--------|--------|
| Web | app.sessioncast.io | S3 + CloudFront |
| Relay | relay.sessioncast.io | ECS |
| Platform | api.sessioncast.io | ECS |

## 배포 옵션

| 옵션 | 설명 |
|------|------|
| `--build` | 로컬에서 빌드 후 서버에 업로드 |
| `--dry-run` | 실제 배포 없이 계획만 표시 |

## Claude Code 통합

Claude Code에서 `/deploy` 커맨드로 배포할 수 있습니다:

```
/deploy ote web
/deploy ote status
/deploy production web
```

## SSH 설정

OTE 서버 접속을 위해 SSH 키가 필요합니다:

```bash
# SSH 키 확인
ls -la ~/.ssh/id_rsa

# 또는 환경 변수로 지정
export OTE_SSH_KEY=~/.ssh/your-key.pem
```

## 트러블슈팅

### SSH 연결 실패
```bash
# 연결 테스트
ssh -i ~/.ssh/id_rsa ec2-user@43.200.173.78 "echo OK"

# 권한 확인
chmod 600 ~/.ssh/id_rsa
```

### 서비스 로그 확인
```bash
# Relay 로그
ssh ec2-user@43.200.173.78 "journalctl -u sessioncast-relay -f"

# Agent 로그
ssh ec2-user@43.200.173.78 "pm2 logs sessioncast-agent"

# Nginx 로그
ssh ec2-user@43.200.173.78 "sudo tail -f /var/log/nginx/error.log"
```

### 서비스 수동 재시작
```bash
# Relay
ssh ec2-user@43.200.173.78 "sudo systemctl restart sessioncast-relay"

# Agent
ssh ec2-user@43.200.173.78 "pm2 restart sessioncast-agent"

# Nginx
ssh ec2-user@43.200.173.78 "sudo systemctl restart nginx"
```

## 배포 워크플로우

### 일반적인 배포 순서

1. **상태 확인**
   ```bash
   ./scripts/deploy.sh ote status
   ```

2. **백엔드 배포**
   ```bash
   ./scripts/deploy.sh ote relay
   ./scripts/deploy.sh ote platform
   ```

3. **프론트엔드 배포**
   ```bash
   ./scripts/deploy.sh ote web
   ```

4. **검증**
   - 웹 UI 확인
   - WebSocket 연결 테스트
   - API 호출 테스트

### 롤백

현재 자동 롤백은 미지원. 수동으로 이전 버전 배포 필요.

```bash
# Git으로 이전 버전 체크아웃 후 배포
git checkout <previous-commit>
./scripts/deploy.sh ote <service> --build
```
