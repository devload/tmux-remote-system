package com.tmuxremote.relay.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tmuxremote.relay.controller.InternalApiController;
import com.tmuxremote.relay.dto.Message;
import com.tmuxremote.relay.security.JwtTokenProvider;
import com.tmuxremote.relay.service.AgentTokenService;
import com.tmuxremote.relay.service.PlanLimitService;
import com.tmuxremote.relay.service.RelayAliasService;
import com.tmuxremote.relay.service.SessionManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.net.URI;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
@RequiredArgsConstructor
public class RelayWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper;
    private final SessionManager sessionManager;
    private final AgentTokenService agentTokenService;
    private final JwtTokenProvider jwtTokenProvider;
    private final PlanLimitService planLimitService;
    private final InternalApiController internalApiController;

    // sessionId -> ownerEmail (extracted from token)
    private final Map<String, String> sessionOwnerMap = new ConcurrentHashMap<>();
    // sessionId -> userToken (for plan limit checks)
    private final Map<String, String> sessionTokenMap = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        String alias = (String) session.getAttributes().get("relayAlias");
        String aliasOwner = (String) session.getAttributes().get("aliasOwnerEmail");
        String invalidAlias = (String) session.getAttributes().get("invalidAlias");

        if (invalidAlias != null) {
            log.warn("WebSocket connected with invalid alias: id={}, alias={}, remote={}",
                    session.getId(), invalidAlias, session.getRemoteAddress());
            sendInvalidAliasError(session, invalidAlias);
            return;
        }

        if (alias != null) {
            log.info("WebSocket connected: id={}, alias={}, owner={}, remote={}",
                    session.getId(), alias, aliasOwner, session.getRemoteAddress());
        } else {
            log.info("WebSocket connected: id={}, remote={} (shared relay)",
                    session.getId(), session.getRemoteAddress());
        }
    }

    private void sendInvalidAliasError(WebSocketSession session, String alias) {
        try {
            Message errorMessage = Message.builder()
                    .type("error")
                    .meta(Map.of(
                            "code", "INVALID_RELAY_ALIAS",
                            "messageKo", "유효하지 않은 릴레이 주소입니다: " + alias,
                            "messageEn", "Invalid relay address: " + alias
                    ))
                    .build();

            String json = objectMapper.writeValueAsString(errorMessage);
            synchronized (session) {
                if (session.isOpen()) {
                    session.sendMessage(new TextMessage(json));
                }
            }
            session.close(CloseStatus.POLICY_VIOLATION);
        } catch (IOException e) {
            log.error("Failed to send invalid alias error", e);
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage textMessage) {
        try {
            String payload = textMessage.getPayload();
            Message message = objectMapper.readValue(payload, Message.class);

            log.debug("Received message: type={}, session={}", message.getType(), message.getSession());

            switch (message.getType()) {
                case "register" -> handleRegister(session, message);
                case "screen", "screenGz" -> handleScreen(message);  // Handle both compressed and uncompressed
                case "keys" -> handleKeys(session, message);
                case "resize" -> handleResize(session, message);
                case "listSessions" -> handleListSessions(session);
                case "createSession" -> handleCreateSession(session, message);
                case "sessionCreated" -> handleSessionCreated(message);
                case "killSession" -> handleKillSession(session, message);
                case "api_response" -> handleApiResponse(message);  // Agent API response
                default -> log.warn("Unknown message type: {}", message.getType());
            }
        } catch (Exception e) {
            log.error("Failed to handle message", e);
        }
    }

    private void handleRegister(WebSocketSession session, Message message) {
        String role = message.getRole();
        String sessionId = message.getSession();

        // Get alias info from session attributes (set by HandshakeInterceptor)
        String aliasOwnerEmail = (String) session.getAttributes().get("aliasOwnerEmail");
        String alias = (String) session.getAttributes().get("relayAlias");

        if ("host".equals(role)) {
            Map<String, String> meta = message.getMeta();
            String label = meta != null ? meta.get("label") : sessionId;
            String machineId = meta != null ? meta.get("machineId") : "unknown";
            String agentToken = meta != null ? meta.get("token") : null;
            String agentIdFromMeta = meta != null ? meta.get("agentId") : null;  // Platform agent ID from meta

            // Validate agent token and get owner + agentId
            String ownerEmail = null;
            String agentId = agentIdFromMeta;  // Use from meta first, fallback to token validation
            if (agentToken != null) {
                var agentInfo = agentTokenService.getAgentInfoByToken(agentToken);
                if (agentInfo.isPresent()) {
                    ownerEmail = agentInfo.get().email();
                    // Auto-derive agentId from token if not provided in meta
                    if (agentId == null || agentId.isEmpty()) {
                        agentId = agentInfo.get().agentId();
                    }
                } else {
                    log.warn("Invalid agent token for session: {}", sessionId);
                    // Allow registration but without owner (for backward compatibility)
                }
            }

            // If connecting via user's personal subdomain, verify ownership
            if (alias != null && aliasOwnerEmail != null) {
                if (ownerEmail == null || !ownerEmail.equals(aliasOwnerEmail)) {
                    log.warn("Agent owner mismatch for alias {}: expected={}, got={}",
                            alias, aliasOwnerEmail, ownerEmail);
                    sendOwnerMismatchError(session, alias);
                    return;
                }
            }

            // Check session limit (skip if session is already registered - reconnection)
            if (ownerEmail != null && !sessionManager.isSessionRegistered(sessionId)) {
                int currentSessions = sessionManager.countSessionsByOwner(ownerEmail);
                int maxSessions = planLimitService.getMaxSessionsForUser(ownerEmail);

                // -1 means unlimited
                if (maxSessions != -1 && currentSessions >= maxSessions) {
                    log.warn("Session limit exceeded for user {}: current={}, max={}",
                            ownerEmail, currentSessions, maxSessions);
                    sendLimitExceededError(session, "sessions", currentSessions, maxSessions);
                    return;
                }
            }

            if (ownerEmail != null) {
                sessionOwnerMap.put(session.getId(), ownerEmail);
            }
            sessionManager.registerHost(sessionId, label, machineId, ownerEmail, session);

            // Register agent for API forwarding ONLY if this is the ApiWebSocketClient session
            // ApiWebSocketClient uses session ID format: "api-{agentId}"
            if (agentId != null && !agentId.isEmpty() && sessionId.startsWith("api-")) {
                sessionManager.registerAgent(agentId, session);
                session.getAttributes().put("agentId", agentId);
                log.info("Agent API session registered: agentId={}", agentId);
            }

            log.info("Host registered: session={}, machine={}, owner={}, alias={}, agentId={}",
                    sessionId, machineId, ownerEmail, alias, agentId);

        } else if ("viewer".equals(role)) {
            // Get owner from JWT token (passed as query param)
            String ownerEmail = extractOwnerFromSession(session);
            String userToken = extractTokenFromSession(session);

            // If connecting via user's personal subdomain, viewer must be the alias owner
            if (alias != null && aliasOwnerEmail != null) {
                if (ownerEmail == null || !ownerEmail.equals(aliasOwnerEmail)) {
                    log.warn("Viewer owner mismatch for alias {}: expected={}, got={}",
                            alias, aliasOwnerEmail, ownerEmail);
                    sendOwnerMismatchError(session, alias);
                    return;
                }
            }

            // Check plan limit before allowing viewer to join
            PlanLimitService.PlanCheckResult limitCheck = planLimitService.checkSessionLimit(userToken);
            if (!limitCheck.isAllowed()) {
                log.warn("Session limit exceeded for user: {}", ownerEmail);
                sendPlanLimitError(session, limitCheck);
                return;
            }

            if (ownerEmail != null) {
                sessionOwnerMap.put(session.getId(), ownerEmail);
            }
            if (userToken != null) {
                sessionTokenMap.put(session.getId(), userToken);
            }
            sessionManager.registerViewer(sessionId, ownerEmail, session);
            log.info("Viewer registered: session={}, owner={}, alias={}", sessionId, ownerEmail, alias);
        }
    }

    private void sendOwnerMismatchError(WebSocketSession session, String alias) {
        try {
            Message errorMessage = Message.builder()
                    .type("error")
                    .meta(Map.of(
                            "code", "OWNER_MISMATCH",
                            "messageKo", "이 릴레이 주소(" + alias + ")에 접근 권한이 없습니다.",
                            "messageEn", "You don't have access to this relay address: " + alias
                    ))
                    .build();

            String json = objectMapper.writeValueAsString(errorMessage);
            synchronized (session) {
                if (session.isOpen()) {
                    session.sendMessage(new TextMessage(json));
                }
            }
            session.close(CloseStatus.POLICY_VIOLATION);
        } catch (IOException e) {
            log.error("Failed to send owner mismatch error", e);
        }
    }

    private void handleScreen(Message message) {
        sessionManager.handleScreen(message.getSession(), message.getPayload(), message.getType());
    }

    private void handleKeys(WebSocketSession session, Message message) {
        sessionManager.handleKeys(message.getSession(), message.getPayload(), session);
    }

    private void handleResize(WebSocketSession session, Message message) {
        Map<String, String> meta = message.getMeta();
        if (meta == null) return;

        String colsStr = meta.get("cols");
        String rowsStr = meta.get("rows");
        if (colsStr == null || rowsStr == null) return;

        try {
            int cols = Integer.parseInt(colsStr);
            int rows = Integer.parseInt(rowsStr);
            log.debug("Resize request: session={}, cols={}, rows={}", message.getSession(), cols, rows);
            sessionManager.handleResize(message.getSession(), cols, rows);
        } catch (NumberFormatException e) {
            log.warn("Invalid resize dimensions: cols={}, rows={}", colsStr, rowsStr);
        }
    }

    private void handleListSessions(WebSocketSession session) {
        String ownerEmail = extractOwnerFromSession(session);
        sessionManager.sendSessionList(session, ownerEmail);
    }

    private void handleCreateSession(WebSocketSession session, Message message) {
        String ownerEmail = extractOwnerFromSession(session);
        String machineId = message.getMeta() != null ? message.getMeta().get("machineId") : null;
        String sessionName = message.getMeta() != null ? message.getMeta().get("sessionName") : null;

        if (machineId == null || sessionName == null) {
            log.warn("createSession missing machineId or sessionName");
            return;
        }

        log.info("Create session request: machine={}, session={}, owner={}", machineId, sessionName, ownerEmail);
        sessionManager.forwardCreateSession(machineId, sessionName, ownerEmail);
    }

    private void handleSessionCreated(Message message) {
        String sessionId = message.getSession();
        log.info("Session created: {}", sessionId);
        // The new session will auto-register via the agent's scanner
    }

    private void handleApiResponse(Message message) {
        Map<String, String> meta = message.getMeta();
        if (meta == null) {
            log.warn("API response missing meta");
            return;
        }

        String requestId = meta.get("requestId");
        if (requestId == null) {
            log.warn("API response missing requestId");
            return;
        }

        try {
            // Parse the response payload
            String payloadStr = meta.get("payload");
            @SuppressWarnings("unchecked")
            Map<String, Object> response = payloadStr != null
                    ? objectMapper.readValue(payloadStr, Map.class)
                    : Map.of();

            // Forward to internal API controller
            internalApiController.handleAgentResponse(requestId, response);
            log.debug("API response forwarded: requestId={}", requestId);
        } catch (Exception e) {
            log.error("Failed to handle API response", e);
        }
    }

    private void handleKillSession(WebSocketSession session, Message message) {
        String ownerEmail = extractOwnerFromSession(session);
        String sessionId = message.getSession();

        if (sessionId == null) {
            log.warn("killSession missing sessionId");
            return;
        }

        log.info("Kill session request: session={}, owner={}", sessionId, ownerEmail);
        sessionManager.forwardKillSession(sessionId, ownerEmail);
    }

    private String extractOwnerFromSession(WebSocketSession session) {
        // First check if we already have it cached
        String cached = sessionOwnerMap.get(session.getId());
        if (cached != null) {
            return cached;
        }

        // Try to extract from query param
        String token = extractTokenFromSession(session);
        if (token != null && jwtTokenProvider.validateToken(token)) {
            String email = jwtTokenProvider.getEmailFromToken(token);
            sessionOwnerMap.put(session.getId(), email);
            return email;
        }
        return null;
    }

    private String extractTokenFromSession(WebSocketSession session) {
        // First check if we already have it cached
        String cached = sessionTokenMap.get(session.getId());
        if (cached != null) {
            return cached;
        }

        // Try to extract from query param
        try {
            URI uri = session.getUri();
            if (uri != null && uri.getQuery() != null) {
                String query = uri.getQuery();
                for (String param : query.split("&")) {
                    String[] pair = param.split("=");
                    if (pair.length == 2 && "token".equals(pair[0])) {
                        return java.net.URLDecoder.decode(pair[1], "UTF-8");
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to extract token from session", e);
        }
        return null;
    }

    private void sendPlanLimitError(WebSocketSession session, PlanLimitService.PlanCheckResult limitCheck) {
        try {
            Message errorMessage = Message.builder()
                    .type("error")
                    .meta(Map.of(
                            "code", "PLAN_LIMIT_EXCEEDED",
                            "messageKo", limitCheck.messageKo(),
                            "messageEn", limitCheck.messageEn(),
                            "upgradeUrl", "https://sessioncast.io/pricing"
                    ))
                    .build();

            String json = objectMapper.writeValueAsString(errorMessage);
            synchronized (session) {
                if (session.isOpen()) {
                    session.sendMessage(new TextMessage(json));
                }
            }

            // Close the connection after sending error
            session.close(CloseStatus.POLICY_VIOLATION);
        } catch (IOException e) {
            log.error("Failed to send plan limit error", e);
        }
    }

    private void sendLimitExceededError(WebSocketSession session, String resource, int current, int max) {
        try {
            String messageKo = resource.equals("sessions")
                    ? String.format("세션 제한(%d개)에 도달했습니다. 더 많은 세션을 사용하려면 플랜을 업그레이드하세요.", max)
                    : String.format("에이전트 제한(%d개)에 도달했습니다. 더 많은 에이전트를 사용하려면 플랜을 업그레이드하세요.", max);
            String messageEn = resource.equals("sessions")
                    ? String.format("Session limit (%d) reached. Upgrade your plan for more sessions.", max)
                    : String.format("Agent limit (%d) reached. Upgrade your plan for more agents.", max);

            Message errorMessage = Message.builder()
                    .type("error")
                    .meta(Map.of(
                            "code", "LIMIT_EXCEEDED",
                            "resource", resource,
                            "current", String.valueOf(current),
                            "max", String.valueOf(max),
                            "messageKo", messageKo,
                            "messageEn", messageEn,
                            "upgradeUrl", "https://app.sessioncast.io/pricing"
                    ))
                    .build();

            String json = objectMapper.writeValueAsString(errorMessage);
            synchronized (session) {
                if (session.isOpen()) {
                    session.sendMessage(new TextMessage(json));
                }
            }

            // Close the connection after sending error
            session.close(CloseStatus.POLICY_VIOLATION);
        } catch (IOException e) {
            log.error("Failed to send limit exceeded error", e);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        log.info("WebSocket disconnected: id={}, status={}", session.getId(), status);
        sessionManager.handleDisconnect(session);
        sessionManager.handleAgentDisconnect(session);
        sessionOwnerMap.remove(session.getId());
        sessionTokenMap.remove(session.getId());
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        log.error("WebSocket transport error: id={}", session.getId(), exception);
    }
}
