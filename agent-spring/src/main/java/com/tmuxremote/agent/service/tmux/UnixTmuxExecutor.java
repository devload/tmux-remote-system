package com.tmuxremote.agent.service.tmux;

import lombok.extern.slf4j.Slf4j;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Unix/Linux/macOS implementation of TmuxExecutor.
 * Executes tmux commands directly through the system shell.
 */
@Slf4j
public class UnixTmuxExecutor implements TmuxExecutor {

    @Override
    public List<String> listSessions() {
        List<String> sessions = new ArrayList<>();
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

            consumeErrorStream(process);
            process.waitFor(5, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("Failed to list tmux sessions", e);
        }
        return sessions;
    }

    @Override
    public String capturePane(String session) {
        try {
            ProcessBuilder pb = new ProcessBuilder(
                "tmux", "capture-pane", "-t", session, "-p", "-e", "-N"
            );
            pb.redirectErrorStream(false);
            Process process = pb.start();

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            byte[] buffer = new byte[4096];
            int bytesRead;
            InputStream is = process.getInputStream();
            while ((bytesRead = is.read(buffer)) != -1) {
                baos.write(buffer, 0, bytesRead);
            }

            consumeErrorStream(process);
            process.waitFor(1, TimeUnit.SECONDS);

            String content = baos.toString(StandardCharsets.UTF_8);
            return content.replace("\n", "\r\n");
        } catch (Exception e) {
            log.error("Failed to capture pane for session: {}", session, e);
            return null;
        }
    }

    @Override
    public void sendKeys(String session, String text) {
        try {
            ProcessBuilder pb = new ProcessBuilder(
                "tmux", "send-keys", "-t", session, "-l", text
            );
            pb.redirectErrorStream(true);
            Process process = pb.start();
            process.waitFor(1, TimeUnit.SECONDS);
            log.debug("Sent keys to session: {}", session);
        } catch (Exception e) {
            log.error("Failed to send keys to session: {}", session, e);
        }
    }

    @Override
    public void sendSpecialKey(String session, String key) {
        try {
            ProcessBuilder pb = new ProcessBuilder(
                "tmux", "send-keys", "-t", session, key
            );
            pb.redirectErrorStream(true);
            Process process = pb.start();
            process.waitFor(1, TimeUnit.SECONDS);
            log.debug("Sent special key {} to session: {}", key, session);
        } catch (Exception e) {
            log.error("Failed to send special key to session: {}", session, e);
        }
    }

    @Override
    public void resizeWindow(String session, int cols, int rows) {
        try {
            ProcessBuilder pb = new ProcessBuilder(
                "tmux", "resize-window", "-t", session, "-x", String.valueOf(cols), "-y", String.valueOf(rows)
            );
            pb.redirectErrorStream(true);
            Process process = pb.start();
            process.waitFor(2, TimeUnit.SECONDS);
            log.info("Resized session {} to {}x{}", session, cols, rows);
        } catch (Exception e) {
            log.error("Failed to resize session: {}", session, e);
        }
    }

    @Override
    public void killSession(String session) {
        try {
            ProcessBuilder pb = new ProcessBuilder(
                "tmux", "kill-session", "-t", session
            );
            pb.redirectErrorStream(true);
            Process process = pb.start();
            process.waitFor(2, TimeUnit.SECONDS);
            log.info("Killed session: {}", session);
        } catch (Exception e) {
            log.error("Failed to kill session: {}", session, e);
        }
    }

    @Override
    public void createSession(String session, String workingDir) {
        try {
            List<String> command = new ArrayList<>();
            command.add("tmux");
            command.add("new-session");
            command.add("-d");
            command.add("-s");
            command.add(session);
            if (workingDir != null && !workingDir.isEmpty()) {
                command.add("-c");
                command.add(workingDir);
            }

            ProcessBuilder pb = new ProcessBuilder(command);
            pb.redirectErrorStream(true);
            Process process = pb.start();
            process.waitFor(2, TimeUnit.SECONDS);
            log.info("Created session: {} in {}", session, workingDir);
        } catch (Exception e) {
            log.error("Failed to create session: {}", session, e);
        }
    }

    @Override
    public boolean isAvailable() {
        try {
            ProcessBuilder pb = new ProcessBuilder("which", "tmux");
            Process process = pb.start();
            int exitCode = process.waitFor();
            return exitCode == 0;
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public String getVersion() {
        try {
            ProcessBuilder pb = new ProcessBuilder("tmux", "-V");
            pb.redirectErrorStream(true);
            Process process = pb.start();

            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                String line = reader.readLine();
                process.waitFor(1, TimeUnit.SECONDS);
                return line;
            }
        } catch (Exception e) {
            log.error("Failed to get tmux version", e);
            return null;
        }
    }

    private void consumeErrorStream(Process process) {
        try (BufferedReader errReader = new BufferedReader(
                new InputStreamReader(process.getErrorStream(), StandardCharsets.UTF_8))) {
            while (errReader.readLine() != null) {
                // Discard
            }
        } catch (Exception e) {
            // Ignore
        }
    }
}
