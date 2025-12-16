package com.tmuxremote.agent.service;

import com.tmuxremote.agent.client.RelayWebSocketClient;
import com.tmuxremote.agent.dto.AgentConfig;
import lombok.extern.slf4j.Slf4j;

import java.io.*;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
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
    private static final int RECONNECT_BASE_DELAY_MS = 3000;    // Base delay for reconnection
    private static final int RECONNECT_MAX_JITTER_MS = 3000;    // Max additional jitter for reconnection

    public TmuxSessionHandler(AgentConfig.SessionConfig sessionConfig, String machineId, String relayUrl, String agentToken,
                              java.util.function.Consumer<String> onCreateSession) {
        this.sessionConfig = sessionConfig;
        this.machineId = machineId;
        this.relayUrl = relayUrl;
        this.agentToken = agentToken;
        this.onCreateSession = onCreateSession;
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
            try {
                startWebSocketClient();
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
                // Add jitter to reconnection delay to prevent thundering herd
                int reconnectDelay = RECONNECT_BASE_DELAY_MS + (int) (Math.random() * RECONNECT_MAX_JITTER_MS);
                log.info("Reconnecting session handler for {} in {} ms...", sessionConfig.getId(), reconnectDelay);
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
            // Use -p for stdout, -e for escape sequences (colors), -N to preserve trailing spaces
            ProcessBuilder pb = new ProcessBuilder(
                "tmux", "capture-pane", "-t", sessionConfig.getTmuxSession(), "-p", "-e", "-N"
            );
            pb.redirectErrorStream(false);

            Process process = pb.start();

            // Read raw bytes to preserve UTF-8 encoding
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            byte[] buffer = new byte[4096];
            int bytesRead;
            InputStream is = process.getInputStream();
            while ((bytesRead = is.read(buffer)) != -1) {
                baos.write(buffer, 0, bytesRead);
            }

            // Consume error stream to prevent blocking
            try (BufferedReader errReader = new BufferedReader(
                    new InputStreamReader(process.getErrorStream(), StandardCharsets.UTF_8))) {
                while (errReader.readLine() != null) {
                    // Discard errors
                }
            }

            process.waitFor(1, TimeUnit.SECONDS);

            // Convert to string preserving UTF-8, then normalize line endings
            String content = baos.toString(StandardCharsets.UTF_8);
            return content.replace("\n", "\r\n");
        } catch (Exception e) {
            log.error("Failed to capture pane", e);
            return null;
        }
    }

    private void handleResize(int cols, int rows) {
        try {
            // Resize the tmux window/pane
            ProcessBuilder pb = new ProcessBuilder(
                "tmux", "resize-window", "-t", sessionConfig.getTmuxSession(), "-x", String.valueOf(cols), "-y", String.valueOf(rows)
            );
            pb.redirectErrorStream(true);
            Process process = pb.start();
            process.waitFor(2, TimeUnit.SECONDS);
            log.info("Resized tmux session {} to {}x{}", sessionConfig.getTmuxSession(), cols, rows);
        } catch (Exception e) {
            log.error("Failed to resize tmux session", e);
        }
    }

    private void handleKillSession() {
        try {
            log.info("Killing tmux session: {}", sessionConfig.getTmuxSession());
            ProcessBuilder pb = new ProcessBuilder(
                "tmux", "kill-session", "-t", sessionConfig.getTmuxSession()
            );
            pb.redirectErrorStream(true);
            Process process = pb.start();
            process.waitFor(2, TimeUnit.SECONDS);
            log.info("Killed tmux session: {}", sessionConfig.getTmuxSession());
            // Stop this handler as the session is killed
            stop();
        } catch (Exception e) {
            log.error("Failed to kill tmux session", e);
        }
    }

    private void handleKeysInput(String keys) {
        try {
            // Handle special keys
            if (keys.contains("\u0003")) {
                // Ctrl+C
                ProcessBuilder pb = new ProcessBuilder(
                    "tmux", "send-keys", "-t", sessionConfig.getTmuxSession(), "C-c"
                );
                pb.start().waitFor(1, TimeUnit.SECONDS);
                return;
            }

            if (keys.contains("\u0004")) {
                // Ctrl+D
                ProcessBuilder pb = new ProcessBuilder(
                    "tmux", "send-keys", "-t", sessionConfig.getTmuxSession(), "C-d"
                );
                pb.start().waitFor(1, TimeUnit.SECONDS);
                return;
            }

            // For Enter key, use send-keys without -l
            if (keys.equals("\n") || keys.equals("\r\n")) {
                ProcessBuilder pb = new ProcessBuilder(
                    "tmux", "send-keys", "-t", sessionConfig.getTmuxSession(), "Enter"
                );
                pb.start().waitFor(1, TimeUnit.SECONDS);
                return;
            }

            // For text with newline at end (command + enter)
            if (keys.endsWith("\n")) {
                String cmd = keys.substring(0, keys.length() - 1);
                if (!cmd.isEmpty()) {
                    ProcessBuilder pb1 = new ProcessBuilder(
                        "tmux", "send-keys", "-t", sessionConfig.getTmuxSession(), "-l", cmd
                    );
                    pb1.start().waitFor(1, TimeUnit.SECONDS);
                }
                ProcessBuilder pb2 = new ProcessBuilder(
                    "tmux", "send-keys", "-t", sessionConfig.getTmuxSession(), "Enter"
                );
                pb2.start().waitFor(1, TimeUnit.SECONDS);
                return;
            }

            // Regular text input
            ProcessBuilder pb = new ProcessBuilder(
                "tmux", "send-keys", "-t", sessionConfig.getTmuxSession(), "-l", keys
            );
            pb.redirectErrorStream(true);
            pb.start().waitFor(1, TimeUnit.SECONDS);

            log.debug("Sent keys to tmux session: {}", sessionConfig.getTmuxSession());
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
