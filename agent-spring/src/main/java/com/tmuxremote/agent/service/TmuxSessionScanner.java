package com.tmuxremote.agent.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.Set;

@Slf4j
@Component
public class TmuxSessionScanner {

    public Set<String> scanSessions() {
        Set<String> sessions = new HashSet<>();
        try {
            ProcessBuilder pb = new ProcessBuilder("tmux", "ls", "-F", "#{session_name}");
            pb.redirectErrorStream(false);
            Process process = pb.start();

            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    String sessionName = line.trim();
                    if (!sessionName.isEmpty()) {
                        sessions.add(sessionName);
                    }
                }
            }

            // Consume error stream
            try (BufferedReader errReader = new BufferedReader(
                    new InputStreamReader(process.getErrorStream(), StandardCharsets.UTF_8))) {
                while (errReader.readLine() != null) {
                    // Discard
                }
            }

            process.waitFor();
        } catch (Exception e) {
            log.error("Failed to scan tmux sessions", e);
        }
        return sessions;
    }
}
