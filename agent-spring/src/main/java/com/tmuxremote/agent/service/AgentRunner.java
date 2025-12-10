package com.tmuxremote.agent.service;

import com.tmuxremote.agent.config.ConfigLoader;
import com.tmuxremote.agent.dto.AgentConfig;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class AgentRunner implements CommandLineRunner {

    private final ConfigLoader configLoader;
    private final TmuxSessionScanner sessionScanner;
    private final Map<String, TmuxSessionHandler> handlers = new ConcurrentHashMap<>();
    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();

    private String machineId;
    private String relayUrl;
    private static final long SCAN_INTERVAL_SECONDS = 5;

    @Override
    public void run(String... args) throws Exception {
        log.info("Starting TMUX Remote Host Agent...");

        AgentConfig config = configLoader.loadConfig();
        this.machineId = config.getMachineId();
        this.relayUrl = config.getRelay();
        log.info("Loaded configuration: machineId={}, relay={}", machineId, relayUrl);

        // Initial scan
        scanAndUpdateSessions();

        // Schedule periodic scan for new/removed sessions
        scheduler.scheduleAtFixedRate(this::scanAndUpdateSessions,
                SCAN_INTERVAL_SECONDS, SCAN_INTERVAL_SECONDS, TimeUnit.SECONDS);

        log.info("Host Agent started with auto-discovery (scanning every {}s)", SCAN_INTERVAL_SECONDS);

        Runtime.getRuntime().addShutdownHook(new Thread(this::shutdown));
    }

    private void scanAndUpdateSessions() {
        try {
            Set<String> currentTmuxSessions = sessionScanner.scanSessions();
            Set<String> trackedSessions = handlers.keySet();

            // Start handlers for new sessions
            for (String session : currentTmuxSessions) {
                if (!trackedSessions.contains(session)) {
                    startSessionHandler(session);
                }
            }

            // Stop handlers for removed sessions
            for (String session : trackedSessions) {
                if (!currentTmuxSessions.contains(session)) {
                    stopSessionHandler(session);
                }
            }
        } catch (Exception e) {
            log.error("Error during session scan", e);
        }
    }

    private void startSessionHandler(String tmuxSession) {
        log.info("Discovered new tmux session: {}", tmuxSession);

        AgentConfig.SessionConfig sessionConfig = new AgentConfig.SessionConfig();
        sessionConfig.setId(machineId + "/" + tmuxSession);
        sessionConfig.setTmuxSession(tmuxSession);
        sessionConfig.setLabel(tmuxSession);

        TmuxSessionHandler handler = new TmuxSessionHandler(sessionConfig, machineId, relayUrl);
        handlers.put(tmuxSession, handler);
        handler.start();

        log.info("Started handler for session: {}", sessionConfig.getId());
    }

    private void stopSessionHandler(String tmuxSession) {
        log.info("Tmux session removed: {}", tmuxSession);

        TmuxSessionHandler handler = handlers.remove(tmuxSession);
        if (handler != null) {
            handler.stop();
            log.info("Stopped handler for session: {}/{}", machineId, tmuxSession);
        }
    }

    @PreDestroy
    public void shutdown() {
        log.info("Shutting down Host Agent...");
        scheduler.shutdown();
        for (TmuxSessionHandler handler : handlers.values()) {
            handler.stop();
        }
        log.info("Host Agent shutdown complete");
    }
}
