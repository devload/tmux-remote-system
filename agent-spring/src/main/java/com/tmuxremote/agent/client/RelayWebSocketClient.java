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
    private final Consumer<String> onKeysReceived;
    private final AtomicBoolean isConnected = new AtomicBoolean(false);
    private final AtomicInteger reconnectAttempts = new AtomicInteger(0);
    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();

    private static final int MAX_RECONNECT_DELAY_MS = 30000;
    private static final int BASE_RECONNECT_DELAY_MS = 1000;

    public RelayWebSocketClient(URI serverUri, AgentConfig.SessionConfig sessionConfig,
                                String machineId, Consumer<String> onKeysReceived) {
        super(serverUri);
        this.sessionConfig = sessionConfig;
        this.machineId = machineId;
        this.onKeysReceived = onKeysReceived;
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
            Message registerMsg = Message.builder()
                    .type("register")
                    .role("host")
                    .session(sessionConfig.getId())
                    .meta(Map.of(
                            "label", sessionConfig.getLabel(),
                            "machineId", machineId
                    ))
                    .build();

            String json = objectMapper.writeValueAsString(registerMsg);
            send(json);
            log.info("Registered as host for session: {}", sessionConfig.getId());
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
        int jitter = (int) (Math.random() * delay * 0.2);
        return delay + jitter;
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
