package com.tmuxremote.relay.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tmuxremote.relay.dto.Message;
import com.tmuxremote.relay.service.SessionManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class RelayWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper;
    private final SessionManager sessionManager;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        log.info("WebSocket connected: id={}, remote={}",
                session.getId(), session.getRemoteAddress());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage textMessage) {
        try {
            String payload = textMessage.getPayload();
            Message message = objectMapper.readValue(payload, Message.class);

            log.debug("Received message: type={}, session={}", message.getType(), message.getSession());

            switch (message.getType()) {
                case "register" -> handleRegister(session, message);
                case "screen" -> handleScreen(message);
                case "keys" -> handleKeys(session, message);
                case "listSessions" -> handleListSessions(session);
                default -> log.warn("Unknown message type: {}", message.getType());
            }
        } catch (Exception e) {
            log.error("Failed to handle message", e);
        }
    }

    private void handleRegister(WebSocketSession session, Message message) {
        String role = message.getRole();
        String sessionId = message.getSession();

        if ("host".equals(role)) {
            Map<String, String> meta = message.getMeta();
            String label = meta != null ? meta.get("label") : sessionId;
            String machineId = meta != null ? meta.get("machineId") : "unknown";

            sessionManager.registerHost(sessionId, label, machineId, session);
            log.info("Host registered: session={}, machine={}", sessionId, machineId);
        } else if ("viewer".equals(role)) {
            sessionManager.registerViewer(sessionId, session);
            log.info("Viewer registered: session={}", sessionId);
        }
    }

    private void handleScreen(Message message) {
        sessionManager.handleScreen(message.getSession(), message.getPayload());
    }

    private void handleKeys(WebSocketSession session, Message message) {
        sessionManager.handleKeys(message.getSession(), message.getPayload(), session);
    }

    private void handleListSessions(WebSocketSession session) {
        sessionManager.sendSessionList(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        log.info("WebSocket disconnected: id={}, status={}", session.getId(), status);
        sessionManager.handleDisconnect(session);
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        log.error("WebSocket transport error: id={}", session.getId(), exception);
    }
}
