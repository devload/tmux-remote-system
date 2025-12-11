package com.tmuxremote.agent.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tmuxremote.agent.dto.AgentConfig;
import com.tmuxremote.agent.dto.Message;
import lombok.extern.slf4j.Slf4j;
import org.java_websocket.client.WebSocketClient;
import org.java_websocket.handshake.ServerHandshake;

import java.net.URI;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Consumer;

@Slf4j
public class RelayWebSocketClient extends WebSocketClient {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final AgentConfig.SessionConfig sessionConfig;
    private final String machineId;
    private final String agentToken;
    private final Consumer<String> onKeysReceived;
    private final Consumer<String> onCreateSession;
    private final java.util.function.BiConsumer<Integer, Integer> onResize;
    private final Runnable onKillSession;
    private final AtomicBoolean isConnected = new AtomicBoolean(false);
    private final AtomicInteger reconnectAttempts = new AtomicInteger(0);
    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();

    private static final int MAX_RECONNECT_DELAY_MS = 30000;
    private static final int BASE_RECONNECT_DELAY_MS = 1000;
    private static final int INITIAL_CONNECT_JITTER_MS = 3000; // Random delay on first connect

    public RelayWebSocketClient(URI serverUri, AgentConfig.SessionConfig sessionConfig,
                                String machineId, String agentToken, Consumer<String> onKeysReceived,
                                Consumer<String> onCreateSession,
                                java.util.function.BiConsumer<Integer, Integer> onResize,
                                Runnable onKillSession) {
        super(serverUri);
        this.sessionConfig = sessionConfig;
        this.machineId = machineId;
        this.agentToken = agentToken;
        this.onKeysReceived = onKeysReceived;
        this.onCreateSession = onCreateSession;
        this.onResize = onResize;
        this.onKillSession = onKillSession;
    }

    @Override
    public void onOpen(ServerHandshake handshake) {
        log.info("Connected to relay for session: {}", sessionConfig.getId());
        isConnected.set(true);
        reconnectAttempts.set(0);
        registerAsHost();
    }

    @Override
    public void onMessage(String message) {
        try {
            Message msg = objectMapper.readValue(message, Message.class);
            log.debug("Received message: type={}", msg.getType());

            if ("keys".equals(msg.getType()) && sessionConfig.getId().equals(msg.getSession())) {
                String keys = msg.getPayload();
                if (keys != null && onKeysReceived != null) {
                    onKeysReceived.accept(keys);
                }
            } else if ("resize".equals(msg.getType()) && sessionConfig.getId().equals(msg.getSession())) {
                Map<String, String> meta = msg.getMeta();
                if (meta != null && onResize != null) {
                    try {
                        int cols = Integer.parseInt(meta.get("cols"));
                        int rows = Integer.parseInt(meta.get("rows"));
                        log.info("Received resize request: {}x{}", cols, rows);
                        onResize.accept(cols, rows);
                    } catch (NumberFormatException e) {
                        log.warn("Invalid resize dimensions");
                    }
                }
            } else if ("createSession".equals(msg.getType())) {
                Map<String, String> meta = msg.getMeta();
                if (meta != null && onCreateSession != null) {
                    String sessionName = meta.get("sessionName");
                    if (sessionName != null) {
                        log.info("Received createSession request: {}", sessionName);
                        onCreateSession.accept(sessionName);
                    }
                }
            } else if ("killSession".equals(msg.getType()) && sessionConfig.getId().equals(msg.getSession())) {
                log.info("Received killSession request for: {}", sessionConfig.getId());
                if (onKillSession != null) {
                    onKillSession.run();
                }
            }
        } catch (Exception e) {
            log.error("Failed to process message", e);
        }
    }

    @Override
    public void onClose(int code, String reason, boolean remote) {
        log.warn("Disconnected from relay: session={}, code={}, reason={}, remote={}",
                sessionConfig.getId(), code, reason, remote);
        isConnected.set(false);
        scheduleReconnect();
    }

    @Override
    public void onError(Exception ex) {
        log.error("WebSocket error for session {}", sessionConfig.getId(), ex);
    }

    private void registerAsHost() {
        try {
            Map<String, String> meta = new java.util.HashMap<>();
            meta.put("label", sessionConfig.getLabel());
            meta.put("machineId", machineId);
            if (agentToken != null && !agentToken.isEmpty()) {
                meta.put("token", agentToken);
            }

            Message registerMsg = Message.builder()
                    .type("register")
                    .role("host")
                    .session(sessionConfig.getId())
                    .meta(meta)
                    .build();

            String json = objectMapper.writeValueAsString(registerMsg);
            send(json);
            log.info("Registered as host for session: {} (token: {})", sessionConfig.getId(),
                    agentToken != null ? "present" : "none");
        } catch (Exception e) {
            log.error("Failed to register as host", e);
        }
    }

    public void sendScreen(byte[] data) {
        if (!isConnected.get() || !isOpen()) {
            return;
        }

        try {
            String base64Data = Base64.getEncoder().encodeToString(data);
            Message screenMsg = Message.builder()
                    .type("screen")
                    .session(sessionConfig.getId())
                    .payload(base64Data)
                    .build();

            String json = objectMapper.writeValueAsString(screenMsg);
            send(json);
        } catch (Exception e) {
            log.error("Failed to send screen data", e);
        }
    }

    public void sendScreenCompressed(byte[] compressedData) {
        if (!isConnected.get() || !isOpen()) {
            return;
        }

        try {
            String base64Data = Base64.getEncoder().encodeToString(compressedData);
            Message screenMsg = Message.builder()
                    .type("screenGz")  // Indicate compressed data
                    .session(sessionConfig.getId())
                    .payload(base64Data)
                    .build();

            String json = objectMapper.writeValueAsString(screenMsg);
            send(json);
        } catch (Exception e) {
            log.error("Failed to send compressed screen data", e);
        }
    }

    private void scheduleReconnect() {
        int attempts = reconnectAttempts.incrementAndGet();
        int delay = calculateBackoffDelay(attempts);

        log.info("Scheduling reconnect for session {} in {} ms (attempt {})",
                sessionConfig.getId(), delay, attempts);

        scheduler.schedule(() -> {
            try {
                if (!isConnected.get()) {
                    log.info("Attempting reconnect for session: {}", sessionConfig.getId());
                    reconnect();
                }
            } catch (Exception e) {
                log.error("Reconnect failed for session {}", sessionConfig.getId(), e);
                scheduleReconnect();
            }
        }, delay, TimeUnit.MILLISECONDS);
    }

    private int calculateBackoffDelay(int attempts) {
        int delay = (int) Math.min(
                BASE_RECONNECT_DELAY_MS * Math.pow(2, attempts - 1),
                MAX_RECONNECT_DELAY_MS
        );
        // 50% jitter to spread out reconnection attempts
        int jitter = (int) (Math.random() * delay * 0.5);
        return delay + jitter;
    }

    /**
     * Connect with initial random delay to prevent thundering herd
     */
    public void connectWithJitter() {
        int jitter = (int) (Math.random() * INITIAL_CONNECT_JITTER_MS);
        log.info("Scheduling initial connect for session {} in {} ms", sessionConfig.getId(), jitter);
        scheduler.schedule(() -> {
            try {
                connect();
            } catch (Exception e) {
                log.error("Initial connect failed for session {}", sessionConfig.getId(), e);
                scheduleReconnect();
            }
        }, jitter, TimeUnit.MILLISECONDS);
    }

    public void shutdown() {
        scheduler.shutdown();
        try {
            closeBlocking();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    public boolean isConnected() {
        return isConnected.get();
    }
}
