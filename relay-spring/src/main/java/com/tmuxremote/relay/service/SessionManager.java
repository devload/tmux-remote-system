package com.tmuxremote.relay.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tmuxremote.relay.dto.Message;
import com.tmuxremote.relay.dto.SessionInfo;
import com.tmuxremote.relay.dto.SessionListItem;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class SessionManager {

    private final ObjectMapper objectMapper;
    private final Map<String, SessionInfo> sessions = new ConcurrentHashMap<>();
    private final Map<String, WebSocketSession> viewerSessionMap = new ConcurrentHashMap<>();

    public void registerHost(String sessionId, String label, String machineId, WebSocketSession wsSession) {
        SessionInfo existing = sessions.get(sessionId);
        if (existing != null && existing.getHostSession() != null) {
            log.warn("Host already registered for session: {}, replacing", sessionId);
        }

        SessionInfo sessionInfo = SessionInfo.create(sessionId, label, machineId, wsSession);
        if (existing != null) {
            sessionInfo.setViewers(existing.getViewers());
        }
        sessions.put(sessionId, sessionInfo);

        log.info("Host registered: session={}, machine={}", sessionId, machineId);
        broadcastSessionList();
    }

    public void registerViewer(String sessionId, WebSocketSession wsSession) {
        viewerSessionMap.put(wsSession.getId(), wsSession);

        SessionInfo sessionInfo = sessions.get(sessionId);
        if (sessionInfo != null) {
            sessionInfo.getViewers().add(wsSession);
            log.info("Viewer registered: session={}, viewerId={}", sessionId, wsSession.getId());
        } else {
            SessionInfo newSession = SessionInfo.builder()
                    .id(sessionId)
                    .status("offline")
                    .viewers(ConcurrentHashMap.newKeySet())
                    .build();
            newSession.getViewers().add(wsSession);
            sessions.put(sessionId, newSession);
            log.info("Viewer registered for offline session: session={}", sessionId);
        }
    }

    public void handleScreen(String sessionId, String payload) {
        SessionInfo sessionInfo = sessions.get(sessionId);
        if (sessionInfo == null) {
            log.warn("Screen data for unknown session: {}", sessionId);
            return;
        }

        Message screenMessage = Message.builder()
                .type("screen")
                .session(sessionId)
                .payload(payload)
                .build();

        broadcastToViewers(sessionInfo, screenMessage);
    }

    public void handleKeys(String sessionId, String payload, WebSocketSession viewerSession) {
        SessionInfo sessionInfo = sessions.get(sessionId);
        if (sessionInfo == null || sessionInfo.getHostSession() == null) {
            log.warn("Keys for unavailable session: {}", sessionId);
            return;
        }

        Message keysMessage = Message.builder()
                .type("keys")
                .session(sessionId)
                .payload(payload)
                .build();

        sendMessage(sessionInfo.getHostSession(), keysMessage);
    }

    public void sendSessionList(WebSocketSession wsSession) {
        List<SessionListItem> sessionList = sessions.values().stream()
                .map(SessionListItem::from)
                .toList();

        Message listMessage = Message.builder()
                .type("sessionList")
                .build();

        try {
            String json = objectMapper.writeValueAsString(Map.of(
                    "type", "sessionList",
                    "sessions", sessionList
            ));
            wsSession.sendMessage(new TextMessage(json));
        } catch (IOException e) {
            log.error("Failed to send session list", e);
        }
    }

    public void handleDisconnect(WebSocketSession wsSession) {
        sessions.forEach((sessionId, info) -> {
            if (info.getHostSession() != null &&
                    info.getHostSession().getId().equals(wsSession.getId())) {
                info.setHostSession(null);
                info.setStatus("offline");
                log.info("Host disconnected: session={}", sessionId);

                broadcastSessionStatus(sessionId, "offline");
                broadcastSessionList();
            }

            info.getViewers().remove(wsSession);
        });

        viewerSessionMap.remove(wsSession.getId());
    }

    private void broadcastToViewers(SessionInfo sessionInfo, Message message) {
        sessionInfo.getViewers().forEach(viewer -> sendMessage(viewer, message));
    }

    private void broadcastSessionStatus(String sessionId, String status) {
        Message statusMessage = Message.builder()
                .type("sessionStatus")
                .session(sessionId)
                .build();

        try {
            String json = objectMapper.writeValueAsString(Map.of(
                    "type", "sessionStatus",
                    "session", sessionId,
                    "status", status
            ));

            SessionInfo sessionInfo = sessions.get(sessionId);
            if (sessionInfo != null) {
                sessionInfo.getViewers().forEach(viewer -> {
                    try {
                        if (viewer.isOpen()) {
                            viewer.sendMessage(new TextMessage(json));
                        }
                    } catch (IOException e) {
                        log.error("Failed to send status to viewer", e);
                    }
                });
            }
        } catch (IOException e) {
            log.error("Failed to serialize status message", e);
        }
    }

    private void broadcastSessionList() {
        List<SessionListItem> sessionList = sessions.values().stream()
                .map(SessionListItem::from)
                .toList();

        try {
            String json = objectMapper.writeValueAsString(Map.of(
                    "type", "sessionList",
                    "sessions", sessionList
            ));

            viewerSessionMap.values().forEach(viewer -> {
                try {
                    if (viewer.isOpen()) {
                        viewer.sendMessage(new TextMessage(json));
                    }
                } catch (IOException e) {
                    log.error("Failed to broadcast session list", e);
                }
            });
        } catch (IOException e) {
            log.error("Failed to serialize session list", e);
        }
    }

    private void sendMessage(WebSocketSession session, Message message) {
        try {
            if (session != null && session.isOpen()) {
                String json = objectMapper.writeValueAsString(message);
                session.sendMessage(new TextMessage(json));
            }
        } catch (IOException e) {
            log.error("Failed to send message to session {}", session.getId(), e);
        }
    }
}
