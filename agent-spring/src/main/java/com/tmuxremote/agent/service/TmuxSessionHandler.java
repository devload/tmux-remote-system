package com.tmuxremote.agent.service;

import com.tmuxremote.agent.client.RelayWebSocketClient;
import com.tmuxremote.agent.dto.AgentConfig;
import com.tmuxremote.agent.service.tmux.TmuxExecutor;
import lombok.extern.slf4j.Slf4j;

import java.io.*;
import java.io.ByteArrayOutputStream;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.zip.GZIPOutputStream;

@Slf4j
public class TmuxSessionHandler {

    private final AgentConfig.SessionConfig sessionConfig;
    private final String machineId;
    private final String relayUrl;
    private final String agentToken;
    private final java.util.function.Consumer<String> onCreateSession;
    private final TmuxExecutor tmuxExecutor;
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);
    private final AtomicBoolean running = new AtomicBoolean(false);
    private final AtomicBoolean captureStarted = new AtomicBoolean(false);

    private RelayWebSocketClient wsClient;
    private String lastScreen = "";
    private long lastForceSendTime = 0;
    private long lastChangeTime = 0;

    // Capture interval: faster when active, slower when idle
    private static final int CAPTURE_INTERVAL_ACTIVE_MS = 50;   // 50ms when recently changed
    private static final int CAPTURE_INTERVAL_IDLE_MS = 200;    // 200ms when idle
    private static final long ACTIVE_THRESHOLD_MS = 2000;       // Consider active if changed within 2s
    private static final long FORCE_SEND_INTERVAL_MS = 10000;   // Force send every 10s (was 5s)
    private static final boolean USE_COMPRESSION = true;        // Enable gzip compression
    private static final int INITIAL_CONNECT_JITTER_MS = 5000;  // Random delay on first connect (0-5s)
    private static final int RECONNECT_BASE_DELAY_MS = 5000;    // Base delay for reconnection (increased)
    private static final int RECONNECT_MAX_DELAY_MS = 60000;    // Max 60 seconds
    private static final int MAX_RECONNECT_ATTEMPTS = 5;        // Max attempts before circuit breaker
    private static final int CIRCUIT_BREAKER_DURATION_MS = 120000; // 2 minutes cooldown

    private int reconnectAttempts = 0;
    private long circuitBreakerResetTime = 0;

    public TmuxSessionHandler(AgentConfig.SessionConfig sessionConfig, String machineId, String relayUrl, String agentToken,
                              java.util.function.Consumer<String> onCreateSession, TmuxExecutor tmuxExecutor) {
        this.sessionConfig = sessionConfig;
        this.machineId = machineId;
        this.relayUrl = relayUrl;
        this.agentToken = agentToken;
        this.onCreateSession = onCreateSession;
        this.tmuxExecutor = tmuxExecutor;
    }

    public void start() {
        running.set(true);
        // Add initial random delay to prevent thundering herd when multiple agents start simultaneously
        int initialDelay = (int) (Math.random() * INITIAL_CONNECT_JITTER_MS);
        log.info("Session {} will start in {} ms (jitter to prevent thundering herd)", sessionConfig.getId(), initialDelay);
        scheduler.schedule(this::connectAndRun, initialDelay, TimeUnit.MILLISECONDS);
    }

    private void connectAndRun() {
        while (running.get()) {
            // Check circuit breaker
            long now = System.currentTimeMillis();
            if (circuitBreakerResetTime > 0 && now < circuitBreakerResetTime) {
                long remainingSeconds = (circuitBreakerResetTime - now) / 1000;
                log.warn("Circuit breaker active for session {}. Waiting {} seconds before retry",
                        sessionConfig.getId(), remainingSeconds);
                try {
                    Thread.sleep(circuitBreakerResetTime - now);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    break;
                }
                // Reset after circuit breaker period
                circuitBreakerResetTime = 0;
                reconnectAttempts = 0;
                continue;
            }

            boolean connectionSucceeded = false;
            try {
                startWebSocketClient();
                // Connection successful - reset counters
                reconnectAttempts = 0;
                connectionSucceeded = true;

                if (!captureStarted.getAndSet(true)) {
                    startScreenCapture();
                }

                while (running.get() && wsClient != null && wsClient.isConnected()) {
                    Thread.sleep(1000);
                }
            } catch (Exception e) {
                log.error("Error in session handler for {}", sessionConfig.getId(), e);
            }

            if (running.get()) {
                int reconnectDelay;

                if (!connectionSucceeded) {
                    // Connection failed - apply exponential backoff
                    reconnectAttempts++;

                    // Check if we should activate circuit breaker
                    if (reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
                        log.error("Max reconnect attempts ({}) reached for session {}. Circuit breaker active for {} seconds",
                                MAX_RECONNECT_ATTEMPTS, sessionConfig.getId(), CIRCUIT_BREAKER_DURATION_MS / 1000);
                        circuitBreakerResetTime = System.currentTimeMillis() + CIRCUIT_BREAKER_DURATION_MS;
                        continue;
                    }

                    // Exponential backoff with jitter
                    int delay = (int) Math.min(
                            RECONNECT_BASE_DELAY_MS * Math.pow(2, reconnectAttempts - 1),
                            RECONNECT_MAX_DELAY_MS
                    );
                    int jitter = (int) (Math.random() * delay * 0.5);
                    reconnectDelay = delay + jitter;

                    log.info("Reconnecting session {} in {} ms (attempt {}/{})",
                            sessionConfig.getId(), reconnectDelay, reconnectAttempts, MAX_RECONNECT_ATTEMPTS);
                } else {
                    // Was connected but disconnected - small delay before reconnect
                    reconnectDelay = RECONNECT_BASE_DELAY_MS + (int) (Math.random() * 2000);
                    log.info("Session {} disconnected, reconnecting in {} ms", sessionConfig.getId(), reconnectDelay);
                }

                try {
                    Thread.sleep(reconnectDelay);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }
    }

    private void startWebSocketClient() throws Exception {
        URI uri = new URI(relayUrl);
        wsClient = new RelayWebSocketClient(uri, sessionConfig, machineId, agentToken, this::handleKeysInput, onCreateSession, this::handleResize, this::handleKillSession);
        wsClient.connectBlocking();
        log.info("WebSocket client connected for session: {}", sessionConfig.getId());
    }

    private void startScreenCapture() {
        // Use adaptive capture with variable delay
        scheduler.submit(() -> {
            while (running.get()) {
                if (wsClient == null || !wsClient.isConnected()) {
                    log.debug("Screen capture waiting for connection: session={}, wsClient={}, connected={}",
                            sessionConfig.getTmuxSession(), wsClient != null, wsClient != null && wsClient.isConnected());
                    sleep(500);
                    continue;
                }

                try {
                    String screen = capturePane();
                    if (screen != null) {
                        long now = System.currentTimeMillis();
                        boolean changed = !screen.equals(lastScreen);
                        boolean forceTime = (now - lastForceSendTime) >= FORCE_SEND_INTERVAL_MS;

                        if (changed || forceTime) {
                            lastScreen = screen;
                            lastForceSendTime = now;
                            if (changed) {
                                lastChangeTime = now;
                            }

                            // Send clear screen first, then the content
                            String fullOutput = "\u001b[2J\u001b[H" + screen;
                            byte[] data = fullOutput.getBytes(StandardCharsets.UTF_8);

                            // Compress if enabled and data is large enough
                            if (USE_COMPRESSION && data.length > 512) {
                                data = compress(data);
                                wsClient.sendScreenCompressed(data);
                                log.debug("Sent compressed screen: session={}, size={}", sessionConfig.getTmuxSession(), data.length);
                            } else {
                                wsClient.sendScreen(data);
                                log.debug("Sent screen: session={}, size={}", sessionConfig.getTmuxSession(), data.length);
                            }
                        }

                        // Adaptive sleep: faster when active, slower when idle
                        boolean isActive = (now - lastChangeTime) < ACTIVE_THRESHOLD_MS;
                        int sleepMs = isActive ? CAPTURE_INTERVAL_ACTIVE_MS : CAPTURE_INTERVAL_IDLE_MS;
                        sleep(sleepMs);
                    } else {
                        sleep(CAPTURE_INTERVAL_IDLE_MS);
                    }
                } catch (Exception e) {
                    log.error("Error capturing screen", e);
                    sleep(500);
                }
            }
        });

        log.info("Started adaptive screen capture for session: {}", sessionConfig.getTmuxSession());
    }

    private void sleep(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private byte[] compress(byte[] data) {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            try (GZIPOutputStream gzip = new GZIPOutputStream(baos)) {
                gzip.write(data);
            }
            return baos.toByteArray();
        } catch (IOException e) {
            log.warn("Compression failed, sending uncompressed");
            return data;
        }
    }

    private String capturePane() {
        try {
            return tmuxExecutor.capturePane(sessionConfig.getTmuxSession());
        } catch (Exception e) {
            log.error("Failed to capture pane", e);
            return null;
        }
    }

    private void handleResize(int cols, int rows) {
        try {
            tmuxExecutor.resizeWindow(sessionConfig.getTmuxSession(), cols, rows);
        } catch (Exception e) {
            log.error("Failed to resize tmux session", e);
        }
    }

    private void handleKillSession() {
        try {
            log.info("Killing tmux session: {}", sessionConfig.getTmuxSession());
            tmuxExecutor.killSession(sessionConfig.getTmuxSession());
            log.info("Killed tmux session: {}", sessionConfig.getTmuxSession());
            // Stop this handler as the session is killed
            stop();
        } catch (Exception e) {
            log.error("Failed to kill tmux session", e);
        }
    }

    private void handleKeysInput(String keys) {
        try {
            String session = sessionConfig.getTmuxSession();

            // Handle special keys
            if (keys.contains("\u0003")) {
                // Ctrl+C
                tmuxExecutor.sendSpecialKey(session, "C-c");
                return;
            }

            if (keys.contains("\u0004")) {
                // Ctrl+D
                tmuxExecutor.sendSpecialKey(session, "C-d");
                return;
            }

            // For Enter key, use send-keys without -l
            if (keys.equals("\n") || keys.equals("\r\n")) {
                tmuxExecutor.sendSpecialKey(session, "Enter");
                return;
            }

            // For text with newline at end (command + enter)
            if (keys.endsWith("\n")) {
                String cmd = keys.substring(0, keys.length() - 1);
                if (!cmd.isEmpty()) {
                    tmuxExecutor.sendKeys(session, cmd);
                }
                tmuxExecutor.sendSpecialKey(session, "Enter");
                return;
            }

            // Regular text input
            tmuxExecutor.sendKeys(session, keys);

            log.debug("Sent keys to tmux session: {}", session);
        } catch (Exception e) {
            log.error("Failed to send keys to tmux", e);
        }
    }

    public void stop() {
        running.set(false);

        if (wsClient != null) {
            wsClient.shutdown();
        }

        scheduler.shutdown();
        try {
            scheduler.awaitTermination(5, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        log.info("Session handler stopped for: {}", sessionConfig.getId());
    }
}
