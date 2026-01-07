# SessionCast Deploy Skill

이 스킬은 SessionCast 서비스를 OTE 또는 Production 환경에 배포합니다.

## Usage

```
/deploy <environment> <service> [options]
```

## Environments

| 환경 | 설명 | 호스트 |
|------|------|--------|
| `ote` | 개발 테스트 서버 | 43.200.173.78 |
| `production` | 운영 서버 (AWS) | ECS/S3/CloudFront |

## Services

| 서비스 | 설명 | 타입 |
|--------|------|------|
| `web` | 프론트엔드 | React (Static) |
| `relay` | 릴레이 서버 | Spring Boot |
| `agent` | 에이전트 | Node.js |
| `platform` | 플랫폼 API | Spring Boot |
| `all` | 전체 배포 | - |
| `status` | 상태 확인 | - |

## Examples

```bash
# OTE에 웹 배포
/deploy ote web

# OTE에 릴레이 배포 (로컬 빌드)
/deploy ote relay --build

# OTE 상태 확인
/deploy ote status

# 전체 배포
/deploy ote all

# Production 웹 배포
/deploy production web
```

## Instructions for Claude

When the user invokes this skill:

1. Parse the environment and service from the arguments
2. Validate the inputs
3. Execute the appropriate deployment command using the deploy.sh script
4. Monitor the output and report status
5. Handle any errors gracefully

### Deployment Script Location

```
/Users/devload/remoteClaudeCodeWorkSpace/tmux-remote-system/deploy/scripts/deploy.sh
```

### OTE Server Details

- **Host**: 43.200.173.78
- **User**: ec2-user
- **SSH Key**: ~/.ssh/id_rsa

### Service Paths on OTE

| Service | Path |
|---------|------|
| Web | /home/ec2-user/sessioncast-web |
| Relay | /home/ec2-user/sessioncast-relay |
| Agent | /home/ec2-user/sessioncast-cli |
| Platform | /home/ec2-user/sessioncast-platform |

### Common Deployment Tasks

1. **Check Status First**
   ```bash
   ./deploy/scripts/deploy.sh ote status
   ```

2. **Deploy Single Service**
   ```bash
   ./deploy/scripts/deploy.sh ote <service>
   ```

3. **Deploy with Local Build**
   ```bash
   ./deploy/scripts/deploy.sh ote <service> --build
   ```

4. **Verify After Deployment**
   - Check service logs
   - Test endpoints
   - Verify WebSocket connections

### Error Handling

If deployment fails:
1. Check SSH connectivity
2. Verify service logs on server
3. Check disk space and memory
4. Rollback if necessary

### Post-Deployment Verification

After deploying to OTE:
- Web: https://ote.sessioncast.io (or http://43.200.173.78)
- Relay WebSocket: ws://43.200.173.78:8080/ws
- Platform API: http://43.200.173.78:8081
