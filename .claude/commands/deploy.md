# /deploy - SessionCast 배포 커맨드

OTE 또는 Production 환경에 SessionCast 서비스를 배포합니다.

## 사용법

```
/deploy <환경> <서비스> [옵션]
```

## 환경

- `ote` - 개발 테스트 서버 (43.200.173.78)
- `prod` / `production` - 운영 서버 (AWS)

## 서비스

- `web` - 프론트엔드 (React)
- `relay` - 릴레이 서버 (Spring Boot WebSocket)
- `agent` - 에이전트 (Node.js)
- `platform` - 플랫폼 API (Spring Boot)
- `all` - 전체 서비스 배포
- `status` - 서비스 상태 확인

## 옵션

- `--build` - 로컬에서 빌드 후 업로드
- `--dry-run` - 실행하지 않고 계획만 표시

## 예시

```
/deploy ote status      # OTE 상태 확인
/deploy ote web         # OTE에 웹 배포
/deploy ote relay       # OTE에 릴레이 배포
/deploy ote all         # OTE 전체 배포
/deploy prod web        # Production 웹 배포
```

---

## 실행 방법

이 커맨드가 호출되면:

1. 배포 스크립트 위치 확인:
   ```
   /Users/devload/remoteClaudeCodeWorkSpace/tmux-remote-system/deploy/scripts/deploy.sh
   ```

2. 스크립트 실행:
   ```bash
   ./deploy/scripts/deploy.sh <환경> <서비스> [옵션]
   ```

3. 결과 모니터링 및 보고

## OTE 서버 정보

| 항목 | 값 |
|------|-----|
| Host | 43.200.173.78 |
| User | ec2-user |
| SSH Key | ~/.ssh/id_rsa |

## 서비스 경로 (OTE)

| 서비스 | 경로 |
|--------|------|
| Web | /home/ec2-user/sessioncast-web |
| Relay | /home/ec2-user/sessioncast-relay |
| Agent | /home/ec2-user/sessioncast-cli |
| Platform | /home/ec2-user/sessioncast-platform |

## 배포 후 확인

- **Web**: http://43.200.173.78
- **Relay WS**: ws://43.200.173.78:8080/ws
- **Platform API**: http://43.200.173.78:8081

## 트러블슈팅

### SSH 연결 실패
```bash
ssh -i ~/.ssh/id_rsa ec2-user@43.200.173.78
```

### 서비스 로그 확인
```bash
# Relay
ssh ec2-user@43.200.173.78 "journalctl -u sessioncast-relay -f"

# Agent
ssh ec2-user@43.200.173.78 "pm2 logs sessioncast-agent"
```

### 서비스 재시작
```bash
ssh ec2-user@43.200.173.78 "sudo systemctl restart sessioncast-relay"
ssh ec2-user@43.200.173.78 "pm2 restart sessioncast-agent"
```
